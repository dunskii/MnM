// ===========================================
// Password Utility Functions
// ===========================================

import bcrypt from 'bcrypt';
import { config } from '../config';
import {
  PasswordValidationResult,
  PasswordRequirements,
  PasswordStrength,
} from '../types';
import { isCommonPassword } from './commonPasswords';
import { checkHIBP } from './hibp';

// ===========================================
// PASSWORD REQUIREMENTS
// ===========================================

export const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

// ===========================================
// HASHING & COMPARISON
// ===========================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptRounds);
}

/**
 * Compare a plain password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if password matches any in history
 */
export async function isPasswordInHistory(
  password: string,
  passwordHistory: string[]
): Promise<boolean> {
  for (const oldHash of passwordHistory) {
    const matches = await comparePassword(password, oldHash);
    if (matches) {
      return true;
    }
  }
  return false;
}

// ===========================================
// PASSWORD VALIDATION
// ===========================================

/**
 * Validate password against all requirements
 */
export async function validatePassword(
  password: string,
  options?: {
    checkHIBPBreaches?: boolean;
    personalInfo?: string[];
    passwordHistory?: string[];
  }
): Promise<PasswordValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    );
  } else {
    score += 15;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(
      `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`
    );
  }

  // Check uppercase
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 10;
  }

  // Check lowercase
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 10;
  }

  // Check number
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 10;
  }

  // Check special character
  if (
    PASSWORD_REQUIREMENTS.requireSpecialChar &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // Check for common passwords
  if (isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a stronger one');
    score = Math.max(0, score - 30);
  }

  // Check for personal information
  if (options?.personalInfo) {
    const lowerPassword = password.toLowerCase();
    for (const info of options.personalInfo) {
      if (info && info.length >= 3 && lowerPassword.includes(info.toLowerCase())) {
        errors.push('Password should not contain personal information');
        score = Math.max(0, score - 20);
        break;
      }
    }
  }

  // Check password history
  if (options?.passwordHistory && options.passwordHistory.length > 0) {
    const inHistory = await isPasswordInHistory(
      password,
      options.passwordHistory
    );
    if (inHistory) {
      errors.push('Cannot reuse one of your last 5 passwords');
    }
  }

  // Check HIBP breaches (optional, may be slow)
  if (options?.checkHIBPBreaches !== false) {
    try {
      const hibpResult = await checkHIBP(password);
      if (hibpResult.breached) {
        if (hibpResult.severity === 'critical') {
          errors.push(
            `This password has been exposed in ${hibpResult.count.toLocaleString()} data breaches`
          );
          score = Math.max(0, score - 40);
        } else if (hibpResult.severity === 'high') {
          warnings.push(
            `This password appeared in ${hibpResult.count.toLocaleString()} breaches`
          );
          score = Math.max(0, score - 20);
        } else {
          warnings.push(
            `This password may have been exposed in a data breach`
          );
          score = Math.max(0, score - 10);
        }
      } else {
        score += 20; // Bonus for not being breached
      }
    } catch {
      // HIBP check failed, continue without it
      warnings.push('Could not verify password against breach database');
    }
  }

  // Calculate strength
  const strength = calculateStrength(score);

  return {
    isValid: errors.length === 0,
    strength,
    score: Math.min(100, Math.max(0, score)),
    errors,
    warnings,
  };
}

/**
 * Quick password validation (no HIBP check)
 */
export function validatePasswordSync(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    );
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(
      `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`
    );
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecialChar &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  if (isCommonPassword(password)) {
    errors.push('This password is too common');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Calculate password strength from score
 */
function calculateStrength(score: number): PasswordStrength {
  if (score >= 80) return 'very_strong';
  if (score >= 60) return 'strong';
  if (score >= 40) return 'fair';
  return 'weak';
}

/**
 * Generate password requirements message
 */
export function getPasswordRequirementsMessage(): string {
  const requirements: string[] = [];

  requirements.push(
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters`
  );

  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push('One uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push('One lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber) {
    requirements.push('One number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar) {
    requirements.push('One special character');
  }

  return requirements.join(', ');
}
