// ===========================================
// Pricing Package Validation Schemas
// ===========================================
// Validates pricing package CRUD endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// COMMON SCHEMAS
// ===========================================

const uuidSchema = z.string().uuid('Invalid ID format');

// ===========================================
// PRICING PACKAGE ITEM SCHEMA
// ===========================================

const pricingPackageItemSchema = z.object({
  type: z.enum(['lesson', 'addon', 'material'], {
    errorMap: () => ({ message: 'Type must be lesson, addon, or material' }),
  }),
  name: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
  quantity: z.number().int().positive().optional(),
  lessonTypeId: uuidSchema.optional(),
  instrumentId: uuidSchema.optional(),
  price: z.number().min(0).optional(),
});

// ===========================================
// CREATE PRICING PACKAGE SCHEMA
// ===========================================

export const createPricingPackageSchema = z.object({
  name: z
    .string()
    .min(1, 'Package name is required')
    .max(100, 'Package name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price cannot exceed $10,000'),
  items: z
    .array(pricingPackageItemSchema)
    .min(1, 'At least one item is required in the package'),
});

// ===========================================
// UPDATE PRICING PACKAGE SCHEMA
// ===========================================

export const updatePricingPackageSchema = z.object({
  name: z
    .string()
    .min(1, 'Package name is required')
    .max(100, 'Package name too long')
    .optional(),
  description: z.string().max(500, 'Description too long').nullish(),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price cannot exceed $10,000')
    .optional(),
  items: z
    .array(pricingPackageItemSchema)
    .min(1, 'At least one item is required in the package')
    .optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// QUERY PARAMS SCHEMA
// ===========================================

export const getPricingPackagesQuerySchema = z.object({
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CreatePricingPackageInput = z.infer<typeof createPricingPackageSchema>;
export type UpdatePricingPackageInput = z.infer<typeof updatePricingPackageSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateCreatePricingPackage = validate(createPricingPackageSchema);
export const validateUpdatePricingPackage = validate(updatePricingPackageSchema);
export const validateGetPricingPackagesQuery = validate(getPricingPackagesQuerySchema, 'query');
