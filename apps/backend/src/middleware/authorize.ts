// ===========================================
// Authorization Middleware
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler';

/**
 * Role-based access control middleware
 * Restricts access to users with specified roles
 *
 * @param allowedRoles - Array of roles that can access the route
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          403
        )
      );
    }

    next();
  };
};

/**
 * Shorthand middleware for admin-only routes
 */
export const adminOnly = authorize(UserRole.ADMIN);

/**
 * Shorthand middleware for teachers and admins
 */
export const teacherOrAdmin = authorize(UserRole.ADMIN, UserRole.TEACHER);

/**
 * Shorthand middleware for parents and above
 */
export const parentOrAbove = authorize(
  UserRole.ADMIN,
  UserRole.TEACHER,
  UserRole.PARENT
);

/**
 * Shorthand middleware for parent-only routes
 */
export const parentOnly = authorize(UserRole.PARENT);

/**
 * Middleware to ensure user can only access their own resources
 * or resources within their school
 *
 * @param paramName - Request parameter containing the resource's schoolId
 */
export const sameSchoolOnly = (paramName = 'schoolId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const resourceSchoolId = req.params[paramName] || req.body?.[paramName];

    if (resourceSchoolId && resourceSchoolId !== req.user.schoolId) {
      return next(
        new AppError('You cannot access resources from another school.', 403)
      );
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own data
 * Admins can access any user's data within their school
 *
 * @param paramName - Request parameter containing the userId
 */
export const selfOrAdmin = (paramName = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const targetUserId = req.params[paramName];

    // Admins can access any user within their school
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Other users can only access their own data
    if (targetUserId && targetUserId !== req.user.userId) {
      return next(
        new AppError('You can only access your own data.', 403)
      );
    }

    next();
  };
};

/**
 * Middleware to ensure parent can access their children's data
 */
export const parentOfStudent = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  // Admins and teachers can access any student
  if (
    req.user.role === UserRole.ADMIN ||
    req.user.role === UserRole.TEACHER
  ) {
    return next();
  }

  // For parents, we need to verify the student belongs to their family
  // This check is typically done in the service layer where we have
  // access to the database. Here we just ensure they're a parent.
  if (req.user.role !== UserRole.PARENT) {
    return next(
      new AppError('Only parents can access student data.', 403)
    );
  }

  // Detailed parent-child verification happens in the service layer
  next();
};
