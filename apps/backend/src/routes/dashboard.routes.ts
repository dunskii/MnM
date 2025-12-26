// ===========================================
// Dashboard Routes
// ===========================================
// Endpoints for dashboard statistics and activity feeds
// CRITICAL: All data MUST be filtered by schoolId

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin, parentOrAbove } from '../middleware/authorize';
import * as dashboardService from '../services/dashboard.service';
import {
  validateActivityFeedQuery,
  validateRecentFilesQuery,
  validatePendingMeetAndGreetsQuery,
} from '../validators/dashboard.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// ADMIN DASHBOARD
// ===========================================

/**
 * GET /dashboard/admin/stats
 * Get admin dashboard statistics
 * Access: Admin only
 */
router.get(
  '/admin/stats',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await dashboardService.getAdminDashboardStats(req.user!.schoolId);
      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/admin/activity-feed
 * Get recent school activity
 * Access: Admin only
 */
router.get(
  '/admin/activity-feed',
  adminOnly,
  validateActivityFeedQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await dashboardService.getActivityFeed(req.user!.schoolId, limit);
      res.json({ status: 'success', data: activities });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/admin/drive-sync-status
 * Get Google Drive sync status
 * Access: Admin only
 */
router.get(
  '/admin/drive-sync-status',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await dashboardService.getDriveSyncStatus(req.user!.schoolId);
      res.json({ status: 'success', data: status });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/admin/pending-meet-and-greets
 * Get pending meet & greets for admin
 * Access: Admin only
 */
router.get(
  '/admin/pending-meet-and-greets',
  adminOnly,
  validatePendingMeetAndGreetsQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const meetAndGreets = await dashboardService.getPendingMeetAndGreets(
        req.user!.schoolId,
        { limit }
      );
      res.json({ status: 'success', data: meetAndGreets });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// TEACHER DASHBOARD
// ===========================================

/**
 * GET /dashboard/teacher/stats
 * Get teacher dashboard statistics
 * Access: Teacher or Admin
 */
router.get(
  '/teacher/stats',
  teacherOrAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get teacher ID from user
      const teacherId = req.user!.teacherId;
      if (!teacherId) {
        res.status(403).json({
          status: 'error',
          message: 'Teacher profile not found',
        });
        return;
      }

      const stats = await dashboardService.getTeacherDashboardStats(
        req.user!.schoolId,
        teacherId
      );
      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/teacher/recent-files
 * Get recently uploaded files by this teacher
 * Access: Teacher or Admin
 */
router.get(
  '/teacher/recent-files',
  teacherOrAdmin,
  validateRecentFilesQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const files = await dashboardService.getRecentlyUploadedFiles(
        req.user!.schoolId,
        { uploadedBy: req.user!.id, limit }
      );
      res.json({ status: 'success', data: files });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/teacher/assigned-meet-and-greets
 * Get meet & greets assigned to this teacher
 * Access: Teacher or Admin
 */
router.get(
  '/teacher/assigned-meet-and-greets',
  teacherOrAdmin,
  validatePendingMeetAndGreetsQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teacherId = req.user!.teacherId;
      if (!teacherId) {
        res.status(403).json({
          status: 'error',
          message: 'Teacher profile not found',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const meetAndGreets = await dashboardService.getPendingMeetAndGreets(
        req.user!.schoolId,
        { teacherId, limit }
      );
      res.json({ status: 'success', data: meetAndGreets });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// PARENT DASHBOARD
// ===========================================

/**
 * GET /dashboard/parent/stats
 * Get parent dashboard statistics
 * Access: Parent or Admin
 */
router.get(
  '/parent/stats',
  parentOrAbove,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent ID from user
      const parentId = req.user!.parentId;
      if (!parentId) {
        res.status(403).json({
          status: 'error',
          message: 'Parent profile not found',
        });
        return;
      }

      const stats = await dashboardService.getParentDashboardStats(
        req.user!.schoolId,
        parentId
      );
      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /dashboard/parent/shared-files
 * Get files shared with this parent's family
 * Access: Parent or Admin
 */
router.get(
  '/parent/shared-files',
  parentOrAbove,
  validateRecentFilesQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parentId = req.user!.parentId;
      if (!parentId) {
        res.status(403).json({
          status: 'error',
          message: 'Parent profile not found',
        });
        return;
      }

      // For now, use general recent files with visibility filter
      // This could be enhanced to filter by family's enrolled lessons
      const limit = parseInt(req.query.limit as string) || 5;
      const files = await dashboardService.getRecentlyUploadedFiles(
        req.user!.schoolId,
        { limit }
      );
      res.json({ status: 'success', data: files });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
