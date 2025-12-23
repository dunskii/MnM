// ===========================================
// Notes Routes
// ===========================================
// Routes for teacher notes management
// - Teachers create/edit notes for classes and students
// - Admin can view all notes and completion summaries
// - Parents can view non-private notes for their children

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin, parentOrAbove, parentOfStudent } from '../middleware/authorize';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as notesService from '../services/notes.service';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNotesByLessonFilter,
  validateNotesByStudentFilter,
  validateNotesByDateFilter,
  validateWeeklySummaryFilter,
  validateIncompleteNotesFilter,
  validateLessonCompletionQuery,
  validateNoteIdParam,
  validateLessonIdParam,
  validateStudentIdParam,
  validateTeacherIdParam,
  validateDateParam,
  CreateNoteInput,
  UpdateNoteInput,
  NotesByLessonFilter,
  NotesByStudentFilter,
  NotesByDateFilter,
  WeeklySummaryFilter,
  IncompleteNotesFilter,
  LessonCompletionQuery,
} from '../validators/notes.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// CRUD ENDPOINTS
// ===========================================

/**
 * POST /notes
 * Create a new note (class note or student note)
 * Body: { lessonId?, studentId?, date, content, isPrivate? }
 * Access: Teacher, Admin
 */
router.post(
  '/',
  teacherOrAdmin,
  validateCreateNote,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await notesService.createNote(
        req.user!.schoolId,
        req.user!.userId,
        req.body as CreateNoteInput
      );

      res.status(201).json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notes/:id
 * Update an existing note
 * Body: { content?, isPrivate? }
 * Access: Teacher (author only), Admin
 */
router.patch(
  '/:id',
  teacherOrAdmin,
  validateNoteIdParam,
  validateUpdateNote,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verify ownership for teachers
      if (req.user!.role === 'TEACHER') {
        const existing = await notesService.getNote(req.user!.schoolId, req.params.id);
        if (!existing) {
          throw new AppError('Note not found', 404);
        }
        if (existing.authorId !== req.user!.userId) {
          throw new AppError('You can only edit your own notes', 403);
        }
      }

      const note = await notesService.updateNote(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateNoteInput
      );

      res.json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /notes/:id
 * Delete a note
 * Access: Teacher (author only), Admin
 */
router.delete(
  '/:id',
  teacherOrAdmin,
  validateNoteIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verify ownership for teachers
      if (req.user!.role === 'TEACHER') {
        const existing = await notesService.getNote(req.user!.schoolId, req.params.id);
        if (!existing) {
          throw new AppError('Note not found', 404);
        }
        if (existing.authorId !== req.user!.userId) {
          throw new AppError('You can only delete your own notes', 403);
        }
      }

      await notesService.deleteNote(req.user!.schoolId, req.params.id);

      res.json({ status: 'success', message: 'Note deleted' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/:id
 * Get a single note
 * Access: Teacher, Admin, Parent (non-private, own children only)
 */
router.get(
  '/:id',
  parentOrAbove,
  validateNoteIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await notesService.getNote(req.user!.schoolId, req.params.id);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Parents can only see non-private notes for their children
      if (req.user!.role === 'PARENT') {
        if (note.isPrivate) {
          throw new AppError('Access denied', 403);
        }

        // Verify student belongs to parent's family
        if (note.studentId) {
          const parent = await prisma.parent.findFirst({
            where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
            include: {
              family: {
                include: { students: { select: { id: true } } },
              },
            },
          });

          if (!parent?.family) {
            throw new AppError('Family not found', 404);
          }

          const studentIds = parent.family.students.map((s) => s.id);
          if (!studentIds.includes(note.studentId)) {
            throw new AppError('Access denied', 403);
          }
        }
      }

      res.json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// QUERY ENDPOINTS
// ===========================================

/**
 * GET /notes/lesson/:lessonId
 * Get notes for a lesson
 * Query: date?, authorId?, isPrivate?
 * Access: Teacher, Admin
 */
router.get(
  '/lesson/:lessonId',
  teacherOrAdmin,
  validateLessonIdParam,
  validateNotesByLessonFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notes = await notesService.getNotesByLesson(
        req.user!.schoolId,
        req.params.lessonId,
        req.query as NotesByLessonFilter
      );

      res.json({ status: 'success', data: notes });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/lesson/:lessonId/completion
 * Get note completion status for a lesson on a date
 * Query: date (required)
 * Access: Teacher, Admin
 */
router.get(
  '/lesson/:lessonId/completion',
  teacherOrAdmin,
  validateLessonIdParam,
  validateLessonCompletionQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.query as unknown as LessonCompletionQuery;

      const completion = await notesService.getLessonNoteCompletion(
        req.user!.schoolId,
        req.params.lessonId,
        date
      );

      res.json({ status: 'success', data: completion });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/student/:studentId
 * Get notes for a student
 * Query: lessonId?, startDate?, endDate?, isPrivate?
 * Access: Teacher, Admin, Parent (own children, non-private only)
 */
router.get(
  '/student/:studentId',
  parentOrAbove,
  parentOfStudent,
  validateStudentIdParam,
  validateNotesByStudentFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const isParent = req.user!.role === 'PARENT';

      // If parent, verify they can access this student
      if (isParent) {
        const parent = await prisma.parent.findFirst({
          where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
          include: {
            family: {
              include: { students: { select: { id: true } } },
            },
          },
        });

        if (!parent?.family) {
          throw new AppError('Family not found', 404);
        }

        const studentIds = parent.family.students.map((s) => s.id);
        if (!studentIds.includes(studentId)) {
          throw new AppError('You can only view notes for your own children', 403);
        }
      }

      const notes = await notesService.getNotesByStudent(
        req.user!.schoolId,
        studentId,
        req.query as NotesByStudentFilter,
        !isParent // Include private notes only for teachers/admins
      );

      res.json({ status: 'success', data: notes });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/date/:date
 * Get all notes for a specific date
 * Query: lessonId?, authorId?
 * Access: Teacher, Admin
 */
router.get(
  '/date/:date',
  teacherOrAdmin,
  validateDateParam,
  validateNotesByDateFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const date = new Date(req.params.date);

      const notes = await notesService.getNotesByDate(
        req.user!.schoolId,
        date,
        req.query as NotesByDateFilter
      );

      res.json({ status: 'success', data: notes });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// COMPLETION SUMMARY ENDPOINTS
// ===========================================

/**
 * GET /notes/teacher/:teacherId/weekly
 * Get weekly note completion summary for a teacher
 * Query: weekStartDate?
 * Access: Teacher (own data), Admin
 */
router.get(
  '/teacher/:teacherId/weekly',
  teacherOrAdmin,
  validateTeacherIdParam,
  validateWeeklySummaryFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teacherId } = req.params;
      const { weekStartDate } = req.query as WeeklySummaryFilter;

      // Teachers can only view their own summary
      if (req.user!.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({
          where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
        });

        if (!teacher || teacher.id !== teacherId) {
          throw new AppError('You can only view your own summary', 403);
        }
      }

      const summary = await notesService.getTeacherNoteCompletionSummary(
        req.user!.schoolId,
        teacherId,
        weekStartDate
      );

      res.json({ status: 'success', data: summary });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/teacher/:teacherId/pending
 * Get pending notes count for teacher dashboard widget
 * Access: Teacher (own data), Admin
 */
router.get(
  '/teacher/:teacherId/pending',
  teacherOrAdmin,
  validateTeacherIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teacherId } = req.params;

      // Teachers can only view their own data
      if (req.user!.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({
          where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
        });

        if (!teacher || teacher.id !== teacherId) {
          throw new AppError('You can only view your own data', 403);
        }
      }

      const pending = await notesService.getTeacherPendingNotesCount(
        req.user!.schoolId,
        teacherId
      );

      res.json({ status: 'success', data: pending });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/school/weekly
 * Get school-wide note completion summary for a week
 * Query: weekStartDate?
 * Access: Admin only
 */
router.get(
  '/school/weekly',
  adminOnly,
  validateWeeklySummaryFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { weekStartDate } = req.query as WeeklySummaryFilter;

      const summary = await notesService.getSchoolNoteCompletionSummary(
        req.user!.schoolId,
        weekStartDate
      );

      res.json({ status: 'success', data: summary });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notes/incomplete
 * Get all incomplete notes (for admin monitoring)
 * Query: teacherId?, beforeDate?
 * Access: Admin only
 */
router.get(
  '/incomplete',
  adminOnly,
  validateIncompleteNotesFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teacherId, beforeDate } = req.query as IncompleteNotesFilter;

      const incomplete = await notesService.getIncompleteNotes(
        req.user!.schoolId,
        beforeDate,
        teacherId
      );

      res.json({ status: 'success', data: incomplete });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
