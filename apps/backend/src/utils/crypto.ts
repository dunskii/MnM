// ===========================================
// Crypto Utilities
// ===========================================
// Secure token generation for email verification, password reset, etc.

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param bytes Number of random bytes (default 32 = 64 hex chars)
 * @returns Hex-encoded random string
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token for secure storage
 * Use when you want to store the hash but verify against the original
 * @param token The token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compare a token against its hash
 * @param token The original token
 * @param hash The stored hash
 * @returns True if the token matches the hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}

