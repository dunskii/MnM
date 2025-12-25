// ===========================================
// Link Folder Dialog Component
// ===========================================
// Modal to link a Google Drive folder to a lesson or student

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  TextField,
  Alert,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Folder as FolderIcon,
  School as LessonIcon,
  Person as StudentIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useLessons } from '../../hooks/useLessons';
import { useStudents } from '../../hooks/useUsers';
import { useLinkFolder, useGoogleDriveAuthStatus } from '../../hooks/useGoogleDrive';
import { DriveFolder } from '../../api/googleDrive.api';
import FolderBrowser from './FolderBrowser';

// ===========================================
// TYPES
// ===========================================

interface LinkFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type LinkTargetType = 'lesson' | 'student';

// ===========================================
// COMPONENT
// ===========================================

export default function LinkFolderDialog({
  open,
  onClose,
  onSuccess,
}: LinkFolderDialogProps) {
  // State
  const [targetType, setTargetType] = useState<LinkTargetType>('lesson');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: authStatus } = useGoogleDriveAuthStatus();
  const { data: lessons, isLoading: isLoadingLessons } = useLessons();
  const { data: students, isLoading: isLoadingStudents } = useStudents();

  // Mutation
  const linkFolderMutation = useLinkFolder();

  // Check if connected
  const isConnected = authStatus?.isConnected ?? false;

  // Get selected entity for display
  const selectedLesson = useMemo(() => {
    if (!selectedLessonId || !lessons) return null;
    return lessons.find((l) => l.id === selectedLessonId) || null;
  }, [selectedLessonId, lessons]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId || !students) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  // Validation
  const isValid = useMemo(() => {
    if (!selectedFolder) return false;
    if (targetType === 'lesson' && !selectedLessonId) return false;
    if (targetType === 'student' && !selectedStudentId) return false;
    return true;
  }, [selectedFolder, targetType, selectedLessonId, selectedStudentId]);

  // Handle target type change
  const handleTargetTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTargetType(event.target.value as LinkTargetType);
    setSelectedLessonId(null);
    setSelectedStudentId(null);
    setError(null);
  };

  // Handle folder selection
  const handleFolderSelect = (folder: DriveFolder) => {
    setSelectedFolder(folder);
    setError(null);
  };

  // Handle link
  const handleLink = async () => {
    if (!selectedFolder) {
      setError('Please select a folder');
      return;
    }

    if (targetType === 'lesson' && !selectedLessonId) {
      setError('Please select a lesson');
      return;
    }

    if (targetType === 'student' && !selectedStudentId) {
      setError('Please select a student');
      return;
    }

    try {
      await linkFolderMutation.mutateAsync({
        driveFolderId: selectedFolder.id,
        folderName: selectedFolder.name,
        folderUrl: selectedFolder.webViewLink,
        lessonId: targetType === 'lesson' ? selectedLessonId! : undefined,
        studentId: targetType === 'student' ? selectedStudentId! : undefined,
      });

      // Reset and close
      handleClose();
      onSuccess?.();
    } catch {
      // Error is handled by the mutation
    }
  };

  // Handle close
  const handleClose = () => {
    setTargetType('lesson');
    setSelectedLessonId(null);
    setSelectedStudentId(null);
    setSelectedFolder(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon color="primary" />
          Link Google Drive Folder
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Not Connected Warning */}
        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Google Drive is not connected. Please connect first before linking folders.
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Link Target Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Link folder to:</FormLabel>
            <RadioGroup
              row
              value={targetType}
              onChange={handleTargetTypeChange}
            >
              <FormControlLabel
                value="lesson"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LessonIcon fontSize="small" />
                    Lesson
                  </Box>
                }
              />
              <FormControlLabel
                value="student"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StudentIcon fontSize="small" />
                    Student
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Lesson/Student Selector */}
        <Box sx={{ mb: 3 }}>
          {targetType === 'lesson' ? (
            <Autocomplete
              options={lessons || []}
              loading={isLoadingLessons}
              getOptionLabel={(option) =>
                `${option.name} - ${option.teacher?.user?.firstName || ''} ${option.teacher?.user?.lastName || ''}`
              }
              value={selectedLesson}
              onChange={(_, value) => setSelectedLessonId(value?.id || null)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Lesson"
                  placeholder="Search lessons..."
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingLessons ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.teacher?.user?.firstName} {option.teacher?.user?.lastName}
                      {option.room && ` - ${option.room.name}`}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          ) : (
            <Autocomplete
              options={students || []}
              loading={isLoadingStudents}
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName}`
              }
              value={selectedStudent}
              onChange={(_, value) => setSelectedStudentId(value?.id || null)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Student"
                  placeholder="Search students..."
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingStudents ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1">
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.ageGroup || 'No age group'}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Folder Browser */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select Google Drive Folder
          </Typography>
          <FolderBrowser
            onSelectFolder={handleFolderSelect}
            selectedFolderId={selectedFolder?.id}
            disabled={!isConnected}
          />
        </Box>

        {/* Selected Folder Display */}
        {selectedFolder && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Selected Folder
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon color="primary" />
              <Typography variant="body1" fontWeight={500}>
                {selectedFolder.name}
              </Typography>
              <Chip label="Ready to link" size="small" color="success" />
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleLink}
          disabled={!isValid || linkFolderMutation.isPending || !isConnected}
          startIcon={
            linkFolderMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LinkIcon />
            )
          }
        >
          {linkFolderMutation.isPending ? 'Linking...' : 'Link Folder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
