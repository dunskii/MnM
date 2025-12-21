// ===========================================
// Parent Routes
// ===========================================
// Routes for parent management (admin only)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import * as parentService from '../services/parent.service';
import {
  validateCreateParent,
  validateUpdateParent,
  CreateParentInput,
  UpdateParentInput,
} from '../validators/user.validators';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(adminOnly);

// ===========================================
// PARENT CRUD
// ===========================================

/**
 * GET /parents
 * Get all parents
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parents = await parentService.getParents(req.user!.schoolId);
      res.json({ status: 'success', data: parents });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /parents/:id
 * Get a single parent
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parent = await parentService.getParent(
        req.user!.schoolId,
        req.params.id
      );
      if (!parent) {
        res.status(404).json({ status: 'error', message: 'Parent not found' });
        return;
      }
      res.json({ status: 'success', data: parent });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /parents
 * Create a new parent (with user account)
 */
router.post(
  '/',
  validateCreateParent,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parent = await parentService.createParent(
        req.user!.schoolId,
        req.body as CreateParentInput
      );
      res.status(201).json({ status: 'success', data: parent });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /parents/:id
 * Update a parent
 */
router.patch(
  '/:id',
  validateUpdateParent,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parent = await parentService.updateParent(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateParentInput
      );
      res.json({ status: 'success', data: parent });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /parents/:id
 * Delete a parent (soft delete)
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await parentService.deleteParent(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Parent deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
