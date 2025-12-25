// ===========================================
// Google Drive Connection Component
// ===========================================
// Displays connection status and OAuth connect/disconnect buttons

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  useGoogleDriveAuthStatus,
  useGoogleDriveAuthUrl,
  useRevokeGoogleDriveAccess,
} from '../../hooks/useGoogleDrive';
import ConfirmDialog from '../common/ConfirmDialog';

// ===========================================
// COMPONENT
// ===========================================

export default function GoogleDriveConnection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Queries
  const { data: authStatus, isLoading: isLoadingStatus } = useGoogleDriveAuthStatus();
  const getAuthUrlMutation = useGoogleDriveAuthUrl();
  const revokeMutation = useRevokeGoogleDriveAccess();

  const isConnected = authStatus?.isConnected ?? false;

  // Handle URL params from OAuth callback
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setStatusMessage({
        type: 'success',
        message: 'Google Drive connected successfully!',
      });
      // Clear the URL params
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
    } else if (error) {
      let errorMessage = 'Failed to connect Google Drive';
      switch (error) {
        case 'access_denied':
          errorMessage = 'Access was denied. Please try again and grant permission.';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid session. Please try connecting again.';
          break;
        case 'auth_failed':
          errorMessage = 'Authentication failed. Please try again.';
          break;
        case 'missing_params':
          errorMessage = 'Missing authorization parameters. Please try again.';
          break;
        default:
          errorMessage = `Connection error: ${error}`;
      }
      setStatusMessage({
        type: 'error',
        message: errorMessage,
      });
      // Clear the URL params
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle connect button click
  const handleConnect = async () => {
    try {
      const result = await getAuthUrlMutation.mutateAsync();
      // Redirect to Google OAuth
      window.location.href = result.authUrl;
    } catch {
      // Error is handled by the mutation
    }
  };

  // Handle disconnect confirmation
  const handleDisconnect = async () => {
    try {
      await revokeMutation.mutateAsync();
      setShowDisconnectDialog(false);
      setStatusMessage({
        type: 'success',
        message: 'Google Drive disconnected successfully.',
      });
    } catch {
      // Error is handled by the mutation
    }
  };

  // Loading state
  if (isLoadingStatus) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
            <Skeleton variant="rectangular" width={120} height={36} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Status Message */}
      {statusMessage && (
        <Alert
          severity={statusMessage.type}
          onClose={() => setStatusMessage(null)}
          sx={{ mb: 2 }}
          icon={statusMessage.type === 'success' ? <CheckIcon /> : <ErrorIcon />}
        >
          {statusMessage.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isConnected ? 'success.light' : 'grey.200',
                }}
              >
                {isConnected ? (
                  <CloudIcon sx={{ color: 'success.main', fontSize: 28 }} />
                ) : (
                  <CloudOffIcon sx={{ color: 'grey.500', fontSize: 28 }} />
                )}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Google Drive</Typography>
                  <Chip
                    label={isConnected ? 'Connected' : 'Not Connected'}
                    color={isConnected ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {isConnected
                    ? 'Your school is connected to Google Drive. Files will sync automatically.'
                    : 'Connect to Google Drive to sync files and folders with your lessons.'}
                </Typography>
              </Box>
            </Box>

            {/* Action Button */}
            <Box>
              {isConnected ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LinkOffIcon />}
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={revokeMutation.isPending}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    getAuthUrlMutation.isPending ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <LinkIcon />
                    )
                  }
                  onClick={handleConnect}
                  disabled={getAuthUrlMutation.isPending}
                >
                  {getAuthUrlMutation.isPending ? 'Connecting...' : 'Connect Google Drive'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        open={showDisconnectDialog}
        title="Disconnect Google Drive"
        message="Are you sure you want to disconnect Google Drive? Synced files will remain in the portal, but automatic syncing will stop. You can reconnect at any time."
        confirmLabel="Disconnect"
        confirmColor="error"
        loading={revokeMutation.isPending}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectDialog(false)}
      />
    </>
  );
}
