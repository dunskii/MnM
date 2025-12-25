// ===========================================
// Notifications React Query Hooks
// ===========================================
// Custom hooks for notification preferences management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  notificationsApi,
  UpdatePreferencesInput,
} from '../api/notifications.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const notificationKeys = {
  all: ['notifications'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

// ===========================================
// NOTIFICATION QUERIES
// ===========================================

/**
 * Get current user's notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsApi.getPreferences(),
  });
}

// ===========================================
// NOTIFICATION MUTATIONS
// ===========================================

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: UpdatePreferencesInput) =>
      notificationsApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
      enqueueSnackbar('Preferences updated', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to update preferences';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Reset notification preferences to defaults
 */
export function useResetNotificationPreferences() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: () => notificationsApi.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
      enqueueSnackbar('Preferences reset to defaults', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to reset preferences';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}
