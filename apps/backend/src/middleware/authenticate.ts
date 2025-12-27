// ===========================================
// Authentication Middleware
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { prisma } from '../config/database';

/**
 * Middleware to verify JWT access token and attach user to request
 * Required for all protected routes
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // Verify the token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'jwt expired') {
          throw new AppError('Session expired. Please log in again.', 401);
        }
        if (error.message === 'invalid signature') {
          throw new AppError('Invalid authentication token.', 401);
        }
      }
      throw new AppError('Invalid authentication token.', 401);
    }

    // SECURITY: Check if token has been revoked
    if (payload.jti) {
      const isRevoked = await prisma.revokedToken.findUnique({
        where: { jti: payload.jti },
      });

      if (isRevoked) {
        throw new AppError('Session has been revoked. Please log in again.', 401);
      }
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        schoolId: true,
        role: true,
        email: true,
        isActive: true,
        deletionStatus: true,
        teacher: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact support.', 401);
    }

    if (user.deletionStatus !== 'ACTIVE') {
      throw new AppError('Account is pending deletion.', 401);
    }

    // Verify schoolId matches (multi-tenancy security)
    if (user.schoolId !== payload.schoolId) {
      throw new AppError('Invalid authentication context.', 401);
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      id: user.id, // Alias for convenience
      schoolId: user.schoolId,
      role: user.role,
      email: user.email,
      teacherId: user.teacher?.id,
      parentId: user.parent?.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if valid
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // No token, continue without user
      return next();
    }

    try {
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          schoolId: true,
          role: true,
          email: true,
          isActive: true,
          deletionStatus: true,
          teacher: { select: { id: true } },
          parent: { select: { id: true } },
        },
      });

      if (user && user.isActive && user.deletionStatus === 'ACTIVE') {
        req.user = {
          userId: user.id,
          id: user.id,
          schoolId: user.schoolId,
          role: user.role,
          email: user.email,
          teacherId: user.teacher?.id,
          parentId: user.parent?.id,
        };
      }
    } catch {
      // Invalid token, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};
