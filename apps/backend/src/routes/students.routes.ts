// ===========================================
// Student Routes
// ===========================================
// Routes for student management
// NOTE: Teachers can VIEW all students, but only admins can create/update/delete

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin } from '../middleware/authorize';
import * as studentService from '../services/student.service';
import {
  validateCreateStudent,
  validateUpdateStudent,
  validateStudentFilters,
  CreateStudentInput,
  UpdateStudentInput,
  StudentFiltersInput,
} from '../validators/user.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// READ OPERATIONS (Teachers and Admins)
// ===========================================

/**
 * GET /students
 * Get all students (teachers can view for coverage)
 */
router.get(
  '/',
  teacherOrAdmin,
  validateStudentFilters,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as StudentFiltersInput;
      const students = await studentService.getStudents(req.user!.schoolId, filters);
      res.json({ status: 'success', data: students });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /students/:id
 * Get a single student (teachers can view for coverage)
 */
router.get(
  '/:id',
  teacherOrAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await studentService.getStudent(
        req.user!.schoolId,
        req.params.id
      );
      if (!student) {
        res.status(404).json({ status: 'error', message: 'Student not found' });
        return;
      }
      res.json({ status: 'success', data: student });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// WRITE OPERATIONS (Admin Only)
// ===========================================

/**
 * POST /students
 * Create a new student
 */
router.post(
  '/',
  adminOnly,
  validateCreateStudent,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await studentService.createStudent(
        req.user!.schoolId,
        req.body as CreateStudentInput
      );
      res.status(201).json({ status: 'success', data: student });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /students/:id
 * Update a student
 */
router.patch(
  '/:id',
  adminOnly,
  validateUpdateStudent,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await studentService.updateStudent(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateStudentInput
      );
      res.json({ status: 'success', data: student });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /students/:id
 * Delete a student (soft delete)
 */
router.delete(
  '/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await studentService.deleteStudent(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Student deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// FAMILY ASSIGNMENT (Admin Only)
// ===========================================

/**
 * POST /students/:id/family/:familyId
 * Assign a student to a family
 */
router.post(
  '/:id/family/:familyId',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await studentService.assignToFamily(
        req.user!.schoolId,
        req.params.id,
        req.params.familyId
      );
      res.json({ status: 'success', data: student });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /students/:id/family
 * Remove a student from their family
 */
router.delete(
  '/:id/family',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await studentService.removeFromFamily(
        req.user!.schoolId,
        req.params.id
      );
      res.json({ status: 'success', data: student });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
