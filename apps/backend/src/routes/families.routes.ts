// ===========================================
// Family Routes
// ===========================================
// Routes for family management (admin only)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import * as familyService from '../services/family.service';
import {
  validateCreateFamily,
  validateUpdateFamily,
  validateAddStudentToFamily,
  validateAddParentToFamily,
  CreateFamilyInput,
  UpdateFamilyInput,
  AddStudentToFamilyInput,
  AddParentToFamilyInput,
} from '../validators/user.validators';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(adminOnly);

// ===========================================
// FAMILY CRUD
// ===========================================

/**
 * GET /families
 * Get all families (with members)
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const families = await familyService.getFamilies(req.user!.schoolId);
      res.json({ status: 'success', data: families });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /families/:id
 * Get a single family
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const family = await familyService.getFamily(
        req.user!.schoolId,
        req.params.id
      );
      if (!family) {
        res.status(404).json({ status: 'error', message: 'Family not found' });
        return;
      }
      res.json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /families
 * Create a new family
 */
router.post(
  '/',
  validateCreateFamily,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const family = await familyService.createFamily(
        req.user!.schoolId,
        req.body as CreateFamilyInput
      );
      res.status(201).json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /families/:id
 * Update a family
 */
router.patch(
  '/:id',
  validateUpdateFamily,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const family = await familyService.updateFamily(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateFamilyInput
      );
      res.json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /families/:id
 * Delete a family (soft delete)
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await familyService.deleteFamily(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Family deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// STUDENT MEMBERSHIP
// ===========================================

/**
 * POST /families/:id/students
 * Add a student to a family
 */
router.post(
  '/:id/students',
  validateAddStudentToFamily,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.body as AddStudentToFamilyInput;
      const family = await familyService.addStudentToFamily(
        req.user!.schoolId,
        req.params.id,
        studentId
      );
      res.json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /families/:id/students/:studentId
 * Remove a student from a family
 */
router.delete(
  '/:id/students/:studentId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const family = await familyService.removeStudentFromFamily(
        req.user!.schoolId,
        req.params.id,
        req.params.studentId
      );
      res.json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// PARENT MEMBERSHIP
// ===========================================

/**
 * POST /families/:id/parents
 * Add a parent to a family
 */
router.post(
  '/:id/parents',
  validateAddParentToFamily,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { parentId, isPrimary } = req.body as AddParentToFamilyInput;
      const family = await familyService.addParentToFamily(
        req.user!.schoolId,
        req.params.id,
        parentId,
        isPrimary
      );
      res.json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /families/:id/parents/:parentId
 * Remove a parent from a family
 */
router.delete(
  '/:id/parents/:parentId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const family = await familyService.removeParentFromFamily(
        req.user!.schoolId,
        req.params.id,
        req.params.parentId
      );
      res.json({ status: 'success', data: family });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
