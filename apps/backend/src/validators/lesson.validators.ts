// ===========================================
// Lesson Validation Schemas
// ===========================================
// Validates lesson CRUD and enrollment endpoints

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

// Hybrid pattern type enum
const hybridPatternTypeSchema = z.enum(['ALTERNATING', 'CUSTOM']);

// ===========================================
// HYBRID PATTERN SCHEMA
// ===========================================

const hybridPatternSchema = z.object({
  patternType: hybridPatternTypeSchema,
  groupWeeks: z.array(z.number().int().min(1).max(15)).min(1, 'At least one group week is required'),
  individualWeeks: z.array(z.number().int().min(1).max(15)).min(1, 'At least one individual week is required'),
  individualSlotDuration: z.number().int().min(15).max(60).default(30),
  bookingDeadlineHours: z.number().int().min(0).max(168).default(24),
}).refine((data) => {
  // Validate that group and individual weeks don't overlap
  const overlap = data.groupWeeks.filter((w) => data.individualWeeks.includes(w));
  return overlap.length === 0;
}, {
  message: 'Group weeks and individual weeks cannot overlap',
});

// ===========================================
// CREATE LESSON SCHEMA
// ===========================================

export const createLessonSchema = z.object({
  lessonTypeId: uuidSchema,
  termId: uuidSchema,
  teacherId: uuidSchema,
  roomId: uuidSchema,
  instrumentId: uuidSchema.optional(),
  name: z.string().min(1, 'Lesson name is required').max(100, 'Lesson name too long'),
  description: z.string().max(500).optional(),
  dayOfWeek: z.number().int().min(0, 'Day must be 0-6').max(6, 'Day must be 0-6'),
  startTime: timeSchema,
  endTime: timeSchema,
  durationMins: z.number().int().min(15, 'Duration must be at least 15 minutes').max(180, 'Duration cannot exceed 180 minutes'),
  maxStudents: z.number().int().min(1, 'Max students must be at least 1').max(30, 'Max students cannot exceed 30'),
  isRecurring: z.boolean().default(true),
  hybridPattern: hybridPatternSchema.optional(),
}).refine((data) => {
  // Validate that end time is after start time
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMins = startHour * 60 + startMin;
  const endMins = endHour * 60 + endMin;
  return endMins > startMins;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// ===========================================
// UPDATE LESSON SCHEMA
// ===========================================

export const updateLessonSchema = z.object({
  lessonTypeId: uuidSchema.optional(),
  termId: uuidSchema.optional(),
  teacherId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  instrumentId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  durationMins: z.number().int().min(15).max(180).optional(),
  maxStudents: z.number().int().min(1).max(30).optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hybridPattern: hybridPatternSchema.optional().nullable(),
}).refine((data) => {
  // If both times provided, validate end is after start
  if (data.startTime && data.endTime) {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    return endMins > startMins;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// ===========================================
// ENROLLMENT SCHEMAS
// ===========================================

export const enrollStudentSchema = z.object({
  studentId: uuidSchema,
});

export const bulkEnrollStudentsSchema = z.object({
  studentIds: z.array(uuidSchema)
    .min(1, 'At least one student ID is required')
    .max(30, 'Cannot enroll more than 30 students at once'),
});

// ===========================================
// FILTER SCHEMA
// ===========================================

export const lessonFiltersSchema = z.object({
  termId: uuidSchema.optional(),
  teacherId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  instrumentId: uuidSchema.optional(),
  lessonTypeId: uuidSchema.optional(),
  dayOfWeek: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(0).max(6).optional()
  ),
  isActive: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type BulkEnrollStudentsInput = z.infer<typeof bulkEnrollStudentsSchema>;
export type LessonFiltersInput = z.infer<typeof lessonFiltersSchema>;
export type HybridPatternInput = z.infer<typeof hybridPatternSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateCreateLesson = validate(createLessonSchema);
export const validateUpdateLesson = validate(updateLessonSchema);
export const validateEnrollStudent = validate(enrollStudentSchema);
export const validateBulkEnrollStudents = validate(bulkEnrollStudentsSchema);
export const validateLessonFilters = validate(lessonFiltersSchema, 'query');
