// ===========================================
// Teacher Routes
// ===========================================
// Routes for teacher management (admin only)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import * as teacherService from '../services/teacher.service';
import {
  validateCreateTeacher,
  validateUpdateTeacher,
  validateAssignInstrument,
  CreateTeacherInput,
  UpdateTeacherInput,
  AssignInstrumentInput,
} from '../validators/user.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// TEACHER CRUD (Admin Only)
// ===========================================

/**
 * GET /teachers
 * Get all teachers
 */
router.get(
  '/',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teachers = await teacherService.getTeachers(req.user!.schoolId);
      res.json({ status: 'success', data: teachers });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /teachers/:id
 * Get a single teacher
 */
router.get(
  '/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teacher = await teacherService.getTeacher(
        req.user!.schoolId,
        req.params.id
      );
      if (!teacher) {
        res.status(404).json({ status: 'error', message: 'Teacher not found' });
        return;
      }
      res.json({ status: 'success', data: teacher });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /teachers
 * Create a new teacher
 */
router.post(
  '/',
  adminOnly,
  validateCreateTeacher,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teacher = await teacherService.createTeacher(
        req.user!.schoolId,
        req.body as CreateTeacherInput
      );
      res.status(201).json({ status: 'success', data: teacher });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /teachers/:id
 * Update a teacher
 */
router.patch(
  '/:id',
  adminOnly,
  validateUpdateTeacher,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teacher = await teacherService.updateTeacher(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateTeacherInput
      );
      res.json({ status: 'success', data: teacher });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /teachers/:id
 * Delete a teacher (soft delete)
 */
router.delete(
  '/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await teacherService.deleteTeacher(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Teacher deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// INSTRUMENT ASSIGNMENTS (Admin Only)
// ===========================================

/**
 * POST /teachers/:id/instruments
 * Assign an instrument to a teacher
 */
router.post(
  '/:id/instruments',
  adminOnly,
  validateAssignInstrument,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { instrumentId, isPrimary } = req.body as AssignInstrumentInput;
      await teacherService.assignInstrument(
        req.user!.schoolId,
        req.params.id,
        instrumentId,
        isPrimary
      );
      res.status(201).json({ status: 'success', message: 'Instrument assigned' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /teachers/:id/instruments/:instrumentId
 * Remove an instrument from a teacher
 */
router.delete(
  '/:id/instruments/:instrumentId',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await teacherService.removeInstrument(
        req.user!.schoolId,
        req.params.id,
        req.params.instrumentId
      );
      res.json({ status: 'success', message: 'Instrument removed' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /teachers/:id/instruments/:instrumentId/primary
 * Set an instrument as primary for a teacher
 */
router.patch(
  '/:id/instruments/:instrumentId/primary',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await teacherService.setPrimaryInstrument(
        req.user!.schoolId,
        req.params.id,
        req.params.instrumentId
      );
      res.json({ status: 'success', message: 'Primary instrument set' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
