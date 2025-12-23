// ===========================================
// Attendance Validation Schemas
// ===========================================
// Validates attendance CRUD endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// COMMON SCHEMAS
// ===========================================

// UUID validation
const uuidSchema = z.string().uuid('Invalid ID format');

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

// Attendance status enum (matches Prisma)
const attendanceStatusSchema = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
  'CANCELLED',
]);

// ===========================================
// MARK ATTENDANCE SCHEMA
// ===========================================

export const markAttendanceSchema = z.object({
  lessonId: uuidSchema,
  studentId: uuidSchema,
  date: dateSchema,
  status: attendanceStatusSchema,
  absenceReason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
}).refine((data) => {
  // Require absenceReason for ABSENT and EXCUSED statuses
  if ((data.status === 'ABSENT' || data.status === 'EXCUSED') && !data.absenceReason) {
    return false;
  }
  return true;
}, {
  message: 'Absence reason is required for ABSENT or EXCUSED status',
  path: ['absenceReason'],
});

// ===========================================
// BATCH MARK ATTENDANCE SCHEMA
// ===========================================

const singleAttendanceSchema = z.object({
  studentId: uuidSchema,
  status: attendanceStatusSchema,
  absenceReason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
}).refine((data) => {
  if ((data.status === 'ABSENT' || data.status === 'EXCUSED') && !data.absenceReason) {
    return false;
  }
  return true;
}, {
  message: 'Absence reason is required for ABSENT or EXCUSED status',
  path: ['absenceReason'],
});

export const batchMarkAttendanceSchema = z.object({
  lessonId: uuidSchema,
  date: dateSchema,
  attendances: z.array(singleAttendanceSchema).min(1, 'At least one attendance record is required'),
});

// ===========================================
// UPDATE ATTENDANCE SCHEMA
// ===========================================

export const updateAttendanceSchema = z.object({
  status: attendanceStatusSchema.optional(),
  absenceReason: z.string().max(500, 'Reason cannot exceed 500 characters').optional().nullable(),
}).refine((data) => {
  // If status requires reason, check it exists
  if ((data.status === 'ABSENT' || data.status === 'EXCUSED') && !data.absenceReason) {
    return false;
  }
  return true;
}, {
  message: 'Absence reason is required for ABSENT or EXCUSED status',
  path: ['absenceReason'],
});

// ===========================================
// FILTER SCHEMAS
// ===========================================

export const attendanceByLessonFilterSchema = z.object({
  date: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
  status: attendanceStatusSchema.optional(),
});

export const attendanceByStudentFilterSchema = z.object({
  lessonId: uuidSchema.optional(),
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
  status: attendanceStatusSchema.optional(),
});

export const attendanceReportFilterSchema = z.object({
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
});

export const todayAttendanceFilterSchema = z.object({
  locationId: uuidSchema.optional(),
  teacherId: uuidSchema.optional(),
});

// ===========================================
// PARAM SCHEMAS
// ===========================================

export const attendanceIdParamSchema = z.object({
  id: uuidSchema,
});

export const lessonIdParamSchema = z.object({
  lessonId: uuidSchema,
});

export const studentIdParamSchema = z.object({
  studentId: uuidSchema,
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BatchMarkAttendanceInput = z.infer<typeof batchMarkAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type AttendanceByLessonFilter = z.infer<typeof attendanceByLessonFilterSchema>;
export type AttendanceByStudentFilter = z.infer<typeof attendanceByStudentFilterSchema>;
export type AttendanceReportFilter = z.infer<typeof attendanceReportFilterSchema>;
export type TodayAttendanceFilter = z.infer<typeof todayAttendanceFilterSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateMarkAttendance = validate(markAttendanceSchema);
export const validateBatchMarkAttendance = validate(batchMarkAttendanceSchema);
export const validateUpdateAttendance = validate(updateAttendanceSchema);
export const validateAttendanceByLessonFilter = validate(attendanceByLessonFilterSchema, 'query');
export const validateAttendanceByStudentFilter = validate(attendanceByStudentFilterSchema, 'query');
export const validateAttendanceReportFilter = validate(attendanceReportFilterSchema, 'query');
export const validateTodayAttendanceFilter = validate(todayAttendanceFilterSchema, 'query');
export const validateAttendanceIdParam = validate(attendanceIdParamSchema, 'params');
export const validateLessonIdParam = validate(lessonIdParamSchema, 'params');
export const validateStudentIdParam = validate(studentIdParamSchema, 'params');
