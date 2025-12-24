// ===========================================
// Record Payment Dialog
// ===========================================
// Dialog for recording manual payments on invoices

import { useState, useEffect } from 'react';
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
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useRecordPayment } from '../../hooks/useInvoices';
import { Invoice, PaymentMethod, RecordPaymentInput } from '../../api/invoices.api';

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(num);
}

export default function RecordPaymentDialog({
  open,
  onClose,
  invoice,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const recordMutation = useRecordPayment();

  // Calculate remaining balance
  const remainingBalance = invoice
    ? parseFloat(invoice.total) - parseFloat(invoice.amountPaid)
    : 0;

  // Set default amount to remaining balance when dialog opens
  useEffect(() => {
    if (open && invoice) {
      setAmount(remainingBalance.toFixed(2));
    }
  }, [open, invoice, remainingBalance]);

  const handleRecord = async () => {
    if (!invoice || !amount) return;

    const data: RecordPaymentInput = {
      amount: parseFloat(amount),
      method,
      reference: reference || undefined,
      notes: notes || undefined,
    };

    await recordMutation.mutateAsync({ id: invoice.id, data });
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setMethod('BANK_TRANSFER');
    setReference('');
    setNotes('');
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isAmountValid = parsedAmount > 0 && parsedAmount <= remainingBalance + 0.01;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {invoice && (
            <Box
              sx={{
                p: 2,
                bgcolor: '#FCF6E6',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Invoice Details
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {invoice.invoiceNumber} - {invoice.family.name}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1,
                }}
              >
                <Typography variant="body2">Total:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(invoice.total)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Already Paid:</Typography>
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  {formatCurrency(invoice.amountPaid)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  mt: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Remaining Balance:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: 'primary.main' }}
                >
                  {formatCurrency(remainingBalance)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Amount */}
          <TextField
            fullWidth
            required
            type="number"
            label="Payment Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            inputProps={{ min: 0, step: 0.01, max: remainingBalance + 0.01 }}
            error={amount !== '' && !isAmountValid}
            helperText={
              amount !== '' && !isAmountValid
                ? `Amount cannot exceed remaining balance (${formatCurrency(remainingBalance)})`
                : undefined
            }
          />

          {/* Payment Method */}
          <FormControl fullWidth required>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={method}
              label="Payment Method"
              onChange={(e: SelectChangeEvent) =>
                setMethod(e.target.value as PaymentMethod)
              }
            >
              {PAYMENT_METHODS.map((pm) => (
                <MenuItem key={pm.value} value={pm.value}>
                  {pm.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reference */}
          <TextField
            fullWidth
            label="Reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={
              method === 'BANK_TRANSFER'
                ? 'Bank transfer reference'
                : method === 'CHECK'
                  ? 'Cheque number'
                  : 'Reference number'
            }
            helperText="Optional: Bank transfer ID, cheque number, etc."
          />

          {/* Notes */}
          <TextField
            fullWidth
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            placeholder="Optional notes about this payment"
          />

          {recordMutation.isError && (
            <Alert severity="error">
              {(recordMutation.error as Error)?.message ||
                'Failed to record payment'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={recordMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRecord}
          disabled={!isAmountValid || recordMutation.isPending}
          startIcon={
            recordMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {recordMutation.isPending ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
