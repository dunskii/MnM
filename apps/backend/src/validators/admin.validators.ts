// ===========================================
// Admin Validation Schemas
// ===========================================
// Validates admin configuration endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';

// ===========================================
// SCHOOL SETTINGS
// ===========================================

export const updateSchoolSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  branding: z.record(z.unknown()).optional(),
});

// ===========================================
// TERMS
// ===========================================

export const createTermSchema = z.object({
  name: z.string().min(1, 'Term name is required').max(50),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
}).refine(
  (data) => data.startDate < data.endDate,
  { message: 'Start date must be before end date', path: ['endDate'] }
);

export const updateTermSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// LOCATIONS
// ===========================================

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// ROOMS
// ===========================================

export const createRoomSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  name: z.string().min(1, 'Room name is required').max(50),
  capacity: z.number().int().min(1).max(100).default(10),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// INSTRUMENTS
// ===========================================

export const createInstrumentSchema = z.object({
  name: z.string().min(1, 'Instrument name is required').max(50),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateInstrumentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// LESSON TYPES
// ===========================================

export const createLessonTypeSchema = z.object({
  name: z.string().min(1, 'Lesson type name is required').max(50),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'BAND', 'HYBRID']),
  defaultDuration: z.number().int().min(15).max(180),
  description: z.string().max(255).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateLessonTypeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'BAND', 'HYBRID']).optional(),
  defaultDuration: z.number().int().min(15).max(180).optional(),
  description: z.string().max(255).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// LESSON DURATIONS
// ===========================================

export const createLessonDurationSchema = z.object({
  minutes: z.number().int().min(15, 'Minimum duration is 15 minutes').max(180, 'Maximum duration is 180 minutes'),
});

export const updateLessonDurationSchema = z.object({
  minutes: z.number().int().min(15).max(180).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type UpdateSchoolSettingsInput = z.infer<typeof updateSchoolSettingsSchema>;
export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateInstrumentInput = z.infer<typeof createInstrumentSchema>;
export type UpdateInstrumentInput = z.infer<typeof updateInstrumentSchema>;
export type CreateLessonTypeInput = z.infer<typeof createLessonTypeSchema>;
export type UpdateLessonTypeInput = z.infer<typeof updateLessonTypeSchema>;
export type CreateLessonDurationInput = z.infer<typeof createLessonDurationSchema>;
export type UpdateLessonDurationInput = z.infer<typeof updateLessonDurationSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateUpdateSchoolSettings = validate(updateSchoolSettingsSchema);
export const validateCreateTerm = validate(createTermSchema);
export const validateUpdateTerm = validate(updateTermSchema);
export const validateCreateLocation = validate(createLocationSchema);
export const validateUpdateLocation = validate(updateLocationSchema);
export const validateCreateRoom = validate(createRoomSchema);
export const validateUpdateRoom = validate(updateRoomSchema);
export const validateCreateInstrument = validate(createInstrumentSchema);
export const validateUpdateInstrument = validate(updateInstrumentSchema);
export const validateCreateLessonType = validate(createLessonTypeSchema);
export const validateUpdateLessonType = validate(updateLessonTypeSchema);
export const validateCreateLessonDuration = validate(createLessonDurationSchema);
export const validateUpdateLessonDuration = validate(updateLessonDurationSchema);
