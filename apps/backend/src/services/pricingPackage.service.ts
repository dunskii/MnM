// ===========================================
// Pricing Package Service
// ===========================================
// Manages pricing packages for invoicing
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { PricingPackage, Prisma } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface PricingPackageItem {
  type: 'lesson' | 'addon' | 'material';
  name: string;
  quantity?: number;
  lessonTypeId?: string;
  instrumentId?: string;
  price?: number;
}

export interface CreatePricingPackageInput {
  name: string;
  description?: string;
  price: number;
  items: PricingPackageItem[];
}

export interface UpdatePricingPackageInput {
  name?: string;
  description?: string | null;
  price?: number;
  items?: PricingPackageItem[];
  isActive?: boolean;
}

export interface PricingPackageWithDetails extends PricingPackage {
  _count?: {
    invoiceItems: number;
  };
}

// ===========================================
// GET PRICING PACKAGES
// ===========================================

export async function getPricingPackages(
  schoolId: string,
  includeInactive: boolean = false
): Promise<PricingPackageWithDetails[]> {
  const packages = await prisma.pricingPackage.findMany({
    where: {
      schoolId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      _count: {
        select: { invoiceItems: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return packages;
}

// ===========================================
// GET SINGLE PRICING PACKAGE
// ===========================================

export async function getPricingPackage(
  schoolId: string,
  packageId: string
): Promise<PricingPackageWithDetails | null> {
  const pricingPackage = await prisma.pricingPackage.findFirst({
    where: {
      id: packageId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: { invoiceItems: true },
      },
    },
  });

  return pricingPackage;
}

// ===========================================
// CREATE PRICING PACKAGE
// ===========================================

export async function createPricingPackage(
  schoolId: string,
  input: CreatePricingPackageInput
): Promise<PricingPackage> {
  // Validate items array
  if (!input.items || input.items.length === 0) {
    throw new AppError('At least one item is required in the package', 400);
  }

  // Check for duplicate name in school
  const existing = await prisma.pricingPackage.findFirst({
    where: {
      schoolId,
      name: input.name,
    },
  });

  if (existing) {
    throw new AppError('A pricing package with this name already exists', 409);
  }

  const pricingPackage = await prisma.pricingPackage.create({
    data: {
      schoolId,
      name: input.name,
      description: input.description,
      price: input.price,
      items: input.items as unknown as Prisma.InputJsonValue,
    },
  });

  return pricingPackage;
}

// ===========================================
// UPDATE PRICING PACKAGE
// ===========================================

export async function updatePricingPackage(
  schoolId: string,
  packageId: string,
  input: UpdatePricingPackageInput
): Promise<PricingPackage> {
  // Verify package belongs to school
  const existing = await prisma.pricingPackage.findFirst({
    where: {
      id: packageId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Pricing package not found', 404);
  }

  // Check for duplicate name if name is being changed
  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.pricingPackage.findFirst({
      where: {
        schoolId,
        name: input.name,
        id: { not: packageId },
      },
    });

    if (duplicate) {
      throw new AppError('A pricing package with this name already exists', 409);
    }
  }

  const pricingPackage = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.items !== undefined && { items: input.items as unknown as Prisma.InputJsonValue }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  return pricingPackage;
}

// ===========================================
// DELETE PRICING PACKAGE (Soft Delete)
// ===========================================

export async function deletePricingPackage(
  schoolId: string,
  packageId: string
): Promise<void> {
  // Verify package belongs to school
  const existing = await prisma.pricingPackage.findFirst({
    where: {
      id: packageId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Pricing package not found', 404);
  }

  // Soft delete by setting isActive to false
  // This preserves historical data for invoices that used this package
  await prisma.pricingPackage.update({
    where: { id: packageId },
    data: { isActive: false },
  });
}

// ===========================================
// TOGGLE PRICING PACKAGE ACTIVE STATUS
// ===========================================

export async function togglePricingPackageStatus(
  schoolId: string,
  packageId: string
): Promise<PricingPackage> {
  // Verify package belongs to school
  const existing = await prisma.pricingPackage.findFirst({
    where: {
      id: packageId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Pricing package not found', 404);
  }

  const pricingPackage = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: { isActive: !existing.isActive },
  });

  return pricingPackage;
}
