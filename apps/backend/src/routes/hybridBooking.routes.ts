// ===========================================
// Hybrid Booking Routes
// ===========================================
// Routes for hybrid lesson individual session bookings
// - Parents can book, reschedule, cancel their children's sessions
// - Admin can manage booking periods and view all bookings
// - Teachers can view bookings (read-only)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin, parentOrAbove } from '../middleware/authorize';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as hybridBookingService from '../services/hybridBooking.service';
import {
  validateAvailableSlotsQuery,
  validateCreateBooking,
  validateRescheduleBooking,
  validateCancelBooking,
  validateMyBookingsFilter,
  validateLessonBookingsFilter,
  validateWeekNumberQuery,
  AvailableSlotsQuery,
  CreateBookingInput,
  RescheduleBookingInput,
  CancelBookingInput,
  MyBookingsFilter,
  LessonBookingsFilter,
} from '../validators/hybridBooking.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// PARENT BOOKING ENDPOINTS
// ===========================================

/**
 * GET /hybrid-bookings/available-slots
 * Get available time slots for a specific week
 * Query: lessonId, weekNumber
 * Access: Parent (for their enrolled children)
 */
router.get(
  '/available-slots',
  parentOrAbove,
  validateAvailableSlotsQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lessonId, weekNumber } = req.query as unknown as AvailableSlotsQuery;
      const slots = await hybridBookingService.getAvailableSlots(
        req.user!.schoolId,
        lessonId,
        weekNumber
      );
      res.json({ status: 'success', data: slots });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /hybrid-bookings
 * Create a new hybrid booking
 * Body: { lessonId, studentId, weekNumber, scheduledDate, startTime, endTime }
 * Access: Parent (only for their own children)
 */
router.post(
  '/',
  parentOrAbove,
  validateCreateBooking,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent ID from user
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
      });

      if (!parent) {
        throw new AppError('Parent profile not found.', 404);
      }

      const booking = await hybridBookingService.createHybridBooking(
        req.user!.schoolId,
        parent.id,
        req.body as CreateBookingInput
      );

      res.status(201).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /hybrid-bookings/my-bookings
 * Get parent's own bookings
 * Query: lessonId?, status?, weekNumber?
 * Access: Parent
 */
router.get(
  '/my-bookings',
  parentOrAbove,
  validateMyBookingsFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent ID from user
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
      });

      if (!parent) {
        throw new AppError('Parent profile not found.', 404);
      }

      const filters = req.query as unknown as MyBookingsFilter;
      const bookings = await hybridBookingService.getParentBookings(
        req.user!.schoolId,
        parent.id,
        filters
      );

      res.json({ status: 'success', data: bookings });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /hybrid-bookings/:id
 * Get a single booking by ID
 * Access: Parent (own booking), Admin, Teacher
 */
router.get(
  '/:id',
  parentOrAbove,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await hybridBookingService.getBooking(
        req.user!.schoolId,
        req.params.id,
        req.user!.userId,
        req.user!.role
      );

      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      res.json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /hybrid-bookings/:id
 * Reschedule a booking
 * Body: { scheduledDate, startTime, endTime }
 * Access: Parent (own booking only)
 */
router.patch(
  '/:id',
  parentOrAbove,
  validateRescheduleBooking,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent ID from user
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
      });

      if (!parent) {
        throw new AppError('Parent profile not found.', 404);
      }

      const booking = await hybridBookingService.rescheduleHybridBooking(
        req.user!.schoolId,
        parent.id,
        req.params.id,
        req.body as RescheduleBookingInput
      );

      res.json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /hybrid-bookings/:id
 * Cancel a booking
 * Body: { reason? }
 * Access: Parent (own booking only)
 */
