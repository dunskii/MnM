// ===========================================
// SyncStatusCard Component
// ===========================================
// Displays Google Drive sync status with last sync time and error count

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  CloudDone as SyncedIcon,
  CloudOff as DisconnectedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Sync as SyncingIcon,
  CloudQueue as CloudIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// ===========================================
// TYPES
// ===========================================

export type SyncStatusType = 'healthy' | 'warning' | 'error' | 'disconnected';

export interface DriveSyncStatus {
  isConnected: boolean;
  lastSyncAt: string | null;
  syncedFoldersCount: number;
  errorCount: number;
  status: SyncStatusType;
}

export interface SyncStatusCardProps {
  status: DriveSyncStatus | null;
  loading?: boolean;
  onConnect?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

// Status configurations
const statusConfig: Record<
  SyncStatusType,
  { icon: React.ReactNode; color: string; bgColor: string; label: string }
> = {
  healthy: {
    icon: <SyncedIcon />,
    color: '#5cb399',
    bgColor: '#c5ebe2',
    label: 'Synced',
  },
  warning: {
    icon: <WarningIcon />,
    color: '#E6B800',
    bgColor: '#FFE066',
    label: 'Warning',
  },
  error: {
    icon: <ErrorIcon />,
    color: '#ff4040',
    bgColor: '#ffcccc',
    label: 'Error',
  },
  disconnected: {
    icon: <DisconnectedIcon />,
    color: '#9DA5AF',
    bgColor: '#e0e0e0',
    label: 'Not Connected',
  },
};

// ===========================================
// COMPONENT
// ===========================================

export function SyncStatusCard({
  status,
  loading = false,
  onConnect,
  onViewDetails,
  compact = false,
}: SyncStatusCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigate('/admin/google-drive');
    }
  };

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    } else {
      navigate('/admin/google-drive');
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = status?.status || 'disconnected';
  const config = statusConfig[currentStatus];

  if (compact) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: config.bgColor,
                  color: config.color,
                  borderRadius: 2,
                  p: 1,
                  display: 'flex',
                }}
              >
                {config.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Google Drive
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {config.label}
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label={config.label}
              sx={{
                bgcolor: config.bgColor,
                color: config.color,
                fontWeight: 600,
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Icon */}
          <Box
            sx={{
              bgcolor: config.bgColor,
              color: config.color,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
            }}
          >
            {status?.isConnected ? config.icon : <CloudIcon />}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Google Drive
              </Typography>
              <Chip
                size="small"
                label={config.label}
                sx={{
                  bgcolor: config.bgColor,
                  color: config.color,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Box>

            {status?.isConnected ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Last sync: {formatLastSync(status.lastSyncAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status.syncedFoldersCount} folder
                  {status.syncedFoldersCount !== 1 ? 's' : ''} linked
                </Typography>
                {status.errorCount > 0 && (
                  <Tooltip title={`${status.errorCount} sync error(s) detected`}>
                    <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ErrorIcon fontSize="small" />
                      {status.errorCount} error{status.errorCount !== 1 ? 's' : ''}
                    </Typography>
                  </Tooltip>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Connect to sync files with Google Drive
              </Typography>
            )}
          </Box>
        </Box>

        {/* Action Button */}
        <Box sx={{ mt: 2 }}>
          {status?.isConnected ? (
            <Button
              size="small"
              variant="outlined"
              onClick={handleViewDetails}
              startIcon={<SyncingIcon />}
              fullWidth
            >
              Manage Sync
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={handleConnect}
              startIcon={<CloudIcon />}
              fullWidth
            >
              Connect Drive
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default SyncStatusCard;
