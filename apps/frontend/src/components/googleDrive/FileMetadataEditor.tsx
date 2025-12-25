// ===========================================
// File Metadata Editor Component
// ===========================================
// Dialog to edit file visibility and tags

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Typography,
  Divider,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import {
  GoogleDriveFile,
  getUploadSourceLabel,
  formatSyncTime,
} from '../../api/googleDrive.api';
import { getFileIconComponent } from '../../utils/fileIcons';
import {
  FileVisibility,
  formatFileSize,
  getVisibilityColor,
  getVisibilityLabel,
} from '../../api/resources.api';
import { useUpdateDriveFile } from '../../hooks/useGoogleDrive';

// ===========================================
// TYPES
// ===========================================

interface FileMetadataEditorProps {
  open: boolean;
  file: GoogleDriveFile | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// ===========================================
// COMPONENT
// ===========================================

export default function FileMetadataEditor({
  open,
  file,
  onClose,
  onSuccess,
}: FileMetadataEditorProps) {
  // State
  const [visibility, setVisibility] = useState<FileVisibility>('ALL');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Mutation
  const updateMutation = useUpdateDriveFile();

  // Initialize state when file changes
  useEffect(() => {
    if (file) {
      setVisibility(file.visibility);
      setTags(file.tags || []);
      setTagInput('');
    }
  }, [file]);

  // Handle visibility change
  const handleVisibilityChange = (event: SelectChangeEvent) => {
    setVisibility(event.target.value as FileVisibility);
  };

  // Handle tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle save
  const handleSave = async () => {
    if (!file) return;

    await updateMutation.mutateAsync({
      fileId: file.id,
      data: {
        visibility,
        tags,
      },
    });

    onSuccess?.();
    onClose();
  };

  // Check if there are changes
  const hasChanges = file && (
    visibility !== file.visibility ||
    JSON.stringify(tags) !== JSON.stringify(file.tags || [])
  );

  if (!file) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          Edit File
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* File Preview */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            mb: 3,
          }}
        >
          {file.thumbnailLink ? (
            <Box
              component="img"
              src={file.thumbnailLink}
              alt={file.fileName}
              sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }}
            />
          ) : (
            getFileIconComponent(file.mimeType, { size: 'large' })
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {file.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(file.fileSize)} - {file.mimeType}
            </Typography>
          </Box>
        </Box>

        {/* File Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Upload Source
          </Typography>
          <Typography variant="body2">
            {getUploadSourceLabel(file.uploadedVia)}
          </Typography>

          {file.uploadedBy && (
            <>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Uploaded By
              </Typography>
              <Typography variant="body2">
                {file.uploadedBy.firstName} {file.uploadedBy.lastName}
              </Typography>
            </>
          )}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Uploaded
          </Typography>
          <Typography variant="body2">{formatSyncTime(file.createdAt)}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Visibility Selector */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Visibility</InputLabel>
          <Select value={visibility} onChange={handleVisibilityChange} label="Visibility">
            <MenuItem value="ALL">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getVisibilityLabel('ALL')}
                <Chip
                  label="Everyone can view"
                  size="small"
                  color={getVisibilityColor('ALL')}
                />
              </Box>
            </MenuItem>
            <MenuItem value="TEACHERS_AND_PARENTS">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getVisibilityLabel('TEACHERS_AND_PARENTS')}
                <Chip
                  label="Parents & Teachers"
                  size="small"
                  color={getVisibilityColor('TEACHERS_AND_PARENTS')}
                />
              </Box>
            </MenuItem>
            <MenuItem value="TEACHERS_ONLY">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getVisibilityLabel('TEACHERS_ONLY')}
                <Chip
                  label="Teachers only"
                  size="small"
                  color={getVisibilityColor('TEACHERS_ONLY')}
                />
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Tags Editor */}
        <Box>
          <TextField
            fullWidth
            label="Tags"
            placeholder="Type a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            helperText={`${tags.length}/10 tags`}
            disabled={tags.length >= 10}
          />
          {tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          startIcon={
            updateMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <EditIcon />
            )
          }
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
