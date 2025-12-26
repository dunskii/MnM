// ===========================================
// Notification Preferences Page
// ===========================================
// Allows parents to manage their email notification preferences

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  TextField,
  Skeleton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  RestartAlt as RestartIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useResetNotificationPreferences,
} from '../../hooks/useNotifications';
import {
  NotificationType,
  notificationTypeLabels,
  notificationTypeDescriptions,
} from '../../api/notifications.api';

// ===========================================
// NOTIFICATION TYPE ORDER
// ===========================================

const notificationTypeOrder: NotificationType[] = [
  'LESSON_REMINDER',
  'LESSON_RESCHEDULED',
  'HYBRID_BOOKING_OPENED',
  'HYBRID_BOOKING_REMINDER',
  'INVOICE_CREATED',
  'PAYMENT_RECEIVED',
  'FILE_UPLOADED',
  'ATTENDANCE_SUMMARY',
];

// ===========================================
// COMPONENT
// ===========================================

export default function NotificationPreferencesPage() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Queries and mutations
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const resetPreferences = useResetNotificationPreferences();

  // Handle global toggle
  const handleGlobalToggle = () => {
    if (!preferences) return;
    updatePreferences.mutate({
      emailNotificationsEnabled: !preferences.emailNotificationsEnabled,
    });
  };

  // Handle individual notification type toggle
  const handleTypeToggle = (type: NotificationType) => {
    if (!preferences) return;
    const currentTypes = preferences.notificationTypes || {};
    updatePreferences.mutate({
      notificationTypes: {
        [type]: !currentTypes[type],
      },
    });
  };

  // Handle quiet hours toggle
  const handleQuietHoursToggle = () => {
    if (!preferences) return;
    updatePreferences.mutate({
      quietHoursEnabled: !preferences.quietHoursEnabled,
    });
  };

  // Handle quiet hours time change
  const handleQuietHoursChange = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    if (!preferences) return;
    updatePreferences.mutate({
      [field]: value,
    });
  };

  // Handle reset to defaults
  const handleReset = () => {
    resetPreferences.mutate();
    setShowResetConfirm(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title="Notification Preferences"
          subtitle="Manage your email notification settings"
          breadcrumbs={[
            { label: 'Parent', path: '/parent' },
            { label: 'Notifications' },
          ]}
        />
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <PageHeader
          title="Notification Preferences"
          subtitle="Manage your email notification settings"
          breadcrumbs={[
            { label: 'Parent', path: '/parent' },
            { label: 'Notifications' },
          ]}
        />
        <Alert severity="error">
          Failed to load notification preferences. Please try again.
        </Alert>
      </Box>
    );
  }

  const isUpdating = updatePreferences.isPending || resetPreferences.isPending;

  return (
    <Box>
      <PageHeader
        title="Notification Preferences"
        subtitle="Manage your email notification settings"
        breadcrumbs={[
          { label: 'Parent', path: '/parent' },
          { label: 'Notifications' },
        ]}
      />

      {/* Global Email Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'primary.light',
                  borderRadius: 2,
                  p: 1.5,
                  color: 'primary.main',
                }}
              >
                <EmailIcon />
              </Box>
              <Box>
                <Typography variant="h6">Email Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  {preferences?.emailNotificationsEnabled
                    ? 'You will receive email notifications'
                    : 'All email notifications are currently disabled'}
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={preferences?.emailNotificationsEnabled ?? true}
              onChange={handleGlobalToggle}
              disabled={isUpdating}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Individual Notification Types */}
      <Card sx={{ mb: 3, opacity: preferences?.emailNotificationsEnabled ? 1 : 0.5 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                bgcolor: 'info.light',
                borderRadius: 2,
                p: 1.5,
                color: 'info.main',
              }}
            >
              <NotificationsIcon />
            </Box>
            <Box>
              <Typography variant="h6">Notification Types</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose which types of notifications you want to receive
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            {notificationTypeOrder.map((type) => {
              const isEnabled = preferences?.notificationTypes?.[type] ?? true;
              return (
                <Box
                  key={type}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    px: 2,
                    borderRadius: 1,
                    bgcolor: 'background.default',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      {notificationTypeLabels[type]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notificationTypeDescriptions[type]}
                    </Typography>
                  </Box>
                  <Switch
                    checked={isEnabled}
                    onChange={() => handleTypeToggle(type)}
                    disabled={isUpdating || !preferences?.emailNotificationsEnabled}
                    size="small"
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card sx={{ mb: 3, opacity: preferences?.emailNotificationsEnabled ? 1 : 0.5 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'secondary.light',
                  borderRadius: 2,
                  p: 1.5,
                  color: 'secondary.main',
                }}
              >
                <ScheduleIcon />
              </Box>
              <Box>
                <Typography variant="h6">Quiet Hours</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pause non-urgent notifications during these hours
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={preferences?.quietHoursEnabled ?? true}
              onChange={handleQuietHoursToggle}
              disabled={isUpdating || !preferences?.emailNotificationsEnabled}
              color="secondary"
            />
          </Box>

          {preferences?.quietHoursEnabled && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={preferences?.quietHoursStart || '21:00'}
                    onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)}
                    disabled={isUpdating || !preferences?.emailNotificationsEnabled}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    value={preferences?.quietHoursEnd || '07:00'}
                    onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)}
                    disabled={isUpdating || !preferences?.emailNotificationsEnabled}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Non-urgent notifications will be queued during quiet hours and sent when the period ends.
                Urgent notifications (like lesson cancellations) will still be sent immediately.
              </Typography>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reset to Defaults */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'warning.light',
                  borderRadius: 2,
                  p: 1.5,
                  color: 'warning.main',
                }}
              >
                <RestartIcon />
              </Box>
              <Box>
                <Typography variant="h6">Reset to Defaults</Typography>
                <Typography variant="body2" color="text.secondary">
                  Restore all notification settings to their default values
                </Typography>
              </Box>
            </Box>
            {!showResetConfirm ? (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setShowResetConfirm(true)}
                disabled={isUpdating}
              >
                Reset
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleReset}
                  disabled={isUpdating}
                  startIcon={isUpdating ? <CircularProgress size={16} /> : undefined}
                >
                  Confirm Reset
                </Button>
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Update status */}
      {isUpdating && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
}
