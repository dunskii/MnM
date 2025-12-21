// ===========================================
// School Service
// ===========================================
// Manages school settings and configuration

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface SchoolSettings {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  branding: Record<string, unknown>;
  isActive: boolean;
}

export interface UpdateSchoolInput {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
  branding?: Record<string, unknown>;
}

// ===========================================
// GET SCHOOL SETTINGS
// ===========================================

/**
 * Get school settings by schoolId
 * SECURITY: schoolId is required for multi-tenancy
 */
export async function getSchoolSettings(schoolId: string): Promise<SchoolSettings> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new AppError('School not found.', 404);
  }

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    email: school.email,
    phone: school.phone,
    website: school.website,
    timezone: school.timezone,
    settings: parseJsonField(school.settings),
    branding: parseJsonField(school.branding),
    isActive: school.isActive,
  };
}

// ===========================================
// UPDATE SCHOOL SETTINGS
// ===========================================

/**
 * Update school settings
 * SECURITY: schoolId is required for multi-tenancy
 */
export async function updateSchoolSettings(
  schoolId: string,
  data: UpdateSchoolInput
): Promise<SchoolSettings> {
  // First verify school exists
  const existing = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!existing) {
    throw new AppError('School not found.', 404);
  }

  // Build update data
  const updateData: Prisma.SchoolUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.settings !== undefined) updateData.settings = data.settings as Prisma.InputJsonValue;
  if (data.branding !== undefined) updateData.branding = data.branding as Prisma.InputJsonValue;

  const school = await prisma.school.update({
    where: { id: schoolId },
    data: updateData,
  });

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    email: school.email,
    phone: school.phone,
    website: school.website,
    timezone: school.timezone,
    settings: parseJsonField(school.settings),
    branding: parseJsonField(school.branding),
    isActive: school.isActive,
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function parseJsonField(field: unknown): Record<string, unknown> {
  if (typeof field === 'object' && field !== null) {
    return field as Record<string, unknown>;
  }
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return {};
    }
  }
  return {};
}
