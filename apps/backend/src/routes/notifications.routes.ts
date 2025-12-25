// ===========================================
// Notification Routes
// ===========================================
// Routes for notification preference management
// - All users can manage their own notification preferences
// - Used by parent dashboard for email notification settings

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as notificationService from '../services/notification.service';
import {
  validateUpdatePreferences,
  UpdatePreferencesInput,
} from '../validators/notification.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// PREFERENCE ENDPOINTS
// ===========================================

/**
 * GET /notifications/preferences
 * Get current user's notification preferences
 * Returns preferences or creates default if none exist
 * Access: All authenticated users
 */
router.get(
  '/preferences',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preferences = await notificationService.getPreferences(
        req.user!.schoolId,
        req.user!.userId
      );

      res.json({ status: 'success', data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/preferences
 * Update notification preferences
 * Body: { emailNotificationsEnabled?, notificationTypes?, quietHoursEnabled?, quietHoursStart?, quietHoursEnd? }
 * Access: All authenticated users (own preferences only)
 */
router.patch(
  '/preferences',
  validateUpdatePreferences,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preferences = await notificationService.updatePreferences(
        req.user!.schoolId,
        req.user!.userId,
        req.body as UpdatePreferencesInput
      );

      res.json({ status: 'success', data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /notifications/preferences/reset
 * Reset notification preferences to defaults
 * Access: All authenticated users (own preferences only)
 */
router.post(
  '/preferences/reset',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preferences = await notificationService.resetToDefaults(
        req.user!.schoolId,
        req.user!.userId
      );

      res.json({ status: 'success', data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
