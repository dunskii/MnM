// ===========================================
// Lesson Routes
// ===========================================
// Routes for lesson management and enrollment
// - Teachers can VIEW lessons (for coverage)
// - Admins can CREATE/UPDATE/DELETE lessons
// - Admins can manage enrollments

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin } from '../middleware/authorize';
import * as lessonService from '../services/lesson.service';
import {
  validateCreateLesson,
  validateUpdateLesson,
  validateEnrollStudent,
  validateBulkEnrollStudents,
  validateLessonFilters,
  CreateLessonInput,
  UpdateLessonInput,
  EnrollStudentInput,
  BulkEnrollStudentsInput,
  LessonFiltersInput,
} from '../validators/lesson.validators';
import {
  validateReschedule,
  validateCheckConflicts,
  RescheduleInput,
  CheckConflictsInput,
} from '../validators/notification.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// LESSON CRUD
// ===========================================

/**
 * GET /lessons
 * Get all lessons with optional filters
 * Access: Admin, Teacher (for coverage)
 */
router.get(
  '/',
  teacherOrAdmin,
  validateLessonFilters,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as LessonFiltersInput;
      const lessons = await lessonService.getLessons(req.user!.schoolId, filters);
      res.json({ status: 'success', data: lessons });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /lessons/:id
 * Get a single lesson with enrollments
 * Access: Admin, Teacher
 */
router.get(
  '/:id',
  teacherOrAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await lessonService.getLesson(
        req.user!.schoolId,
        req.params.id
      );
      if (!lesson) {
        res.status(404).json({ status: 'error', message: 'Lesson not found' });
        return;
      }
      res.json({ status: 'success', data: lesson });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /lessons
 * Create a new lesson
 * Access: Admin only
 */
router.post(
  '/',
  adminOnly,
  validateCreateLesson,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await lessonService.createLesson(
        req.user!.schoolId,
        req.body as CreateLessonInput
      );
      res.status(201).json({ status: 'success', data: lesson });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /lessons/:id
 * Update a lesson
 * Access: Admin only
 */
router.patch(
  '/:id',
  adminOnly,
  validateUpdateLesson,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await lessonService.updateLesson(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateLessonInput
      );
      res.json({ status: 'success', data: lesson });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /lessons/:id
 * Soft delete a lesson
 * Access: Admin only
 */
router.delete(
  '/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await lessonService.deleteLesson(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Lesson deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ENROLLMENT OPERATIONS
// ===========================================

/**
 * GET /lessons/:id/enrollments
 * Get all enrollments for a lesson
 * Access: Admin, Teacher
 */
router.get(
  '/:id/enrollments',
  teacherOrAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enrollments = await lessonService.getEnrollments(
        req.user!.schoolId,
        req.params.id
      );
      res.json({ status: 'success', data: enrollments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /lessons/:id/enrollments
 * Enroll a student in a lesson
 * Access: Admin only
 */
router.post(
  '/:id/enrollments',
  adminOnly,
  validateEnrollStudent,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.body as EnrollStudentInput;
      const enrollment = await lessonService.enrollStudent(
        req.user!.schoolId,
        req.params.id,
        studentId
      );
      res.status(201).json({ status: 'success', data: enrollment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /lessons/:id/enrollments/bulk
 * Bulk enroll students in a lesson
 * Access: Admin only
 */
router.post(
  '/:id/enrollments/bulk',
  adminOnly,
  validateBulkEnrollStudents,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentIds } = req.body as BulkEnrollStudentsInput;
      const enrollments = await lessonService.bulkEnrollStudents(
        req.user!.schoolId,
        req.params.id,
        studentIds
      );
      res.status(201).json({ status: 'success', data: enrollments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /lessons/:id/enrollments/:studentId
 * Unenroll a student from a lesson
 * Access: Admin only
 */
router.delete(
  '/:id/enrollments/:studentId',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await lessonService.unenrollStudent(
        req.user!.schoolId,
        req.params.id,
        req.params.studentId
      );
      res.json({ status: 'success', message: 'Student unenrolled' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// AVAILABILITY CHECK ENDPOINTS
// ===========================================

/**
 * GET /lessons/check/room-availability
 * Check if a room is available at a given time
 * Access: Admin only
 */
router.get(
  '/check/room-availability',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roomId, dayOfWeek, startTime, endTime, excludeLessonId } = req.query;

      if (!roomId || dayOfWeek === undefined || !startTime || !endTime) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required parameters: roomId, dayOfWeek, startTime, endTime',
        });
        return;
      }

      const result = await lessonService.validateRoomAvailability(
        req.user!.schoolId,
        roomId as string,
        Number(dayOfWeek),
        startTime as string,
        endTime as string,
        excludeLessonId as string | undefined
      );

      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /lessons/check/teacher-availability
 * Check if a teacher is available at a given time
 * Access: Admin only
 */
router.get(
  '/check/teacher-availability',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teacherId, dayOfWeek, startTime, endTime, excludeLessonId } = req.query;

      if (!teacherId || dayOfWeek === undefined || !startTime || !endTime) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required parameters: teacherId, dayOfWeek, startTime, endTime',
        });
        return;
      }

      const result = await lessonService.validateTeacherAvailability(
        req.user!.schoolId,
        teacherId as string,
        Number(dayOfWeek),
        startTime as string,
        endTime as string,
        excludeLessonId as string | undefined
      );

      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /lessons/:id/capacity
 * Check enrollment capacity for a lesson
 * Access: Admin, Teacher
 */
router.get(
  '/:id/capacity',
  teacherOrAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const capacity = await lessonService.checkEnrollmentCapacity(
        req.user!.schoolId,
        req.params.id
      );
      res.json({ status: 'success', data: capacity });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// RESCHEDULE ENDPOINTS (Drag-and-Drop)
// ===========================================

/**
 * GET /lessons/:id/check-conflicts
 * Pre-validate a reschedule operation (for drag-and-drop preview)
 * Query: newDayOfWeek, newStartTime, newEndTime
 * Access: Admin only
 */
router.get(
  '/:id/check-conflicts',
  adminOnly,
  validateCheckConflicts,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conflicts = await lessonService.checkRescheduleConflicts(
        req.user!.schoolId,
        req.params.id,
        req.query as unknown as CheckConflictsInput
      );
      res.json({ status: 'success', data: conflicts });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /lessons/:id/reschedule
 * Reschedule a lesson (for drag-and-drop)
 * Body: { newDayOfWeek, newStartTime, newEndTime, notifyParents?, reason? }
 * Access: Admin only
 */
router.post(
  '/:id/reschedule',
  adminOnly,
  validateReschedule,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await lessonService.rescheduleLesson(
        req.user!.schoolId,
        req.params.id,
        req.body as RescheduleInput,
        req.user!.userId
      );
      res.json({ status: 'success', data: lesson });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
