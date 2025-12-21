// ===========================================
// Password Service
// ===========================================

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  hashPassword,
  comparePassword,
  validatePassword,
} from '../utils/password';
import { revokeAllTokens } from './auth.service';

// Maximum password history to keep
const PASSWORD_HISTORY_LIMIT = 5;

// ===========================================
// CHANGE PASSWORD
// ===========================================

/**
 * Change password for authenticated user
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get user with password history
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      passwordHistory: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Verify current password
  const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect.', 401);
  }

  // Check if new password is same as current
  const isSameAsCurrent = await comparePassword(newPassword, user.passwordHash);
  if (isSameAsCurrent) {
    throw new AppError('New password must be different from current password.', 400);
  }

  // Parse password history
  let passwordHistory: string[] = [];
  try {
    passwordHistory = JSON.parse(user.passwordHistory as string) || [];
  } catch {
    passwordHistory = [];
  }

  // Validate new password
  const validation = await validatePassword(newPassword, {
    personalInfo: [
      user.firstName,
      user.lastName,
      user.email.split('@')[0],
    ],
    passwordHistory,
    checkHIBPBreaches: true,
  });

  if (!validation.isValid) {
    throw new AppError(validation.errors.join(' '), 400);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password history (add current to history, limit to 5)
  const updatedHistory = [user.passwordHash, ...passwordHistory].slice(
    0,
    PASSWORD_HISTORY_LIMIT
  );

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      passwordHistory: JSON.stringify(updatedHistory),
      lastPasswordChange: new Date(),
    },
  });

  // Revoke all refresh tokens (force re-login on all devices)
  await revokeAllTokens(userId);
}

// ===========================================
// ADMIN PASSWORD RESET
// ===========================================

/**
 * Admin resets user's password
 * User will be required to change it on next login
 * SECURITY: Uses schoolId filter in query to prevent TOCTOU vulnerabilities
 */
export async function adminResetPassword(
  adminUserId: string,
  adminSchoolId: string,
  targetUserId: string,
  newPassword: string
): Promise<void> {
  // Verify admin user belongs to the claimed school
  const admin = await prisma.user.findFirst({
    where: {
      id: adminUserId,
      schoolId: adminSchoolId,
      role: 'ADMIN',
    },
    select: { id: true },
  });

  if (!admin) {
    throw new AppError('Only admins can reset passwords.', 403);
  }

  // SECURITY: Filter by schoolId in the query itself (not post-check)
  // This prevents TOCTOU race conditions
  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      schoolId: adminSchoolId, // Must be in same school as admin
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!targetUser) {
    // Generic error - don't reveal if user exists in another school
    throw new AppError('User not found.', 404);
  }

  // Validate new password
  const validation = await validatePassword(newPassword, {
    personalInfo: [
      targetUser.firstName,
      targetUser.lastName,
      targetUser.email.split('@')[0],
    ],
    checkHIBPBreaches: true,
  });

  if (!validation.isValid) {
    throw new AppError(validation.errors.join(' '), 400);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user (reset history since admin is setting new password)
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      passwordHash,
      passwordHistory: JSON.stringify([passwordHash]),
      lastPasswordChange: new Date(),
    },
  });

  // Revoke all refresh tokens
  await revokeAllTokens(targetUserId);
}

// ===========================================
// PASSWORD VALIDATION CHECK
// ===========================================

/**
 * Check password strength (for frontend validation)
 */
export async function checkPasswordStrength(
  password: string,
  personalInfo?: string[]
): Promise<{
  isValid: boolean;
  strength: string;
  score: number;
  errors: string[];
  warnings: string[];
}> {
  const result = await validatePassword(password, {
    personalInfo,
    checkHIBPBreaches: true,
  });

  return {
    isValid: result.isValid,
    strength: result.strength,
    score: result.score,
    errors: result.errors,
    warnings: result.warnings,
  };
}

// ===========================================
// PASSWORD EXPIRY CHECK
// ===========================================

/**
 * Check if password should be changed (e.g., after 90 days)
 */
export async function shouldChangePassword(
  userId: string,
  maxAgeDays = 90
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastPasswordChange: true },
  });

  if (!user) {
    return false;
  }

  if (!user.lastPasswordChange) {
    // No record of password change, recommend change
    return true;
  }

  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const passwordAge = Date.now() - user.lastPasswordChange.getTime();

  return passwordAge > maxAgeMs;
}
