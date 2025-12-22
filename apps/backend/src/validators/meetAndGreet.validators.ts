// ===========================================
// Meet & Greet Validation Schemas
// ===========================================
// Validates meet & greet booking and management endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// PHONE VALIDATION
// ===========================================

// Australian phone number regex
// Accepts: +61xxxxxxxxx, 0xxxxxxxxx (9 digits after prefix)
const australianPhoneRegex = /^(\+61|0)[2-478]\d{8}$/;

// More flexible phone validation for international
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .max(20)
  .refine(
    (val) => {
      // Remove spaces and dashes for validation
      const cleaned = val.replace(/[\s-]/g, '');
      return australianPhoneRegex.test(cleaned) || /^\+?[\d]{10,15}$/.test(cleaned);
    },
    { message: 'Invalid phone number format' }
  );

// ===========================================
// CREATE MEET & GREET (Public)
// ===========================================

export const createMeetAndGreetSchema = z.object({
  schoolId: z.string().uuid('Invalid school ID'),

  // Student info
  studentFirstName: z
    .string()
    .min(1, 'Student first name is required')
    .max(50, 'Name too long'),
  studentLastName: z
    .string()
    .min(1, 'Student last name is required')
    .max(50, 'Name too long'),
  studentAge: z
    .number()
    .int('Age must be a whole number')
    .min(3, 'Minimum age is 3')
    .max(99, 'Maximum age is 99'),

  // Contact 1 (Primary) - REQUIRED
  contact1Name: z
    .string()
    .min(1, 'Primary contact name is required')
    .max(100),
  contact1Email: z.string().email('Invalid email address'),
  contact1Phone: phoneSchema,
  contact1Relationship: z
    .string()
    .min(1, 'Relationship is required')
    .max(50),

  // Contact 2 - OPTIONAL
  contact2Name: z.string().max(100).optional().nullable(),
  contact2Email: z.string().email().optional().nullable().or(z.literal('')),
  contact2Phone: z.string().max(20).optional().nullable().or(z.literal('')),
  contact2Relationship: z.string().max(50).optional().nullable(),

  // Emergency Contact - REQUIRED
  emergencyName: z
    .string()
    .min(1, 'Emergency contact name is required')
    .max(100),
  emergencyPhone: phoneSchema,
  emergencyRelationship: z
    .string()
    .min(1, 'Emergency contact relationship is required')
    .max(50),

  // Preferences
  instrumentId: z.string().uuid().optional().nullable(),
  preferredDateTime: z.string().datetime().optional().nullable(),
  additionalNotes: z.string().max(500).optional().nullable(),
});

// ===========================================
// UPDATE MEET & GREET (Admin)
// ===========================================

export const updateMeetAndGreetSchema = z.object({
  status: z
    .enum([
      'PENDING_VERIFICATION',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'CONVERTED',
      'CANCELLED',
    ])
    .optional(),
  assignedTeacherId: z.string().uuid().optional().nullable(),
  scheduledDateTime: z.string().datetime().optional().nullable(),
  followUpNotes: z.string().max(1000).optional().nullable(),
});

// ===========================================
// REJECT MEET & GREET (Admin)
// ===========================================

export const rejectMeetAndGreetSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(500, 'Reason is too long'),
});

// ===========================================
// EXPORTS
// ===========================================

// Validation middleware
export const validateCreateMeetAndGreet = validate(createMeetAndGreetSchema);
export const validateUpdateMeetAndGreet = validate(updateMeetAndGreetSchema);
export const validateRejectMeetAndGreet = validate(rejectMeetAndGreetSchema);

// Type exports
export type CreateMeetAndGreetInput = z.infer<typeof createMeetAndGreetSchema>;
export type UpdateMeetAndGreetInput = z.infer<typeof updateMeetAndGreetSchema>;
export type RejectMeetAndGreetInput = z.infer<typeof rejectMeetAndGreetSchema>;
