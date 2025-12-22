// ===========================================
// Meet & Greet Routes
// ===========================================
// Public routes for booking and verification
// Admin routes for management

import { Router, Request, Response, NextFunction } from 'express';
import * as meetAndGreetService from '../services/meetAndGreet.service';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware';
import { MeetAndGreetStatus } from '@prisma/client';
import {
  validateCreateMeetAndGreet,
  validateUpdateMeetAndGreet,
  validateRejectMeetAndGreet,
} from '../validators/meetAndGreet.validators';
import { getClientIP } from '../utils/request';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ===========================================
// SIMPLE RATE LIMITER FOR PUBLIC ENDPOINTS
// ===========================================

// In-memory rate limit store (consider Redis for production scaling)
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

/**
 * Simple rate limiter middleware
 * @param maxRequests Maximum requests allowed in window
 * @param windowMs Time window in milliseconds
 */
function rateLimiter(maxRequests: number = 5, windowMs: number = 3600000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);
    const now = Date.now();

    // Clean expired entries periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetAt < now) {
          rateLimitStore.delete(key);
        }
      }
    }

    const entry = rateLimitStore.get(ip);

    if (!entry || entry.resetAt < now) {
      // New window
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return next(
        new AppError(
          `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          429
        )
      );
    }

    entry.count++;
    next();
  };
}

// ===========================================
// PUBLIC ENDPOINTS (No Auth)
// ===========================================

/**
 * POST /public/meet-and-greet
 * Create a new meet & greet booking (public, no auth required)
 * Rate limited: 5 requests per hour per IP
 */
router.post(
  '/public/meet-and-greet',
  rateLimiter(5, 60 * 60 * 1000), // 5 per hour
  validateCreateMeetAndGreet,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await meetAndGreetService.createMeetAndGreet(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /public/meet-and-greet/verify/:token
 * Verify email address for booking
 */
router.get(
  '/public/meet-and-greet/verify/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const result = await meetAndGreetService.verifyMeetAndGreetEmail(token);

      res.json({
        status: 'success',
        data: {
          message: 'Email verified! Your meet & greet booking is confirmed.',
          meetAndGreet: {
            id: result.id,
            parentName: result.contact1Name,
            childName: `${result.studentFirstName} ${result.studentLastName}`,
            status: result.status,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /public/schools/:slug/info
 * Get school info for booking form (public)
 */
router.get(
  '/public/schools/:slug/info',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const school = await prisma.school.findUnique({
        where: { slug: req.params.slug },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      if (!school) {
        res.status(404).json({
          status: 'error',
          message: 'School not found',
        });
        return;
      }

      if (!school.isActive) {
        res.status(400).json({
          status: 'error',
          message: 'This school is not currently accepting bookings',
        });
        return;
      }

      res.json({ status: 'success', data: school });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /public/schools/:slug/instruments
 * Get available instruments for a school (for booking form dropdown)
 */
router.get(
  '/public/schools/:slug/instruments',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const school = await prisma.school.findUnique({
        where: { slug: req.params.slug },
        select: { id: true },
      });

      if (!school) {
        res.status(404).json({
          status: 'error',
          message: 'School not found',
        });
        return;
      }

      const instruments = await prisma.instrument.findMany({
        where: { schoolId: school.id, isActive: true },
        select: { id: true, name: true },
        orderBy: { sortOrder: 'asc' },
      });

      res.json({ status: 'success', data: instruments });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ADMIN ENDPOINTS (Auth Required)
// ===========================================

/**
 * GET /admin/meet-and-greet
 * List all meet & greet bookings for school
 */
router.get(
  '/admin/meet-and-greet',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId;
      const { status, startDate, endDate, teacherId } = req.query;

      const filters = {
        status: status as MeetAndGreetStatus | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        teacherId: teacherId as string,
      };

      const meetAndGreets =
        await meetAndGreetService.getMeetAndGreets(schoolId, filters);

      res.json({ status: 'success', data: meetAndGreets });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/meet-and-greet/counts
 * Get meet & greet counts by status for dashboard
 */
router.get(
  '/admin/meet-and-greet/counts',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId;
      const counts = await meetAndGreetService.getMeetAndGreetCounts(schoolId);
      res.json({ status: 'success', data: counts });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/meet-and-greet/:id
 * Get single meet & greet details
 */
router.get(
  '/admin/meet-and-greet/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schoolId = req.user!.schoolId;
      const { id } = req.params;

      const meetAndGreet = await meetAndGreetService.getMeetAndGreet(
        schoolId,
        id
      );

      if (!meetAndGreet) {
        res.status(404).json({
          status: 'error',
          message: 'Meet & greet not found',
        });
        return;
      }

      res.json({ status: 'success', data: meetAndGreet });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/meet-and-greet/:id
 * Update meet & greet (assign teacher, add notes, etc.)
 */
router.patch(
  '/admin/meet-and-greet/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validateUpdateMeetAndGreet,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId;
      const { id } = req.params;

      const updated = await meetAndGreetService.updateMeetAndGreet(
        schoolId,
        id,
        req.body
      );

      res.json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/meet-and-greet/:id/approve
 * Approve meet & greet and send registration link
 */
router.post(
  '/admin/meet-and-greet/:id/approve',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId;
      const { id } = req.params;

      const result = await meetAndGreetService.approveMeetAndGreet(schoolId, id);

      res.json({
        status: 'success',
        data: {
          message: 'Registration email sent to parent.',
          registrationUrl: result.registrationUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/meet-and-greet/:id/reject
 * Reject meet & greet with reason
 */
router.post(
  '/admin/meet-and-greet/:id/reject',
  authenticate,
  authorize('ADMIN'),
  validateRejectMeetAndGreet,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId;
      const { id } = req.params;
      const { reason } = req.body;

      const result = await meetAndGreetService.rejectMeetAndGreet(
        schoolId,
        id,
        reason
      );

      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/meet-and-greet/:id
 * Cancel/delete a meet & greet
 */
router.delete(
  '/admin/meet-and-greet/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId;
      const { id } = req.params;

      await meetAndGreetService.cancelMeetAndGreet(schoolId, id);

      res.json({
        status: 'success',
        data: { message: 'Meet & greet cancelled successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
