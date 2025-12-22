// ===========================================
// Rate Limiter Middleware
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { RateLimitInfo } from '../types';
import { getClientIP } from '../utils/request';

// Rate limit configuration
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  cooldownMs: 30 * 60 * 1000, // 30 minutes after max attempts
};

/**
 * Login rate limiter middleware
 * Tracks failed login attempts by IP address
 * Blocks after 5 failures for 30 minutes
 */
export const loginRateLimiter = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = getClientIP(req);
    const windowStart = new Date(Date.now() - LOGIN_RATE_LIMIT.windowMs);

    // Get recent failed attempts for this IP
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    const failedCount = recentAttempts.length;

    // Check if in cooldown period
    if (failedCount >= LOGIN_RATE_LIMIT.maxAttempts) {
      const lastAttempt = recentAttempts[0];
      const cooldownEnd = new Date(
        lastAttempt.createdAt.getTime() + LOGIN_RATE_LIMIT.cooldownMs
      );

      if (cooldownEnd > new Date()) {
        const remainingMinutes = Math.ceil(
          (cooldownEnd.getTime() - Date.now()) / 60000
        );
        throw new AppError(
          `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
          429
        );
      }
    }

    // Attach rate limit info to request for logging
    (req as Request & { rateLimitInfo?: RateLimitInfo }).rateLimitInfo = {
      remaining: Math.max(0, LOGIN_RATE_LIMIT.maxAttempts - failedCount - 1),
      resetAt: new Date(Date.now() + LOGIN_RATE_LIMIT.windowMs),
      blocked: false,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(
  ipAddress: string,
  userId: string | null,
  success: boolean
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      ipAddress,
      userId,
      success,
    },
  });

  // Clean up old attempts (older than 24 hours)
  const cleanupDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: { lt: cleanupDate },
    },
  });
}

/**
 * Get rate limit info for an IP
 */
export async function getRateLimitInfo(
  ipAddress: string
): Promise<RateLimitInfo> {
  const windowStart = new Date(Date.now() - LOGIN_RATE_LIMIT.windowMs);

  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      ipAddress,
      success: false,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: 'desc' },
  });

  const failedCount = recentAttempts.length;
  const remaining = Math.max(0, LOGIN_RATE_LIMIT.maxAttempts - failedCount);

  let blocked = false;
  let cooldownEndsAt: Date | undefined;

  if (failedCount >= LOGIN_RATE_LIMIT.maxAttempts && recentAttempts[0]) {
    const cooldownEnd = new Date(
      recentAttempts[0].createdAt.getTime() + LOGIN_RATE_LIMIT.cooldownMs
    );
    if (cooldownEnd > new Date()) {
      blocked = true;
      cooldownEndsAt = cooldownEnd;
    }
  }

  return {
    remaining,
    resetAt: new Date(Date.now() + LOGIN_RATE_LIMIT.windowMs),
    blocked,
    cooldownEndsAt,
  };
}

/**
 * Clear login attempts for an IP (e.g., after successful login)
 */
export async function clearLoginAttempts(ipAddress: string): Promise<void> {
  // Mark recent failed attempts as "cleared" by making them older
  // Or we could delete them, but keeping for audit purposes
  await prisma.loginAttempt.updateMany({
    where: {
      ipAddress,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - LOGIN_RATE_LIMIT.windowMs),
      },
    },
    data: {
      // Move the timestamp back beyond the window
      createdAt: new Date(Date.now() - LOGIN_RATE_LIMIT.windowMs - 1000),
    },
  });
}

// ===========================================
// PAYMENT RATE LIMITER
// ===========================================
// In-memory rate limiter for payment endpoints
// Prevents abuse of checkout session creation

interface PaymentRateLimitEntry {
  count: number;
  firstRequest: number;
}

const paymentRateLimitStore = new Map<string, PaymentRateLimitEntry>();

const PAYMENT_RATE_LIMIT = {
  maxRequests: 10,       // Max requests per window
  windowMs: 60 * 1000,   // 1 minute window
};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of paymentRateLimitStore.entries()) {
    if (now - entry.firstRequest > PAYMENT_RATE_LIMIT.windowMs) {
      paymentRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Payment rate limiter middleware
 * Limits checkout session creation to prevent abuse
 */
export const paymentRateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const ipAddress = getClientIP(req);
    const now = Date.now();

    const entry = paymentRateLimitStore.get(ipAddress);

    if (!entry) {
      // First request from this IP
      paymentRateLimitStore.set(ipAddress, { count: 1, firstRequest: now });
      next();
      return;
    }

    // Check if window has expired
    if (now - entry.firstRequest > PAYMENT_RATE_LIMIT.windowMs) {
      // Reset the window
      paymentRateLimitStore.set(ipAddress, { count: 1, firstRequest: now });
      next();
      return;
    }

    // Within window, check count
    if (entry.count >= PAYMENT_RATE_LIMIT.maxRequests) {
      const remainingSeconds = Math.ceil(
        (entry.firstRequest + PAYMENT_RATE_LIMIT.windowMs - now) / 1000
      );
      throw new AppError(
        `Too many payment requests. Please try again in ${remainingSeconds} seconds.`,
        429
      );
    }

    // Increment count
    entry.count++;
    next();
  } catch (error) {
    next(error);
  }
};

// ===========================================
// PUBLIC ENDPOINT RATE LIMITER
// ===========================================
// For public endpoints like Meet & Greet booking

interface PublicRateLimitEntry {
  count: number;
  firstRequest: number;
}

const publicRateLimitStore = new Map<string, PublicRateLimitEntry>();

const PUBLIC_RATE_LIMIT = {
  maxRequests: 5,         // Max requests per window
  windowMs: 60 * 60 * 1000, // 1 hour window
};

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of publicRateLimitStore.entries()) {
    if (now - entry.firstRequest > PUBLIC_RATE_LIMIT.windowMs) {
      publicRateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Public endpoint rate limiter middleware
 * Limits public booking requests to prevent spam
 */
export const publicRateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const ipAddress = getClientIP(req);
    const now = Date.now();

    const entry = publicRateLimitStore.get(ipAddress);

    if (!entry) {
      publicRateLimitStore.set(ipAddress, { count: 1, firstRequest: now });
      next();
      return;
    }

    if (now - entry.firstRequest > PUBLIC_RATE_LIMIT.windowMs) {
      publicRateLimitStore.set(ipAddress, { count: 1, firstRequest: now });
      next();
      return;
    }

    if (entry.count >= PUBLIC_RATE_LIMIT.maxRequests) {
      throw new AppError(
        'Too many booking requests. Please try again later.',
        429
      );
    }

    entry.count++;
    next();
  } catch (error) {
    next(error);
  }
};
