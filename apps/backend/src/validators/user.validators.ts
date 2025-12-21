// ===========================================
// User Management Validation Schemas
// ===========================================
// Validates teacher, parent, student, family endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// COMMON SCHEMAS
// ===========================================

// Australian phone number validation (flexible format)
const phoneSchema = z.string()
  .regex(
    /^(\+61|0)[2-9]\d{8}$|^(\+61|0)4\d{8}$|^\+?[\d\s-]{8,20}$/,
    'Invalid phone number'
  )
  .optional()
  .or(z.literal(''));

// UUID validation
const uuidSchema = z.string().uuid('Invalid ID format');

// ===========================================
// TEACHER SCHEMAS
// ===========================================

export const createTeacherSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  password: z.string().min(8).max(128).optional(),
  bio: z.string().max(500).optional(),
  instrumentIds: z.array(uuidSchema).optional(),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema,
  bio: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const assignInstrumentSchema = z.object({
  instrumentId: uuidSchema,
  isPrimary: z.boolean().default(false),
});

// ===========================================
// PARENT SCHEMAS
// ===========================================

export const createParentSchema = z.object({
  // User account
  email: z.string().email('Invalid email').max(255),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  password: z.string().min(8).max(128).optional(),

  // Contact 1 (Primary) - REQUIRED
  contact1Name: z.string().min(1, 'Primary contact name is required').max(100),
  contact1Email: z.string().email('Invalid primary contact email').max(255),
  contact1Phone: z.string().min(1, 'Primary contact phone is required').max(20),
  contact1Relationship: z.string().min(1).max(50).default('Parent'),

  // Contact 2 - OPTIONAL
  contact2Name: z.string().max(100).optional().or(z.literal('')),
  contact2Email: z.string().email().max(255).optional().or(z.literal('')),
  contact2Phone: z.string().max(20).optional().or(z.literal('')),
  contact2Relationship: z.string().max(50).optional().or(z.literal('')),

  // Emergency Contact - REQUIRED
  emergencyName: z.string().min(1, 'Emergency contact name is required').max(100),
  emergencyPhone: z.string().min(1, 'Emergency contact phone is required').max(20),
  emergencyRelationship: z.string().min(1, 'Emergency contact relationship is required').max(50),

  // Family
  familyId: uuidSchema.optional(),
  familyName: z.string().max(100).optional(),
  isPrimary: z.boolean().default(true),
});

export const updateParentSchema = z.object({
  // User fields
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema,

  // Contact 1 (Primary)
  contact1Name: z.string().min(1).max(100).optional(),
  contact1Email: z.string().email().max(255).optional(),
  contact1Phone: z.string().min(1).max(20).optional(),
  contact1Relationship: z.string().min(1).max(50).optional(),

  // Contact 2
  contact2Name: z.string().max(100).optional().nullable(),
  contact2Email: z.string().email().max(255).optional().nullable(),
  contact2Phone: z.string().max(20).optional().nullable(),
  contact2Relationship: z.string().max(50).optional().nullable(),

  // Emergency Contact
  emergencyName: z.string().min(1).max(100).optional(),
  emergencyPhone: z.string().min(1).max(20).optional(),
  emergencyRelationship: z.string().min(1).max(50).optional(),

  // Status
  isPrimary: z.boolean().optional(),
});

// ===========================================
// STUDENT SCHEMAS
// ===========================================

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  birthDate: z.string().transform((val) => new Date(val)),
  familyId: uuidSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  birthDate: z.string().transform((val) => new Date(val)).optional(),
  familyId: uuidSchema.optional().nullable(),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const studentFiltersSchema = z.object({
  familyId: uuidSchema.optional(),
  ageGroup: z.enum(['PRESCHOOL', 'KIDS', 'TEENS', 'ADULT']).optional(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
});

// ===========================================
// FAMILY SCHEMAS
// ===========================================

export const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required').max(100),
  primaryParentId: uuidSchema.optional(),
});

export const updateFamilySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  primaryParentId: uuidSchema.optional(),
});

export const addStudentToFamilySchema = z.object({
  studentId: uuidSchema,
});

export const addParentToFamilySchema = z.object({
  parentId: uuidSchema,
  isPrimary: z.boolean().default(false),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type AssignInstrumentInput = z.infer<typeof assignInstrumentSchema>;
export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentFiltersInput = z.infer<typeof studentFiltersSchema>;
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
export type AddStudentToFamilyInput = z.infer<typeof addStudentToFamilySchema>;
export type AddParentToFamilyInput = z.infer<typeof addParentToFamilySchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateCreateTeacher = validate(createTeacherSchema);
export const validateUpdateTeacher = validate(updateTeacherSchema);
export const validateAssignInstrument = validate(assignInstrumentSchema);
export const validateCreateParent = validate(createParentSchema);
export const validateUpdateParent = validate(updateParentSchema);
export const validateCreateStudent = validate(createStudentSchema);
export const validateUpdateStudent = validate(updateStudentSchema);
export const validateStudentFilters = validate(studentFiltersSchema, 'query');
export const validateCreateFamily = validate(createFamilySchema);
export const validateUpdateFamily = validate(updateFamilySchema);
export const validateAddStudentToFamily = validate(addStudentToFamilySchema);
export const validateAddParentToFamily = validate(addParentToFamilySchema);
