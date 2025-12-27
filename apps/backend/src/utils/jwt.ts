// ===========================================
// JWT Utility Functions
// ===========================================

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  JWTPayload,
  AuthTokens,
} from '../types';

// ===========================================
// TOKEN GENERATION
// ===========================================

/**
 * Generate an access token for authenticated user
 * SECURITY: Includes JTI for revocation tracking
 */
export function signAccessToken(payload: JWTPayload): string {
  const jti = uuidv4(); // JWT ID for revocation tracking

  const tokenPayload: AccessTokenPayload = {
    ...payload,
    type: 'access',
    jti,
  };

  // Convert expiry string to seconds
  const expiresInSeconds = parseExpiryToSeconds(config.jwt.accessExpiresIn);

  const options: SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: 'HS256',
  };

  return jwt.sign(tokenPayload, config.jwt.secret, options);
}

/**
 * Generate a refresh token
 */
export function signRefreshToken(userId: string, tokenId: string): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  // Convert expiry string to seconds
  const expiresInSeconds = parseExpiryToSeconds(config.jwt.refreshExpiresIn);

  const options: SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  payload: JWTPayload,
  refreshTokenId: string
): AuthTokens {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload.userId, refreshTokenId);

  // Calculate expiry in seconds
  const expiresIn = parseExpiryToSeconds(config.jwt.accessExpiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

// ===========================================
// TOKEN VERIFICATION
// ===========================================

/**
 * Verify an access token and return payload
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;

  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

/**
 * Verify a refresh token and return payload
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.jwt.secret) as RefreshTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

// ===========================================
// TOKEN DECODING (without verification)
// ===========================================

/**
 * Decode a token without verification (useful for expired tokens)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload | null;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Parse expiry string to seconds (e.g., "15m" -> 900)
 */
export function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);

  if (!match) {
    // Default to 15 minutes if invalid format
    return 900;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  const seconds = parseExpiryToSeconds(config.jwt.refreshExpiresIn);
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.exp) {
    return true;
  }

  return decoded.exp * 1000 < Date.now();
}
