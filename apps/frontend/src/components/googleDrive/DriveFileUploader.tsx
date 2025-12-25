// ===========================================
// Drive File Uploader Component
// ===========================================
// File uploader that syncs to Google Drive

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Cloud as DriveIcon,
} from '@mui/icons-material';
import {
  FileVisibility,
  getVisibilityLabel,
  getVisibilityColor,
  formatFileSize,
  isAllowedFileType,
  isFileSizeAllowed,
  MAX_FILE_SIZE,
} from '../../api/resources.api';
import { useUploadDriveFile } from '../../hooks/useGoogleDrive';

// ===========================================
// TYPES
// ===========================================

interface DriveFileUploaderProps {
  lessonId?: string;
  studentId?: string;
  onUploaded?: () => void;
  onClose?: () => void;
}

// ===========================================
// COMPONENT
// ===========================================

export default function DriveFileUploader({
  lessonId,
  studentId,
  onUploaded,
  onClose,
}: DriveFileUploaderProps) {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<FileVisibility>('ALL');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutation
  const uploadMutation = useUploadDriveFile();

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      setError('Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, images, audio, and video files.');
      return;
    }

    // Validate file size
    if (!isFileSizeAllowed(file.size)) {
      setError(`File size exceeds maximum allowed (${formatFileSize(MAX_FILE_SIZE)}).`);
      return;
    }

    setSelectedFile(file);
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

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

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!lessonId && !studentId) {
      setError('Please select a lesson or student to upload the file to.');
      return;
    }

    await uploadMutation.mutateAsync({
      file: selectedFile,
      lessonId,
      studentId,
      visibility,
      tags: tags.length > 0 ? tags : undefined,
    });

    // Reset form
    setSelectedFile(null);
    setTags([]);
    setTagInput('');
    setVisibility('ALL');

    onUploaded?.();
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <DriveIcon color="primary" />
        <Typography variant="h6">Upload to Google Drive</Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Files uploaded here will automatically sync to the linked Google Drive folder.
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Drag and Drop Zone */}
      {!selectedFile && (
        <Box
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: isDragging ? 'primary.50' : 'grey.50',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            mb: 3,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
          component="label"
        >
          <input
            type="file"
            hidden
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.m4a,.mp4,.mpeg,.webm,.mov"
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag & drop file here
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max file size: {formatFileSize(MAX_FILE_SIZE)}
          </Typography>
        </Box>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
            <Button
              size="small"
              color="error"
              onClick={handleClearFile}
              startIcon={<CloseIcon />}
            >
              Remove
            </Button>
          </Box>
        </Paper>
      )}

      {/* Visibility Selector */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Visibility</InputLabel>
        <Select value={visibility} onChange={handleVisibilityChange} label="Visibility">
          <MenuItem value="ALL">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getVisibilityLabel('ALL')}
              <Chip
                label="Students, Parents, Teachers"
                size="small"
                color={getVisibilityColor('ALL')}
              />
            </Box>
          </MenuItem>
          <MenuItem value="TEACHERS_AND_PARENTS">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getVisibilityLabel('TEACHERS_AND_PARENTS')}
              <Chip
                label="Parents & Teachers only"
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

      {/* Tags Input */}
      <Box sx={{ mb: 3 }}>
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

      {/* Upload Progress */}
      {uploadMutation.isPending && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Uploading and syncing to Google Drive...
          </Typography>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {onClose && (
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload to Drive'}
        </Button>
      </Box>
    </Paper>
  );
}
