// ===========================================
// Notification Service
// ===========================================
// Manages notification preferences and email notification logic
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { NotificationPreference } from '@prisma/client';

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

export interface UpdatePreferencesInput {
  emailNotificationsEnabled?: boolean;
  notificationTypes?: Record<string, boolean>;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ===========================================
// DEFAULT PREFERENCES
// ===========================================

/**
 * Default notification types - all enabled except ATTENDANCE_SUMMARY
 */
const DEFAULT_NOTIFICATION_TYPES: Record<NotificationType, boolean> = {
  LESSON_REMINDER: true,
  LESSON_RESCHEDULED: true,
  PAYMENT_RECEIVED: true,
  INVOICE_CREATED: true,
  HYBRID_BOOKING_OPENED: true,
  HYBRID_BOOKING_REMINDER: true,
  FILE_UPLOADED: true,
  ATTENDANCE_SUMMARY: false, // Off by default
};

// ===========================================
// GET PREFERENCES
// ===========================================

/**
 * Get notification preferences for a user
 * Creates default preferences if none exist
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getPreferences(
  schoolId: string,
  userId: string
): Promise<NotificationPreference> {
  // Try to find existing preferences
  let preferences = await prisma.notificationPreference.findFirst({
    where: {
      userId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  // Create default preferences if none exist
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        schoolId,
        emailNotificationsEnabled: true,
        notificationTypes: DEFAULT_NOTIFICATION_TYPES,
        quietHoursEnabled: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      },
    });
  }

  return preferences;
}

// ===========================================
// UPDATE PREFERENCES
// ===========================================

/**
 * Update notification preferences for a user
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updatePreferences(
  schoolId: string,
  userId: string,
  data: UpdatePreferencesInput
): Promise<NotificationPreference> {
  // Ensure preferences exist first
  await getPreferences(schoolId, userId);

  // Prepare update data - use explicit typing compatible with Prisma
  const updateData: {
    emailNotificationsEnabled?: boolean;
    notificationTypes?: Record<string, boolean>;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  } = {};

  if (data.emailNotificationsEnabled !== undefined) {
    updateData.emailNotificationsEnabled = data.emailNotificationsEnabled;
  }

  if (data.notificationTypes !== undefined) {
    // Get existing preferences to merge types
    const existing = await prisma.notificationPreference.findFirst({
      where: { userId, schoolId },
    });
    const existingTypes = (existing?.notificationTypes as Record<string, boolean>) || {};
    updateData.notificationTypes = {
      ...existingTypes,
      ...data.notificationTypes,
    };
  }

  if (data.quietHoursEnabled !== undefined) {
    updateData.quietHoursEnabled = data.quietHoursEnabled;
  }

  if (data.quietHoursStart !== undefined) {
    updateData.quietHoursStart = data.quietHoursStart;
  }

  if (data.quietHoursEnd !== undefined) {
    updateData.quietHoursEnd = data.quietHoursEnd;
  }

  return prisma.notificationPreference.update({
    where: {
      userId_schoolId: { userId, schoolId },
    },
    data: updateData,
  });
}

// ===========================================
// RESET TO DEFAULTS
// ===========================================

/**
 * Reset notification preferences to defaults
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function resetToDefaults(
  schoolId: string,
  userId: string
): Promise<NotificationPreference> {
  // Ensure preferences exist first
  await getPreferences(schoolId, userId);

  return prisma.notificationPreference.update({
    where: {
      userId_schoolId: { userId, schoolId },
    },
    data: {
      emailNotificationsEnabled: true,
      notificationTypes: DEFAULT_NOTIFICATION_TYPES,
      quietHoursEnabled: true,
      quietHoursStart: '21:00',
      quietHoursEnd: '07:00',
    },
  });
}

// ===========================================
// CHECK IF SHOULD SEND NOTIFICATION
// ===========================================

/**
 * Check if a notification should be sent to a user
 * Returns false if:
 * - Email notifications are disabled globally
 * - The specific notification type is disabled
 * - Currently in quiet hours (for non-urgent notifications)
 *
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function shouldSendNotification(
  schoolId: string,
  userId: string,
  notificationType: NotificationType,
  isUrgent: boolean = false
): Promise<boolean> {
  const preferences = await getPreferences(schoolId, userId);

  // Check global email toggle
  if (!preferences.emailNotificationsEnabled) {
    return false;
  }

  // Check specific notification type
  const types = preferences.notificationTypes as Record<string, boolean>;
  const typeEnabled = types[notificationType] ?? true; // Default to true if not set

  if (!typeEnabled) {
    return false;
  }

  // Check quiet hours for non-urgent notifications
  if (!isUrgent && preferences.quietHoursEnabled) {
    if (isInQuietHours(preferences)) {
      return false;
    }
  }

  return true;
}

// ===========================================
// QUIET HOURS HELPER
// ===========================================

/**
 * Check if the current time is within quiet hours
 */
export function isInQuietHours(preferences: NotificationPreference): boolean {
  if (!preferences.quietHoursEnabled) return false;
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = preferences.quietHoursStart;
  const end = preferences.quietHoursEnd;

  // Handle overnight quiet hours (e.g., 21:00 to 07:00)
  if (start > end) {
    // Quiet hours span midnight
    return currentTime >= start || currentTime < end;
  }

  // Same-day quiet hours (e.g., 13:00 to 15:00)
  return currentTime >= start && currentTime < end;
}

// ===========================================
// GET USERS BY PREFERENCE
// ===========================================

/**
 * Get all users in a school who have a specific notification type enabled
 * Useful for batch sending (e.g., "Booking period opened" to all parents)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getUsersWithNotificationEnabled(
  schoolId: string,
  notificationType: NotificationType
): Promise<string[]> {
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      emailNotificationsEnabled: true,
    },
    select: {
      userId: true,
      notificationTypes: true,
    },
  });

  return preferences
    .filter((pref) => {
      const types = pref.notificationTypes as Record<string, boolean>;
      return types[notificationType] ?? true; // Default to true if not set
    })
    .map((pref) => pref.userId);
}

// ===========================================
// BULK CHECK NOTIFICATIONS
// ===========================================

/**
 * Check notification preferences for multiple users at once
 * Returns a map of userId -> shouldSend
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function bulkCheckNotifications(
  schoolId: string,
  userIds: string[],
  notificationType: NotificationType
): Promise<Map<string, boolean>> {
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      userId: { in: userIds },
    },
  });

  const result = new Map<string, boolean>();
  const prefMap = new Map(preferences.map((p) => [p.userId, p]));

  for (const userId of userIds) {
    const pref = prefMap.get(userId);

    if (!pref) {
      // No preferences set - use defaults (enabled)
      result.set(userId, true);
      continue;
    }

    if (!pref.emailNotificationsEnabled) {
      result.set(userId, false);
      continue;
    }

    const types = pref.notificationTypes as Record<string, boolean>;
    const typeEnabled = types[notificationType] ?? true;
    result.set(userId, typeEnabled);
  }

  return result;
}
