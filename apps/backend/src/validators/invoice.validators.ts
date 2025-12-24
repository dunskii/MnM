// ===========================================
// Invoice Validation Schemas
// ===========================================
// Validates invoice CRUD and payment endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// COMMON SCHEMAS
// ===========================================

const uuidSchema = z.string().uuid('Invalid ID format');

// ===========================================
// INVOICE ITEM SCHEMA
// ===========================================

const invoiceItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description too long'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
  unitPrice: z
    .number()
    .min(0, 'Unit price cannot be negative')
    .max(10000, 'Unit price cannot exceed $10,000'),
  pricingPackageId: uuidSchema.optional(),
});

// ===========================================
// CREATE INVOICE SCHEMA
// ===========================================

export const createInvoiceSchema = z.object({
  familyId: uuidSchema,
  termId: uuidSchema.optional(),
  description: z.string().max(500, 'Description too long').optional(),
  dueDate: z.union([z.string().datetime(), z.date()]),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one line item is required'),
});

// ===========================================
// UPDATE INVOICE SCHEMA
// ===========================================

export const updateInvoiceSchema = z.object({
  description: z.string().max(500, 'Description too long').nullish(),
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one line item is required')
    .optional(),
});

// ===========================================
// INVOICE FILTERS SCHEMA
// ===========================================

export const invoiceFiltersSchema = z.object({
  familyId: uuidSchema.optional(),
  termId: uuidSchema.optional(),
  status: z
    .enum([
      'DRAFT',
      'SENT',
      'PAID',
      'PARTIALLY_PAID',
      'OVERDUE',
      'CANCELLED',
      'REFUNDED',
    ])
    .optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
});

// ===========================================
// RECORD PAYMENT SCHEMA
// ===========================================

export const recordPaymentSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(100000, 'Amount cannot exceed $100,000'),
  method: z.enum(['STRIPE', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER'], {
    errorMap: () => ({
      message: 'Invalid payment method',
    }),
  }),
  reference: z.string().max(100, 'Reference too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// ===========================================
// STRIPE CHECKOUT SCHEMA
// ===========================================

export const createStripeCheckoutSchema = z.object({
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

// ===========================================
// GENERATE TERM INVOICE SCHEMA
// ===========================================

export const generateTermInvoiceSchema = z.object({
  termId: uuidSchema,
  familyIds: z.array(uuidSchema).optional(),
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  groupRate: z.number().positive().max(1000).optional(),
  individualRate: z.number().positive().max(1000).optional(),
  standardLessonRate: z.number().positive().max(1000).optional(),
});

// ===========================================
// CANCEL INVOICE SCHEMA
// ===========================================

export const cancelInvoiceSchema = z.object({
  reason: z.string().max(500, 'Reason too long').optional(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type GenerateTermInvoiceInput = z.infer<typeof generateTermInvoiceSchema>;
export type CreateStripeCheckoutInput = z.infer<typeof createStripeCheckoutSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateCreateInvoice = validate(createInvoiceSchema);
export const validateUpdateInvoice = validate(updateInvoiceSchema);
export const validateInvoiceFilters = validate(invoiceFiltersSchema, 'query');
export const validateRecordPayment = validate(recordPaymentSchema);
export const validateGenerateTermInvoice = validate(generateTermInvoiceSchema);
export const validateStripeCheckout = validate(createStripeCheckoutSchema);
export const validateCancelInvoice = validate(cancelInvoiceSchema);
