// ===========================================
// Dashboard Validators
// ===========================================
// Zod schemas for dashboard endpoint validation

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ===========================================
// SCHEMAS
// ===========================================

export const activityFeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export const recentFilesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).optional().default(5),
});

export const pendingMeetAndGreetsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

// ===========================================
// VALIDATION MIDDLEWARE
// ===========================================

export function validateActivityFeedQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = activityFeedQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters',
      errors: result.error.errors,
    });
    return;
  }
  req.query = result.data as unknown as typeof req.query;
  next();
}

export function validateRecentFilesQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = recentFilesQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters',
      errors: result.error.errors,
    });
    return;
  }
  req.query = result.data as unknown as typeof req.query;
  next();
}

export function validatePendingMeetAndGreetsQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = pendingMeetAndGreetsQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters',
      errors: result.error.errors,
    });
    return;
  }
  req.query = result.data as unknown as typeof req.query;
  next();
}

// ===========================================
// TYPE EXPORTS
// ===========================================

export type ActivityFeedQuery = z.infer<typeof activityFeedQuerySchema>;
export type RecentFilesQuery = z.infer<typeof recentFilesQuerySchema>;
export type PendingMeetAndGreetsQuery = z.infer<typeof pendingMeetAndGreetsQuerySchema>;
