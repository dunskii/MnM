// ===========================================
// Crypto Utilities
// ===========================================
// Secure token generation, hashing, and encryption
// Uses AES-256-GCM for authenticated encryption

import crypto from 'crypto';
import { config } from '../config';

// ===========================================
// CONSTANTS
// ===========================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// ===========================================
// TOKEN GENERATION
// ===========================================

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

// ===========================================
// ENCRYPTION (AES-256-GCM)
// ===========================================

/**
 * Derive encryption key from environment variable
 * Uses SHA-256 to ensure consistent 32-byte key length
 * SECURITY: ENCRYPTION_KEY must be separate from JWT_SECRET
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    if (config.env === 'production') {
      throw new Error(
        'CRITICAL: ENCRYPTION_KEY must be set in production. ' +
        'Generate with: openssl rand -hex 32'
      );
    }
    // Development: still require it but give clearer error
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  if (key.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be at least 32 characters. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string using AES-256-GCM
 * @param plaintext The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param ciphertext The encrypted string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails or format is invalid
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format: expected iv:authTag:ciphertext');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

