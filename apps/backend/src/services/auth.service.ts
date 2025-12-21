// ===========================================
// Authentication Service
// ===========================================

import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  hashPassword,
  comparePassword,
  validatePassword,
} from '../utils/password';
import {
  generateTokenPair,
  getRefreshTokenExpiry,
} from '../utils/jwt';
import {
  LoginPayload,
  LoginResponse,
  AuthUser,
} from '../types';
import {
  recordLoginAttempt,
  clearLoginAttempts,
} from '../middleware/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

// ===========================================
// LOGIN
// ===========================================

/**
 * Authenticate user and generate tokens
 * SECURITY: Always requires schoolSlug to prevent cross-school authentication
 */
export async function login(
  payload: LoginPayload,
  ipAddress: string
): Promise<LoginResponse> {
  const { email, password, schoolSlug } = payload;

  // SECURITY: schoolSlug is required to prevent cross-school authentication
  // If email exists in multiple schools, user must specify which school
  if (!schoolSlug) {
    // Check if email exists in multiple schools
    const userCount = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });

    if (userCount === 0) {
      // Don't reveal that user doesn't exist
      await recordLoginAttempt(ipAddress, null, false);
      throw new AppError('Invalid email or password.', 401);
    } else if (userCount === 1) {
      // Only one school - find and use it
      const singleUser = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
        select: { school: { select: { slug: true } } },
      });
      // Re-call with the found school slug
      return login({ ...payload, schoolSlug: singleUser!.school.slug }, ipAddress);
    } else {
      // Multiple schools - require disambiguation
      throw new AppError(
        'This email is registered with multiple schools. Please specify the school.',
        400
      );
    }
  }

  // Find school first to ensure it exists
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug.toLowerCase() },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  });

  if (!school) {
    await recordLoginAttempt(ipAddress, null, false);
    throw new AppError('Invalid email or password.', 401);
  }

  // SECURITY: Use composite key to ensure we only find user in specified school
  const user = await prisma.user.findUnique({
    where: {
      schoolId_email: {
        schoolId: school.id,
        email: email.toLowerCase(),
      },
    },
  });

  // User not found
  if (!user) {
    await recordLoginAttempt(ipAddress, null, false);
    throw new AppError('Invalid email or password.', 401);
  }

  // Check if school is active (school was already fetched above)
  if (!school.isActive) {
    await recordLoginAttempt(ipAddress, user.id, false);
    throw new AppError('This school account is not active.', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    await recordLoginAttempt(ipAddress, user.id, false);
    throw new AppError('Your account is deactivated. Contact support.', 401);
  }

  // Check if user is pending deletion
  if (user.deletionStatus !== 'ACTIVE') {
    await recordLoginAttempt(ipAddress, user.id, false);
    throw new AppError('Your account is pending deletion.', 401);
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    await recordLoginAttempt(ipAddress, user.id, false);
    throw new AppError('Invalid email or password.', 401);
  }

  // Clear failed login attempts
  await clearLoginAttempts(ipAddress);

  // Record successful login
  await recordLoginAttempt(ipAddress, user.id, true);

  // Generate tokens
  const refreshTokenId = uuidv4();
  const tokens = generateTokenPair(
    {
      userId: user.id,
      schoolId: user.schoolId,
      role: user.role,
      email: user.email,
    },
    refreshTokenId
  );

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Build response
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: school.name,
  };

  return {
    ...tokens,
    user: authUser,
  };
}

// ===========================================
// LOGOUT
// ===========================================

/**
 * Revoke refresh token (logout)
 */
export async function logout(
  userId: string,
  refreshToken?: string
): Promise<void> {
  if (refreshToken) {
    // Revoke specific token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  } else {
    // Revoke all tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}

/**
 * Revoke all refresh tokens for a user (e.g., password change)
 */
export async function revokeAllTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// ===========================================
// GET USER
// ===========================================

/**
 * Get authenticated user data
 */
export async function getAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school.name,
  };
}

// ===========================================
// ADMIN USER CREATION
// ===========================================

/**
 * Create a user manually (admin function)
 * Used for initial setup and testing
 */
export async function createUser(data: {
  schoolId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}): Promise<AuthUser> {
  const { schoolId, email, password, firstName, lastName, role, phone } = data;

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new AppError('School not found.', 404);
  }

  // Check if email already exists in this school
  const existingUser = await prisma.user.findUnique({
    where: {
      schoolId_email: {
        schoolId,
        email: email.toLowerCase(),
      },
    },
  });

  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409);
  }

  // Validate password
  const passwordValidation = await validatePassword(password, {
    personalInfo: [firstName, lastName, email.split('@')[0]],
  });

  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(' '), 400);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      schoolId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      phone,
      emailVerified: true, // Admin-created users are pre-verified
      passwordHistory: JSON.stringify([passwordHash]),
    },
    include: {
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school.name,
  };
}

// ===========================================
// SCHOOL CREATION (for initial setup)
// ===========================================

/**
 * Create a new school (system admin function)
 */
export async function createSchool(data: {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  timezone?: string;
}): Promise<{ id: string; name: string; slug: string }> {
  // Check if slug already exists
  const existingSchool = await prisma.school.findUnique({
    where: { slug: data.slug },
  });

  if (existingSchool) {
    throw new AppError('A school with this slug already exists.', 409);
  }

  const school = await prisma.school.create({
    data: {
      name: data.name,
      slug: data.slug.toLowerCase(),
      email: data.email,
      phone: data.phone,
      website: data.website,
      timezone: data.timezone || 'Australia/Sydney',
    },
  });

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
  };
}
