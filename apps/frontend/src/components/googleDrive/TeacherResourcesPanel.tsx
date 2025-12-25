// ===========================================
// Teacher Resources Panel Component
// ===========================================
// Panel for teachers to manage lesson resources (Google Drive files)

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogContent,
  Skeleton,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Folder as FolderIcon,
  CloudOff as DisconnectedIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import FileList from './FileList';
import DriveFileUploader from './DriveFileUploader';
import FileMetadataEditor from './FileMetadataEditor';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  useGoogleDriveAuthStatus,
  useFolderMappings,
  useDeleteDriveFile,
} from '../../hooks/useGoogleDrive';
import { GoogleDriveFile } from '../../api/googleDrive.api';

// ===========================================
// TYPES
// ===========================================

interface TeacherResourcesPanelProps {
  lessonId: string;
}

// ===========================================
// COMPONENT
// ===========================================

export default function TeacherResourcesPanel({ lessonId }: TeacherResourcesPanelProps) {
  // State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<GoogleDriveFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);

  // Queries
  const { data: authStatus, isLoading: isLoadingAuth } = useGoogleDriveAuthStatus();
  const { data: mappings, isLoading: isLoadingMappings } = useFolderMappings();

  // Mutations
  const deleteMutation = useDeleteDriveFile();

  const isConnected = authStatus?.isConnected ?? false;
  const lessonFolder = mappings?.find((m) => m.lesson?.id === lessonId);
  const hasFolderLinked = !!lessonFolder;

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    await deleteMutation.mutateAsync(fileToDelete.id);
    setFileToDelete(null);
  };

  // Loading state
  if (isLoadingAuth || isLoadingMappings) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <DisconnectedIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Google Drive Not Connected
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Connect Google Drive to manage lesson resources.
        </Typography>
        <Button
          component={Link}
          to="/admin/google-drive"
          variant="outlined"
        >
          Go to Google Drive Settings
        </Button>
      </Paper>
    );
  }

  // No folder linked state
  if (!hasFolderLinked) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <FolderIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Folder Linked
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Link a Google Drive folder to this lesson to manage resources.
        </Typography>
        <Button
          component={Link}
          to="/admin/google-drive"
          variant="outlined"
        >
          Link a Folder
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6">Lesson Resources</Typography>
          <Typography variant="body2" color="text.secondary">
            Linked folder: {lessonFolder.folderName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload File
        </Button>
      </Box>

      {/* Folder Sync Status Alert */}
      {lessonFolder.syncStatus === 'ERROR' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Sync error: {lessonFolder.syncError || 'Unknown error'}. Please check the folder settings.
        </Alert>
      )}

      {lessonFolder.syncStatus === 'SYNCING' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Syncing files from Google Drive...
        </Alert>
      )}

      {/* File List */}
      <FileList
        lessonId={lessonId}
        showFilters={false}
        editable={true}
        onEdit={(file) => setEditingFile(file)}
        onDelete={(file) => setFileToDelete(file)}
      />

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <DriveFileUploader
            lessonId={lessonId}
            onUploaded={() => setUploadDialogOpen(false)}
            onClose={() => setUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Metadata Dialog */}
      <FileMetadataEditor
        open={!!editingFile}
        file={editingFile}
        onClose={() => setEditingFile(null)}
        onSuccess={() => setEditingFile(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!fileToDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.fileName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFileToDelete(null)}
      />
    </Box>
  );
}
