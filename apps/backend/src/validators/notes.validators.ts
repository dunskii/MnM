// ===========================================
// Notes Validation Schemas
// ===========================================
// Validates teacher notes CRUD endpoints
// Note: Notes can be for a class (lessonId) OR a student (studentId)

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

// ===========================================
// CREATE NOTE SCHEMA
// ===========================================

export const createNoteSchema = z.object({
  lessonId: uuidSchema.optional(),
  studentId: uuidSchema.optional(),
  date: dateSchema,
  content: z.string().min(1, 'Content is required').max(5000, 'Content cannot exceed 5000 characters'),
  isPrivate: z.boolean().optional().default(false),
}).refine((data) => {
  // Must have lessonId OR studentId (at least one, can have both for student notes on a lesson)
  return data.lessonId || data.studentId;
}, {
  message: 'Either lessonId or studentId is required',
  path: ['lessonId'],
});

// ===========================================
// UPDATE NOTE SCHEMA
// ===========================================

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content cannot exceed 5000 characters').optional(),
  isPrivate: z.boolean().optional(),
});

// ===========================================
// FILTER SCHEMAS
// ===========================================

export const notesByLessonFilterSchema = z.object({
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
  authorId: uuidSchema.optional(),
  isPrivate: z.preprocess(
    (val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    },
    z.boolean().optional()
  ),
});

export const notesByStudentFilterSchema = z.object({
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
  isPrivate: z.preprocess(
    (val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    },
    z.boolean().optional()
  ),
});

export const notesByDateFilterSchema = z.object({
  lessonId: uuidSchema.optional(),
  authorId: uuidSchema.optional(),
});

export const weeklySummaryFilterSchema = z.object({
  weekStartDate: z.preprocess(
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

export const incompleteNotesFilterSchema = z.object({
  teacherId: uuidSchema.optional(),
  beforeDate: z.preprocess(
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

// ===========================================
// PARAM SCHEMAS
// ===========================================

export const noteIdParamSchema = z.object({
  id: uuidSchema,
});

export const lessonIdParamSchema = z.object({
  lessonId: uuidSchema,
});

export const studentIdParamSchema = z.object({
  studentId: uuidSchema,
});

export const teacherIdParamSchema = z.object({
  teacherId: uuidSchema,
});

export const dateParamSchema = z.object({
  date: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid date format',
  }),
});

// ===========================================
// LESSON COMPLETION QUERY SCHEMA
// ===========================================

export const lessonCompletionQuerySchema = z.object({
  date: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date({ message: 'Date is required' })
  ),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NotesByLessonFilter = z.infer<typeof notesByLessonFilterSchema>;
export type NotesByStudentFilter = z.infer<typeof notesByStudentFilterSchema>;
export type NotesByDateFilter = z.infer<typeof notesByDateFilterSchema>;
export type WeeklySummaryFilter = z.infer<typeof weeklySummaryFilterSchema>;
export type IncompleteNotesFilter = z.infer<typeof incompleteNotesFilterSchema>;
export type LessonCompletionQuery = z.infer<typeof lessonCompletionQuerySchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateCreateNote = validate(createNoteSchema);
export const validateUpdateNote = validate(updateNoteSchema);
export const validateNotesByLessonFilter = validate(notesByLessonFilterSchema, 'query');
export const validateNotesByStudentFilter = validate(notesByStudentFilterSchema, 'query');
export const validateNotesByDateFilter = validate(notesByDateFilterSchema, 'query');
export const validateWeeklySummaryFilter = validate(weeklySummaryFilterSchema, 'query');
export const validateIncompleteNotesFilter = validate(incompleteNotesFilterSchema, 'query');
export const validateLessonCompletionQuery = validate(lessonCompletionQuerySchema, 'query');
export const validateNoteIdParam = validate(noteIdParamSchema, 'params');
export const validateLessonIdParam = validate(lessonIdParamSchema, 'params');
export const validateStudentIdParam = validate(studentIdParamSchema, 'params');
export const validateTeacherIdParam = validate(teacherIdParamSchema, 'params');
export const validateDateParam = validate(dateParamSchema, 'params');
