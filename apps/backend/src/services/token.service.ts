// ===========================================
// Token Service
// ===========================================

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  verifyRefreshToken,
  generateTokenPair,
  getRefreshTokenExpiry,
} from '../utils/jwt';
import { AuthTokens, JWTPayload } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ===========================================
// REFRESH TOKEN
// ===========================================

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthTokens> {
  // Verify the refresh token
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error instanceof Error && error.message === 'jwt expired') {
      throw new AppError('Refresh token expired. Please log in again.', 401);
    }
    throw new AppError('Invalid refresh token.', 401);
  }

  // Find the refresh token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: {
      user: {
        select: {
          id: true,
          schoolId: true,
          role: true,
          email: true,
          isActive: true,
          deletionStatus: true,
        },
      },
    },
  });

  // Token not found (revoked)
  if (!storedToken) {
    throw new AppError('Token has been revoked.', 401);
  }

  // Token doesn't match
  if (storedToken.token !== refreshToken) {
    throw new AppError('Invalid refresh token.', 401);
  }

  // Token expired
  if (storedToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AppError('Refresh token expired.', 401);
  }

  // User validation
  const user = storedToken.user;

  if (!user.isActive) {
    throw new AppError('Account is deactivated.', 401);
  }

  if (user.deletionStatus !== 'ACTIVE') {
    throw new AppError('Account is pending deletion.', 401);
  }

  // Delete old refresh token (token rotation)
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  // Generate new token pair
  const newRefreshTokenId = uuidv4();
  const jwtPayload: JWTPayload = {
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    email: user.email,
  };

  const tokens = generateTokenPair(jwtPayload, newRefreshTokenId);

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      id: newRefreshTokenId,
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return tokens;
}

// ===========================================
// TOKEN CLEANUP
// ===========================================

/**
 * Remove expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}

/**
 * Count active sessions for a user
 */
export async function getActiveSessionCount(userId: string): Promise<number> {
  return prisma.refreshToken.count({
    where: {
      userId,
      expiresAt: { gte: new Date() },
    },
  });
}

/**
 * Get all active sessions for a user
 */
export async function getActiveSessions(
  userId: string
): Promise<{ id: string; createdAt: Date; expiresAt: Date }[]> {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      expiresAt: { gte: new Date() },
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
  userId: string,
  tokenId: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      id: tokenId,
      userId,
    },
  });
}

/**
 * Revoke all sessions except current
 */
export async function revokeOtherSessions(
  userId: string,
  currentTokenId: string
): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      userId,
      id: { not: currentTokenId },
    },
  });

  return result.count;
}
