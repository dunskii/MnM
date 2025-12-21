// ===========================================
// Validation Middleware (Zod)
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = <T extends ZodSchema>(
  schema: T,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.parse(data);

      // Replace the original data with parsed/transformed data
      req[target] = result;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        next(new AppError(errors.join('. '), 400));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Format Zod errors into human-readable messages
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    const message = err.message;

    if (path) {
      return `${path}: ${message}`;
    }
    return message;
  });
}

// ===========================================
// AUTH SCHEMAS
// ===========================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required'),
  schoolSlug: z
    .string()
    .optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    ),
});

export const validateInviteTokenSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ValidateInviteTokenInput = z.infer<typeof validateInviteTokenSchema>;

// ===========================================
// CONVENIENCE VALIDATORS
// ===========================================

export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateInviteToken = validate(validateInviteTokenSchema, 'params');
