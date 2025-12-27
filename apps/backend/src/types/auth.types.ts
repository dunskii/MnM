// ===========================================
// Authentication Type Definitions
// ===========================================

import { UserRole } from '@prisma/client';

// ===========================================
// JWT PAYLOADS
// ===========================================

export interface JWTPayload {
  userId: string;
  schoolId: string;
  role: UserRole;
  email: string;
}

export interface AccessTokenPayload extends JWTPayload {
  type: 'access';
  jti: string; // JWT ID for revocation tracking
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

// ===========================================
// REQUEST PAYLOADS
// ===========================================

export interface LoginPayload {
  email: string;
  password: string;
  schoolSlug?: string; // Optional if user only belongs to one school
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ===========================================
// RESPONSE PAYLOADS
// ===========================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId: string;
  schoolName: string;
}

// ===========================================
// PASSWORD VALIDATION
// ===========================================

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very_strong';

export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  maxLength: number;
}

export interface HIBPCheckResult {
  breached: boolean;
  count: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

// ===========================================
// RATE LIMITING
// ===========================================

export interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
  blocked: boolean;
  cooldownEndsAt?: Date;
}

// ===========================================
// EXPRESS REQUEST AUGMENTATION
// ===========================================

export interface AuthenticatedUser {
  userId: string;
  id: string; // Alias for userId (for convenience)
  schoolId: string;
  role: UserRole;
  email: string;
  teacherId?: string; // Set if user is a teacher
  parentId?: string;  // Set if user is a parent
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
