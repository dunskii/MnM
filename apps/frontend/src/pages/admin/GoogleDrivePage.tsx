// ===========================================
// Google Drive Admin Page
// ===========================================
// Admin page for managing Google Drive folder mappings and sync

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Link,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Sync as SyncIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  School as LessonIcon,
  Person as StudentIcon,
  Folder as FolderIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import GoogleDriveConnection from '../../components/googleDrive/GoogleDriveConnection';
import SyncStatusBadge from '../../components/googleDrive/SyncStatusBadge';
import LinkFolderDialog from '../../components/googleDrive/LinkFolderDialog';
import {
  useFolderMappings,
  useSyncStatus,
  useStorageStats,
  useUnlinkFolder,
  useTriggerSync,
  useResetFolderSync,
  useGoogleDriveAuthStatus,
} from '../../hooks/useGoogleDrive';
import {
  GoogleDriveFolderMapping,
  formatSyncTime,
} from '../../api/googleDrive.api';
import { formatFileSize } from '../../api/resources.api';

// ===========================================
// COMPONENT
// ===========================================

export default function GoogleDrivePage() {
  // State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [folderToUnlink, setFolderToUnlink] = useState<GoogleDriveFolderMapping | null>(null);

  // Queries
  const { data: authStatus } = useGoogleDriveAuthStatus();
  const { data: mappings, isLoading: isLoadingMappings } = useFolderMappings();
  const { data: syncStatus, isLoading: isLoadingSyncStatus } = useSyncStatus();
  const { data: stats, isLoading: isLoadingStats } = useStorageStats();

  // Mutations
  const unlinkMutation = useUnlinkFolder();
  const triggerSyncMutation = useTriggerSync();
  const resetSyncMutation = useResetFolderSync();

  const isConnected = authStatus?.isConnected ?? false;

  // Table columns
  const columns: Column<GoogleDriveFolderMapping>[] = [
    {
      id: 'folderName',
      label: 'Folder',
      format: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon color="primary" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {row.folderName}
            </Typography>
            <Link
              href={row.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              Open in Drive <OpenInNewIcon fontSize="inherit" />
            </Link>
          </Box>
        </Box>
      ),
    },
    {
      id: 'linkedTo',
      label: 'Linked To',
      format: (_, row) => {
        if (row.lesson) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<LessonIcon />}
                label="Lesson"
                size="small"
                variant="outlined"
              />
              <Typography variant="body2">{row.lesson.name}</Typography>
            </Box>
          );
        }
        if (row.student) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<StudentIcon />}
                label="Student"
                size="small"
                variant="outlined"
                color="secondary"
              />
              <Typography variant="body2">
                {row.student.firstName} {row.student.lastName}
              </Typography>
            </Box>
          );
        }
        return '-';
      },
    },
    {
      id: '_count.files',
      label: 'Files',
      align: 'center',
      format: (_, row) => (
        <Chip
          label={row._count?.files || 0}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'syncStatus',
      label: 'Status',
      align: 'center',
      format: (_, row) => (
        <SyncStatusBadge
          status={row.syncStatus}
          lastSyncAt={row.lastSyncAt}
          errorMessage={row.syncError}
        />
      ),
    },
    {
      id: 'lastSyncAt',
      label: 'Last Sync',
      format: (value) => formatSyncTime(value as string | null),
    },
    {
      id: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      format: (_, row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          {row.syncStatus === 'ERROR' && (
            <Tooltip title="Reset Sync Status">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSyncMutation.mutate(row.id);
                }}
                disabled={resetSyncMutation.isPending}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Sync Now">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                triggerSyncMutation.mutate({ folderId: row.id });
              }}
              disabled={triggerSyncMutation.isPending || row.syncStatus === 'SYNCING'}
            >
              <SyncIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Unlink Folder">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setFolderToUnlink(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Handle unlink confirm
  const handleUnlinkConfirm = async () => {
    if (!folderToUnlink) return;
    await unlinkMutation.mutateAsync(folderToUnlink.id);
    setFolderToUnlink(null);
  };

  // Handle sync all
  const handleSyncAll = () => {
    triggerSyncMutation.mutate({});
  };

  return (
    <Box>
      <PageHeader
        title="Google Drive"
        subtitle="Manage Google Drive folder mappings and sync settings"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Google Drive' },
        ]}
      />

      {/* Connection Status */}
      <Box sx={{ mb: 3 }}>
        <GoogleDriveConnection />
      </Box>

      {/* Show content only if connected */}
      {isConnected && (
        <>
          {/* Sync Status & Stats Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Sync Status Card */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Sync Status</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<SyncIcon />}
                      onClick={handleSyncAll}
                      disabled={triggerSyncMutation.isPending || syncStatus?.inProgress}
                    >
                      {syncStatus?.inProgress ? 'Syncing...' : 'Sync All'}
                    </Button>
                  </Box>

                  {isLoadingSyncStatus ? (
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Skeleton variant="rectangular" width={150} height={60} />
                      <Skeleton variant="rectangular" width={150} height={60} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Last Sync
                        </Typography>
                        <Typography variant="h6">
                          {formatSyncTime(syncStatus?.lastSyncAt || null)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Next Scheduled Sync
                        </Typography>
                        <Typography variant="h6">
                          {syncStatus?.nextSyncAt
                            ? new Date(syncStatus.nextSyncAt).toLocaleTimeString()
                            : 'Not scheduled'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Folders Syncing
                        </Typography>
                        <Typography variant="h6">
                          {syncStatus?.folders?.filter((f) => f.syncStatus === 'SYNCING').length || 0}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Storage Stats Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <StorageIcon color="primary" />
                    <Typography variant="h6">Storage</Typography>
                  </Box>

                  {isLoadingStats ? (
                    <Box>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="h4" color="primary">
                        {stats?.totalFiles || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        files ({formatFileSize(stats?.totalSize || 0)})
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Folder Mappings Section */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Linked Folders</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setLinkDialogOpen(true)}
            >
              Link Folder
            </Button>
          </Box>

          {/* Empty state or table */}
          {!isLoadingMappings && mappings?.length === 0 ? (
            <Alert severity="info">
              No folders linked yet. Click "Link Folder" to connect a Google Drive folder to a lesson or student.
            </Alert>
          ) : (
            <DataTable
              columns={columns}
              data={mappings || []}
              loading={isLoadingMappings}
              searchPlaceholder="Search folders..."
              emptyMessage="No folders linked"
            />
          )}
        </>
      )}

      {/* Link Folder Dialog */}
      <LinkFolderDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onSuccess={() => setLinkDialogOpen(false)}
      />

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        open={!!folderToUnlink}
        title="Unlink Folder"
        message={`Are you sure you want to unlink "${folderToUnlink?.folderName}"? The files will remain in the portal but will no longer sync with Google Drive.`}
        confirmLabel="Unlink"
        confirmColor="error"
        loading={unlinkMutation.isPending}
        onConfirm={handleUnlinkConfirm}
        onCancel={() => setFolderToUnlink(null)}
      />
    </Box>
  );
}
