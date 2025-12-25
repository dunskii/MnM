// ===========================================
// Notifications API Functions
// ===========================================
// API calls for notification preferences endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export type NotificationType =
  | 'LESSON_REMINDER'
  | 'LESSON_RESCHEDULED'
  | 'PAYMENT_RECEIVED'
  | 'INVOICE_CREATED'
  | 'HYBRID_BOOKING_OPENED'
  | 'HYBRID_BOOKING_REMINDER'
  | 'FILE_UPLOADED'
  | 'ATTENDANCE_SUMMARY';

export interface NotificationPreference {
  id: string;
  userId: string;
  schoolId: string;
  emailNotificationsEnabled: boolean;
  notificationTypes: Record<NotificationType, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  emailNotificationsEnabled?: boolean;
  notificationTypes?: Partial<Record<NotificationType, boolean>>;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ===========================================
// NOTIFICATION TYPE LABELS
// ===========================================

export const notificationTypeLabels: Record<NotificationType, string> = {
  LESSON_REMINDER: 'Lesson Reminders',
  LESSON_RESCHEDULED: 'Lesson Rescheduled',
  PAYMENT_RECEIVED: 'Payment Confirmations',
  INVOICE_CREATED: 'New Invoices',
  HYBRID_BOOKING_OPENED: 'Hybrid Booking Opens',
  HYBRID_BOOKING_REMINDER: 'Hybrid Booking Reminders',
  FILE_UPLOADED: 'New File Uploads',
  ATTENDANCE_SUMMARY: 'Weekly Attendance Summary',
};

export const notificationTypeDescriptions: Record<NotificationType, string> = {
  LESSON_REMINDER: 'Receive reminders before upcoming lessons',
  LESSON_RESCHEDULED: 'Get notified when a lesson time changes',
  PAYMENT_RECEIVED: 'Confirmation emails for successful payments',
  INVOICE_CREATED: 'Notifications when new invoices are created',
  HYBRID_BOOKING_OPENED: 'Alert when hybrid lesson booking opens',
  HYBRID_BOOKING_REMINDER: 'Reminder to book hybrid individual sessions',
  FILE_UPLOADED: 'Notifications when teachers upload new resources',
  ATTENDANCE_SUMMARY: 'Weekly summary of your child\'s attendance',
};

// ===========================================
// NOTIFICATIONS API
// ===========================================

export const notificationsApi = {
  // Get current user's notification preferences
  getPreferences: (): Promise<NotificationPreference> =>
    apiClient
      .get<{ status: string; data: NotificationPreference }>('/notifications/preferences')
      .then((res) => res.data),

  // Update notification preferences
  updatePreferences: (data: UpdatePreferencesInput): Promise<NotificationPreference> =>
    apiClient
      .patch<{ status: string; data: NotificationPreference }>(
        '/notifications/preferences',
        data
      )
      .then((res) => res.data),

  // Reset preferences to defaults
  resetToDefaults: (): Promise<NotificationPreference> =>
    apiClient
      .post<{ status: string; data: NotificationPreference }>(
        '/notifications/preferences/reset'
      )
      .then((res) => res.data),
};