router.delete(
  '/:id',
  parentOrAbove,
  validateCancelBooking,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent ID from user
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
      });

      if (!parent) {
        throw new AppError('Parent profile not found.', 404);
      }

      const { reason } = req.body as CancelBookingInput;
      await hybridBookingService.cancelHybridBooking(
        req.user!.schoolId,
        parent.id,
        req.params.id,
        reason
      );

      res.json({ status: 'success', message: 'Booking cancelled' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ADMIN HYBRID MANAGEMENT ENDPOINTS
// ===========================================

/**
 * PATCH /hybrid-bookings/lessons/:lessonId/open-bookings
 * Open bookings for a hybrid lesson
 * Access: Admin only
 */
router.patch(
  '/lessons/:lessonId/open-bookings',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pattern = await hybridBookingService.toggleBookingsOpen(
        req.user!.schoolId,
        req.params.lessonId,
        true
      );
      res.json({ status: 'success', data: pattern, message: 'Bookings opened' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /hybrid-bookings/lessons/:lessonId/close-bookings
 * Close bookings for a hybrid lesson
 * Access: Admin only
 */
router.patch(
  '/lessons/:lessonId/close-bookings',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pattern = await hybridBookingService.toggleBookingsOpen(
        req.user!.schoolId,
        req.params.lessonId,
        false
      );
      res.json({ status: 'success', data: pattern, message: 'Bookings closed' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /hybrid-bookings/lessons/:lessonId/bookings
 * Get all bookings for a lesson
 * Query: weekNumber?, status?
 * Access: Admin, Teacher
 */
router.get(
  '/lessons/:lessonId/bookings',
  teacherOrAdmin,
  validateLessonBookingsFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as LessonBookingsFilter;
      const bookings = await hybridBookingService.getLessonBookings(
        req.user!.schoolId,
        req.params.lessonId,
        filters
      );
      res.json({ status: 'success', data: bookings });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /hybrid-bookings/lessons/:lessonId/stats
 * Get booking statistics for a lesson
 * Query: weekNumber?
 * Access: Admin, Teacher
 */
router.get(
  '/lessons/:lessonId/stats',
  teacherOrAdmin,
  validateWeekNumberQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const weekNumber = req.query.weekNumber
        ? Number(req.query.weekNumber)
        : undefined;
      const stats = await hybridBookingService.getHybridBookingStats(
        req.user!.schoolId,
        req.params.lessonId,
        weekNumber
      );
      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /hybrid-bookings/lessons/:lessonId/unbooked
 * Get students who haven't booked for a specific week
 * Query: weekNumber
 * Access: Admin, Teacher
 */
router.get(
  '/lessons/:lessonId/unbooked',
  teacherOrAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const weekNumber = req.query.weekNumber
        ? Number(req.query.weekNumber)
        : undefined;

      if (!weekNumber) {
        throw new AppError('weekNumber query parameter is required.', 400);
      }

      const unbookedStudents = await hybridBookingService.getStudentsWithoutBookings(
        req.user!.schoolId,
        req.params.lessonId,
        weekNumber
      );

      res.json({ status: 'success', data: unbookedStudents });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /hybrid-bookings/lessons/:lessonId/send-reminders
 * Send booking reminders to parents who haven't booked
 * Query: weekNumber
 * Access: Admin only
 */
router.post(
  '/lessons/:lessonId/send-reminders',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const weekNumber = req.query.weekNumber
        ? Number(req.query.weekNumber)
        : undefined;

      if (!weekNumber) {
        throw new AppError('weekNumber query parameter is required.', 400);
      }

      const unbookedStudents = await hybridBookingService.getStudentsWithoutBookings(
        req.user!.schoolId,
        req.params.lessonId,
        weekNumber
      );

      // TODO: Implement email sending in Week 10
      // For now, just return the list of parents who need reminders
      const parentEmails = unbookedStudents.map((s) => ({
        email: s.parent.user.email,
        parentName: `${s.parent.user.firstName} ${s.parent.user.lastName}`,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
      }));

      res.json({
        status: 'success',
        message: `Would send reminders to ${parentEmails.length} parents (email not yet implemented)`,
        data: { count: parentEmails.length, parents: parentEmails },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
