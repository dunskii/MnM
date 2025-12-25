// ===========================================
// Notification Validation Schemas
// ===========================================
// Validates notification preferences and lesson reschedule endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// COMMON SCHEMAS
// ===========================================

// Time format validation (HH:mm)
const timeSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Invalid time format. Use HH:mm (e.g., 09:00)'
);

// Notification type enum (must match Prisma enum)
export const notificationTypeSchema = z.enum([
  'LESSON_REMINDER',
  'LESSON_RESCHEDULED',
  'PAYMENT_RECEIVED',
  'INVOICE_CREATED',
  'HYBRID_BOOKING_OPENED',
  'HYBRID_BOOKING_REMINDER',
  'FILE_UPLOADED',
  'ATTENDANCE_SUMMARY',
]);

// ===========================================
// UPDATE PREFERENCES SCHEMA
// ===========================================

export const updatePreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  notificationTypes: z.record(z.string(), z.boolean()).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: timeSchema.optional(),
  quietHoursEnd: timeSchema.optional(),
});

// ===========================================
// RESCHEDULE LESSON SCHEMA
// ===========================================

export const rescheduleSchema = z.object({
  newDayOfWeek: z.number().int().min(0, 'Day must be 0-6').max(6, 'Day must be 0-6'),
  newStartTime: timeSchema,
  newEndTime: timeSchema,
  notifyParents: z.boolean().default(true),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
}).refine((data) => {
  // Validate that end time is after start time
  const [startHour, startMin] = data.newStartTime.split(':').map(Number);
  const [endHour, endMin] = data.newEndTime.split(':').map(Number);
  const startMins = startHour * 60 + startMin;
  const endMins = endHour * 60 + endMin;
  return endMins > startMins;
}, {
  message: 'End time must be after start time',
  path: ['newEndTime'],
});

// ===========================================
// CHECK CONFLICTS QUERY SCHEMA
// ===========================================

export const checkConflictsSchema = z.object({
  newDayOfWeek: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(0).max(6)
  ),
  newStartTime: timeSchema,
  newEndTime: timeSchema,
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
export type CheckConflictsInput = z.infer<typeof checkConflictsSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateUpdatePreferences = validate(updatePreferencesSchema);
export const validateReschedule = validate(rescheduleSchema);
export const validateCheckConflicts = validate(checkConflictsSchema, 'query');
