// ===========================================
// Attendance Routes
// ===========================================
// Routes for attendance marking and tracking
// - Teachers can mark attendance for ANY lesson (coverage support)
// - Admin can view and manage all attendance
// - Parents can view their children's attendance

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { teacherOrAdmin, parentOrAbove, parentOfStudent } from '../middleware/authorize';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as attendanceService from '../services/attendance.service';
import {
  validateMarkAttendance,
  validateBatchMarkAttendance,
  validateUpdateAttendance,
  validateAttendanceByLessonFilter,
  validateAttendanceByStudentFilter,
  validateAttendanceReportFilter,
  validateTodayAttendanceFilter,
  validateAttendanceIdParam,
  validateLessonIdParam,
  validateStudentIdParam,
  MarkAttendanceInput,
  BatchMarkAttendanceInput,
  UpdateAttendanceInput,
  AttendanceByLessonFilter,
  AttendanceByStudentFilter,
  AttendanceReportFilter,
  TodayAttendanceFilter,
} from '../validators/attendance.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// MARK ATTENDANCE ENDPOINTS
// ===========================================

/**
 * POST /attendance
 * Mark attendance for a single student
 * Body: { lessonId, studentId, date, status, absenceReason? }
 * Access: Teacher, Admin (can mark for ANY lesson)
 */
router.post(
  '/',
  teacherOrAdmin,
  validateMarkAttendance,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await attendanceService.markAttendance(
        req.user!.schoolId,
        req.body as MarkAttendanceInput
      );

      res.status(201).json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /attendance/batch
 * Mark attendance for multiple students in a lesson
 * Body: { lessonId, date, attendances: [{ studentId, status, absenceReason? }] }
 * Access: Teacher, Admin
 */
router.post(
  '/batch',
  teacherOrAdmin,
  validateBatchMarkAttendance,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await attendanceService.batchMarkAttendance(
        req.user!.schoolId,
        req.body as BatchMarkAttendanceInput
      );

      res.status(201).json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /attendance/:id
 * Update an existing attendance record
 * Body: { status?, absenceReason? }
 * Access: Teacher, Admin
 */
router.patch(
  '/:id',
  teacherOrAdmin,
  validateAttendanceIdParam,
  validateUpdateAttendance,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await attendanceService.updateAttendance(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateAttendanceInput
      );

      res.json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// GET ATTENDANCE ENDPOINTS
// ===========================================

/**
 * GET /attendance/today
 * Get today's attendance for the school
 * Query: locationId?, teacherId?
 * Access: Teacher, Admin
 */
router.get(
  '/today',
  teacherOrAdmin,
  validateTodayAttendanceFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await attendanceService.getTodayAttendance(
        req.user!.schoolId,
        req.query as TodayAttendanceFilter
      );

      res.json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /attendance/:id
 * Get a single attendance record
 * Access: Teacher, Admin
 */
router.get(
  '/:id',
  teacherOrAdmin,
  validateAttendanceIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await attendanceService.getAttendance(
        req.user!.schoolId,
        req.params.id
      );

      if (!attendance) {
        throw new AppError('Attendance record not found', 404);
      }

      res.json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /attendance/lesson/:lessonId
 * Get attendance records for a lesson
 * Query: date?, status?
 * Access: Teacher, Admin
 */
router.get(
  '/lesson/:lessonId',
  teacherOrAdmin,
  validateLessonIdParam,
  validateAttendanceByLessonFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await attendanceService.getAttendanceByLesson(
        req.user!.schoolId,
        req.params.lessonId,
        req.query as AttendanceByLessonFilter
      );

      res.json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /attendance/lesson/:lessonId/students
 * Get enrolled students for a lesson with their attendance for a date
 * Query: date (required)
 * Access: Teacher, Admin
 */
router.get(
  '/lesson/:lessonId/students',
  teacherOrAdmin,
  validateLessonIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const date = req.query.date
        ? new Date(req.query.date as string)
        : new Date();

      if (isNaN(date.getTime())) {
        throw new AppError('Invalid date format', 400);
      }

      const result = await attendanceService.getEnrolledStudentsForAttendance(
        req.user!.schoolId,
        req.params.lessonId,
        date
      );

      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /attendance/lesson/:lessonId/report
 * Get attendance report for a lesson
 * Query: startDate?, endDate?
 * Access: Teacher, Admin
 */
router.get(
  '/lesson/:lessonId/report',
  teacherOrAdmin,
  validateLessonIdParam,
  validateAttendanceReportFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await attendanceService.getAttendanceReport(
        req.user!.schoolId,
        req.params.lessonId,
        req.query as AttendanceReportFilter
      );

      res.json({ status: 'success', data: report });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /attendance/student/:studentId
 * Get attendance history for a student
 * Query: lessonId?, startDate?, endDate?, status?
 * Access: Teacher, Admin, Parent (own children only)
 */
router.get(
  '/student/:studentId',
  parentOrAbove,
  parentOfStudent,
  validateStudentIdParam,
  validateAttendanceByStudentFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;

      // If parent, verify they can access this student
      if (req.user!.role === 'PARENT') {
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
          throw new AppError('You can only view attendance for your own children', 403);
        }
      }

      const attendance = await attendanceService.getAttendanceByStudent(
        req.user!.schoolId,
        studentId,
        req.query as AttendanceByStudentFilter
      );

      res.json({ status: 'success', data: attendance });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /attendance/student/:studentId/stats
 * Get attendance statistics for a student
 * Access: Teacher, Admin
 */
router.get(
  '/student/:studentId/stats',
  teacherOrAdmin,
  validateStudentIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await attendanceService.getStudentAttendanceStats(
        req.user!.schoolId,
        req.params.studentId
      );

      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
