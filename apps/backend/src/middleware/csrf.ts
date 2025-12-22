// ===========================================
// CSRF Protection Middleware
// ===========================================
// Custom CSRF protection using double-submit cookie pattern
// More secure than deprecated csurf package

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './errorHandler';

// ===========================================
// CONSTANTS
// ===========================================

const CSRF_CONSTANTS = {
  TOKEN_LENGTH: 32,
  COOKIE_NAME: 'csrf-token',
  HEADER_NAME: 'x-csrf-token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

// ===========================================
// TOKEN GENERATION
// ===========================================

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_CONSTANTS.TOKEN_LENGTH).toString('hex');
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * CSRF token generation middleware
 * Sets a CSRF token cookie and attaches a method to get it
 */
export function csrfTokenGenerator(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate token if not exists in cookie
  let token = req.cookies?.[CSRF_CONSTANTS.COOKIE_NAME];

  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_CONSTANTS.COOKIE_NAME, token, CSRF_CONSTANTS.COOKIE_OPTIONS);
  }

  // Attach token getter to request for templates/responses
  (req as Request & { csrfToken: () => string }).csrfToken = () => token;

  next();
}

/**
 * CSRF validation middleware
 * Validates that the token in header matches the cookie
 *
 * Usage: Apply to state-changing endpoints (POST, PUT, PATCH, DELETE)
 *
 * Excludes:
 * - GET, HEAD, OPTIONS requests (safe methods)
 * - Stripe webhooks (verified by signature)
 * - Public endpoints that don't require auth
 */
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Skip safe HTTP methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip Stripe webhook (verified separately by signature)
  if (req.path.includes('/webhook')) {
    return next();
  }

  // Get tokens
  const cookieToken = req.cookies?.[CSRF_CONSTANTS.COOKIE_NAME];
  const headerToken = req.headers[CSRF_CONSTANTS.HEADER_NAME] as string;

  // Validate both tokens exist
  if (!cookieToken || !headerToken) {
    return next(new AppError('CSRF token missing', 403));
  }

  // Validate tokens match (using constant-time comparison)
  if (!safeCompare(cookieToken, headerToken)) {
    return next(new AppError('CSRF token mismatch', 403));
  }

  next();
}

/**
 * Get CSRF token endpoint handler
 * Used by frontend to get initial token
 */
export function getCsrfToken(req: Request, res: Response): void {
  let token = req.cookies?.[CSRF_CONSTANTS.COOKIE_NAME];

  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_CONSTANTS.COOKIE_NAME, token, CSRF_CONSTANTS.COOKIE_OPTIONS);
  }

  res.json({ csrfToken: token });
}
