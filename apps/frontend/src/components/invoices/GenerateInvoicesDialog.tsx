// ===========================================
// Generate Invoices Dialog
// ===========================================
// Dialog for bulk generating term invoices

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useGenerateTermInvoices } from '../../hooks/useInvoices';
import { Term } from '../../api/admin.api';
import { Family } from '../../api/users.api';

interface GenerateInvoicesDialogProps {
  open: boolean;
  onClose: () => void;
  terms: Term[];
  families: Family[];
}

export default function GenerateInvoicesDialog({
  open,
  onClose,
  terms,
  families,
}: GenerateInvoicesDialogProps) {
  const [termId, setTermId] = useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [generateForAll, setGenerateForAll] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [groupRate, setGroupRate] = useState('');
  const [individualRate, setIndividualRate] = useState('');

  const generateMutation = useGenerateTermInvoices();

  const handleGenerate = async () => {
    if (!termId) return;

    await generateMutation.mutateAsync({
      termId,
      familyIds: generateForAll ? undefined : selectedFamilyIds,
      dueDate: dueDate || undefined,
      groupRate: groupRate ? parseFloat(groupRate) : undefined,
      individualRate: individualRate ? parseFloat(individualRate) : undefined,
    });

    // Reset form and close
    handleClose();
  };

  const handleClose = () => {
    setTermId('');
    setSelectedFamilyIds([]);
    setGenerateForAll(true);
    setDueDate('');
    setGroupRate('');
    setIndividualRate('');
    onClose();
  };

  const handleFamilyToggle = (familyId: string) => {
    setSelectedFamilyIds((prev) =>
      prev.includes(familyId)
        ? prev.filter((id) => id !== familyId)
        : [...prev, familyId]
    );
  };

  // Get default due date (14 days from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Term Invoices</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            Generate invoices for all enrolled students in a term. Invoices will
            be created based on lesson enrollments with appropriate pricing for
            hybrid lessons.
          </Alert>

          {/* Term Selection */}
          <FormControl fullWidth required>
            <InputLabel>Term</InputLabel>
            <Select
              value={termId}
              label="Term"
              onChange={(e: SelectChangeEvent) => setTermId(e.target.value)}
            >
              {terms.map((term) => (
                <MenuItem key={term.id} value={term.id}>
                  {term.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Family Selection */}
          <FormControlLabel
            control={
              <Checkbox
                checked={generateForAll}
                onChange={(e) => setGenerateForAll(e.target.checked)}
              />
            }
            label="Generate for all families with enrollments"
          />

          {!generateForAll && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Families
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {families.map((family) => (
                  <Chip
                    key={family.id}
                    label={family.name}
                    clickable
                    color={
                      selectedFamilyIds.includes(family.id)
                        ? 'primary'
                        : 'default'
                    }
                    onClick={() => handleFamilyToggle(family.id)}
                  />
                ))}
              </Box>
              {selectedFamilyIds.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedFamilyIds.length} family/families selected
                </Typography>
              )}
            </Box>
          )}

          {/* Due Date */}
          <TextField
            fullWidth
            type="date"
            label="Due Date"
            value={dueDate || getDefaultDueDate()}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Default: 14 days from now"
          />

          {/* Custom Pricing (Optional) */}
          <Typography variant="subtitle2" color="text.secondary">
            Custom Pricing (Optional)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Group Rate ($/week)"
                value={groupRate}
                onChange={(e) => setGroupRate(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Default: $25/week"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Individual Rate ($/week)"
                value={individualRate}
                onChange={(e) => setIndividualRate(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Default: $45/week"
              />
            </Grid>
          </Grid>

          {generateMutation.isError && (
            <Alert severity="error">
              {(generateMutation.error as Error)?.message ||
                'Failed to generate invoices'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={generateMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={
            !termId ||
            (!generateForAll && selectedFamilyIds.length === 0) ||
            generateMutation.isPending
          }
          startIcon={
            generateMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Invoices'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
