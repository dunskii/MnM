// ===========================================
// Google Drive Files Admin Page
// ===========================================
// Admin page for managing all synced Google Drive files

import { useState } from 'react';
import { Box, Dialog, DialogContent, Tabs, Tab } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FileList from '../../components/googleDrive/FileList';
import DriveFileUploader from '../../components/googleDrive/DriveFileUploader';
import FileMetadataEditor from '../../components/googleDrive/FileMetadataEditor';
import { useDeleteDriveFile, useGoogleDriveAuthStatus } from '../../hooks/useGoogleDrive';
import { GoogleDriveFile } from '../../api/googleDrive.api';

// ===========================================
// COMPONENT
// ===========================================

export default function GoogleDriveFilesPage() {
  // State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<GoogleDriveFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Queries
  const { data: authStatus } = useGoogleDriveAuthStatus();
  const isConnected = authStatus?.isConnected ?? false;

  // Mutations
  const deleteMutation = useDeleteDriveFile();

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    await deleteMutation.mutateAsync(fileToDelete.id);
    setFileToDelete(null);
  };

  return (
    <Box>
      <PageHeader
        title="Drive Files"
        subtitle="Manage files synced from Google Drive"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Google Drive', path: '/admin/google-drive' },
          { label: 'Files' },
        ]}
        actionLabel={isConnected ? 'Upload File' : undefined}
        actionIcon={<UploadIcon />}
        onAction={() => setUploadDialogOpen(true)}
      />

      {/* Tabs for filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Files" />
          <Tab label="By Lesson" />
          <Tab label="By Student" />
        </Tabs>
      </Box>

      {/* File List */}
      <FileList
        showFilters={true}
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
