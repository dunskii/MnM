// ===========================================
// Hybrid Booking Validation Schemas
// ===========================================
// Validates hybrid booking CRUD endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// COMMON SCHEMAS
// ===========================================

// UUID validation
const uuidSchema = z.string().uuid('Invalid ID format');

// Time format validation (HH:mm)
const timeSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Invalid time format. Use HH:mm (e.g., 09:00)'
);

// Date validation - accepts ISO string or Date
const dateSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? val : date;
    }
    return val;
  },
  z.date({ message: 'Invalid date format' })
);

// Booking status enum
const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
]);

// ===========================================
// AVAILABLE SLOTS QUERY SCHEMA
// ===========================================

export const availableSlotsQuerySchema = z.object({
  lessonId: uuidSchema,
  weekNumber: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1, 'Week number must be at least 1').max(15, 'Week number cannot exceed 15')
  ),
});

// ===========================================
// CREATE BOOKING SCHEMA
// ===========================================

export const createBookingSchema = z.object({
  lessonId: uuidSchema,
  studentId: uuidSchema,
  weekNumber: z.number().int().min(1, 'Week number must be at least 1').max(15, 'Week number cannot exceed 15'),
  scheduledDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
}).refine((data) => {
  // Validate end time is after start time
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  return endMins > startMins;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// ===========================================
// RESCHEDULE BOOKING SCHEMA
// ===========================================

export const rescheduleBookingSchema = z.object({
  scheduledDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
}).refine((data) => {
  // Validate end time is after start time
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  return endMins > startMins;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// ===========================================
// CANCEL BOOKING SCHEMA
// ===========================================

export const cancelBookingSchema = z.object({
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
});

// ===========================================
// MY BOOKINGS FILTER SCHEMA
// ===========================================

export const myBookingsFilterSchema = z.object({
  lessonId: uuidSchema.optional(),
  status: bookingStatusSchema.optional(),
  weekNumber: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(15).optional()
  ),
});

// ===========================================
// LESSON BOOKINGS FILTER SCHEMA (ADMIN)
// ===========================================

export const lessonBookingsFilterSchema = z.object({
  weekNumber: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(15).optional()
  ),
  status: bookingStatusSchema.optional(),
});

// ===========================================
// CALENDAR EVENTS FILTER SCHEMA
// ===========================================

export const calendarEventsFilterSchema = z.object({
  termId: uuidSchema.optional(),
  teacherId: uuidSchema.optional(),
  startDate: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
  endDate: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
  // Pagination parameters
  page: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1, 'Page must be at least 1').optional()
  ),
  limit: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1, 'Limit must be at least 1').max(500, 'Limit cannot exceed 500').optional()
  ),
});

// ===========================================
// UUID PARAM SCHEMA
// ===========================================

export const uuidParamSchema = z.object({
  id: uuidSchema,
});

export const lessonIdParamSchema = z.object({
  lessonId: uuidSchema,
});

// ===========================================
// WEEK NUMBER QUERY SCHEMA
// ===========================================

export const weekNumberQuerySchema = z.object({
  weekNumber: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(15).optional()
  ),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type MyBookingsFilter = z.infer<typeof myBookingsFilterSchema>;
export type LessonBookingsFilter = z.infer<typeof lessonBookingsFilterSchema>;
export type CalendarEventsFilter = z.infer<typeof calendarEventsFilterSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateAvailableSlotsQuery = validate(availableSlotsQuerySchema, 'query');
export const validateCreateBooking = validate(createBookingSchema);
export const validateRescheduleBooking = validate(rescheduleBookingSchema);
export const validateCancelBooking = validate(cancelBookingSchema);
export const validateMyBookingsFilter = validate(myBookingsFilterSchema, 'query');
export const validateLessonBookingsFilter = validate(lessonBookingsFilterSchema, 'query');
export const validateCalendarEventsFilter = validate(calendarEventsFilterSchema, 'query');
export const validateUuidParam = validate(uuidParamSchema, 'params');
export const validateLessonIdParam = validate(lessonIdParamSchema, 'params');
export const validateWeekNumberQuery = validate(weekNumberQuerySchema, 'query');
