// ===========================================
// Resources Routes
// ===========================================
// Routes for file upload and resource management
// - Teachers can upload resources to lessons or students
// - Admin can manage all resources
// - Parents/Students can view based on visibility settings

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin, parentOrAbove, parentOfStudent } from '../middleware/authorize';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as resourcesService from '../services/resources.service';
import {
  validateUploadResourceMetadata,
  validateUpdateResource,
  validateResourcesByLessonFilter,
  validateResourcesByStudentFilter,
  validateResourceIdParam,
  validateLessonIdParam,
  validateStudentIdParam,
  UploadResourceMetadata,
  UpdateResourceInput,
  ResourcesByLessonFilter,
  ResourcesByStudentFilter,
  MAX_FILE_SIZE,
} from '../validators/resources.validators';

const router = Router();

// ===========================================
// MULTER CONFIGURATION
// ===========================================

// Use memory storage for processing before saving
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 25MB
    files: 1,
  },
});

// All routes require authentication
router.use(authenticate);

// ===========================================
// UPLOAD ENDPOINT
// ===========================================

/**
 * POST /resources
 * Upload a new resource file
 * Body (multipart/form-data): file, lessonId?, studentId?, visibility?, tags?
 * Access: Teacher, Admin
 */
router.post(
  '/',
  teacherOrAdmin,
  upload.single('file'),
  validateUploadResourceMetadata,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const file = {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      };

      const resource = await resourcesService.uploadResource(
        req.user!.schoolId,
        req.user!.userId,
        file,
        req.body as UploadResourceMetadata
      );

      res.status(201).json({ status: 'success', data: resource });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// UPDATE/DELETE ENDPOINTS
// ===========================================

/**
 * PATCH /resources/:id
 * Update resource metadata
 * Body: { visibility?, tags? }
 * Access: Teacher (uploader only), Admin
 */
router.patch(
  '/:id',
  teacherOrAdmin,
  validateResourceIdParam,
  validateUpdateResource,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verify ownership for teachers
      if (req.user!.role === 'TEACHER') {
        const existing = await resourcesService.getResource(
          req.user!.schoolId,
          req.params.id,
          req.user!.role
        );
        if (!existing) {
          throw new AppError('Resource not found', 404);
        }
        if (existing.uploadedById !== req.user!.userId) {
          throw new AppError('You can only edit your own resources', 403);
        }
      }

      const resource = await resourcesService.updateResource(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateResourceInput
      );

      res.json({ status: 'success', data: resource });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /resources/:id
 * Delete a resource and its file
 * Access: Teacher (uploader only), Admin
 */
router.delete(
  '/:id',
  teacherOrAdmin,
  validateResourceIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verify ownership for teachers
      if (req.user!.role === 'TEACHER') {
        const existing = await resourcesService.getResource(
          req.user!.schoolId,
          req.params.id,
          req.user!.role
        );
        if (!existing) {
          throw new AppError('Resource not found', 404);
        }
        if (existing.uploadedById !== req.user!.userId) {
          throw new AppError('You can only delete your own resources', 403);
        }
      }

      await resourcesService.deleteResource(req.user!.schoolId, req.params.id);

      res.json({ status: 'success', message: 'Resource deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// GET ENDPOINTS
// ===========================================

// NOTE: Static routes MUST come before parameterized routes to avoid matching issues

/**
 * GET /resources/stats
 * Get resource statistics for the school
 * Access: Admin only
 */
router.get(
  '/stats',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await resourcesService.getResourceStats(req.user!.schoolId);

      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /resources/lesson/:lessonId
 * Get resources for a lesson
 * Query: visibility?, tags?
 * Access: Based on visibility settings
 */
router.get(
  '/lesson/:lessonId',
  parentOrAbove,
  validateLessonIdParam,
  validateResourcesByLessonFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resources = await resourcesService.getResourcesByLesson(
        req.user!.schoolId,
        req.params.lessonId,
        req.user!.role,
        req.query as ResourcesByLessonFilter
      );

      res.json({ status: 'success', data: resources });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /resources/student/:studentId
 * Get resources for a student
 * Query: lessonId?, visibility?, tags?
 * Access: Teacher, Admin, Parent (own children only)
 */
router.get(
  '/student/:studentId',
  parentOrAbove,
  parentOfStudent,
  validateStudentIdParam,
  validateResourcesByStudentFilter,
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
          throw new AppError('You can only view resources for your own children', 403);
        }
      }

      const resources = await resourcesService.getResourcesByStudent(
        req.user!.schoolId,
        studentId,
        req.user!.role,
        req.query as ResourcesByStudentFilter
      );

      res.json({ status: 'success', data: resources });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /resources/:id
 * Get resource metadata
 * Access: Based on visibility settings
 */
router.get(
  '/:id',
  parentOrAbove,
  validateResourceIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await resourcesService.getResource(
        req.user!.schoolId,
        req.params.id,
        req.user!.role
      );

      if (!resource) {
        throw new AppError('Resource not found', 404);
      }

      res.json({ status: 'success', data: resource });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /resources/:id/download
 * Download resource file
 * Access: Based on visibility settings
 */
router.get(
  '/:id/download',
  parentOrAbove,
  validateResourceIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stream, fileName, mimeType, size } = await resourcesService.downloadResource(
        req.user!.schoolId,
        req.params.id,
        req.user!.role
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', size);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
