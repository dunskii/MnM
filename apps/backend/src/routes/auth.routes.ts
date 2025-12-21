// ===========================================
// Authentication Routes
// ===========================================

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { loginRateLimiter } from '../middleware/rateLimiter';
import {
  validateLogin,
  validateRefreshToken,
  validateChangePassword,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from '../middleware/validate';
import { getClientIP } from '../utils/request';
import * as authService from '../services/auth.service';
import * as tokenService from '../services/token.service';
import * as passwordService from '../services/password.service';

const router = Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

/**
 * POST /auth/login
 * Authenticate user and get tokens
 */
router.post(
  '/login',
  loginRateLimiter,
  validateLogin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as LoginInput;
      const ipAddress = getClientIP(req);

      const result = await authService.login(
        {
          email: body.email,
          password: body.password,
          schoolSlug: body.schoolSlug,
        },
        ipAddress
      );

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validateRefreshToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;

      const tokens = await tokenService.refreshAccessToken(refreshToken);

      res.json({
        status: 'success',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// PROTECTED ROUTES
// ===========================================

/**
 * POST /auth/logout
 * Revoke refresh token
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      await authService.logout(req.user!.userId, refreshToken);

      res.json({
        status: 'success',
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout-all
 * Revoke all refresh tokens (logout from all devices)
 */
router.post(
  '/logout-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.revokeAllTokens(req.user!.userId);

      res.json({
        status: 'success',
        message: 'Logged out from all devices.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getAuthUser(req.user!.userId);

      res.json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/change-password
 * Change password for authenticated user
 */
router.post(
  '/change-password',
  authenticate,
  validateChangePassword,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as ChangePasswordInput;

      await passwordService.changePassword(
        req.user!.userId,
        body.currentPassword,
        body.newPassword
      );

      res.json({
        status: 'success',
        message: 'Password changed successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/sessions
 * Get active sessions for current user
 */
router.get(
  '/sessions',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await tokenService.getActiveSessions(req.user!.userId);

      res.json({
        status: 'success',
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await tokenService.revokeSession(
        req.user!.userId,
        req.params.sessionId
      );

      res.json({
        status: 'success',
        message: 'Session revoked.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
