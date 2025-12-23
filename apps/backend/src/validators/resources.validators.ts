// ===========================================
// Resources Validation Schemas
// ===========================================
// Validates resource upload and management endpoints

import { z } from 'zod';
import { validate } from '../middleware/validate';
import { config } from '../config';

// ===========================================
// COMMON SCHEMAS
// ===========================================

// UUID validation
const uuidSchema = z.string().uuid('Invalid ID format');

// File visibility enum (matches Prisma)
const fileVisibilitySchema = z.enum([
  'ALL',
  'TEACHERS_AND_PARENTS',
  'TEACHERS_ONLY',
]);

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  // Video
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/quicktime',
];

// Max file size from config (default 25MB)
const MAX_FILE_SIZE = config.upload.maxFileSize;

// ===========================================
// UPLOAD RESOURCE SCHEMA
// ===========================================

export const uploadResourceMetadataSchema = z.object({
  lessonId: uuidSchema.optional(),
  studentId: uuidSchema.optional(),
  visibility: fileVisibilitySchema.optional().default('ALL'),
  tags: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }
      return val;
    },
    z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).max(10, 'Maximum 10 tags allowed').optional().default([])
  ),
});

// ===========================================
// UPDATE RESOURCE SCHEMA
// ===========================================

export const updateResourceSchema = z.object({
  visibility: fileVisibilitySchema.optional(),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).max(10, 'Maximum 10 tags allowed').optional(),
});

// ===========================================
// FILTER SCHEMAS
// ===========================================

export const resourcesByLessonFilterSchema = z.object({
  visibility: fileVisibilitySchema.optional(),
  tags: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map((t) => t.trim()).filter(Boolean);
      }
      return val;
    },
    z.array(z.string()).optional()
  ),
});

export const resourcesByStudentFilterSchema = z.object({
  lessonId: uuidSchema.optional(),
  visibility: fileVisibilitySchema.optional(),
  tags: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map((t) => t.trim()).filter(Boolean);
      }
      return val;
    },
    z.array(z.string()).optional()
  ),
});

// ===========================================
// PARAM SCHEMAS
// ===========================================

export const resourceIdParamSchema = z.object({
  id: uuidSchema,
});

export const lessonIdParamSchema = z.object({
  lessonId: uuidSchema,
});

export const studentIdParamSchema = z.object({
  studentId: uuidSchema,
});

// ===========================================
// FILE VALIDATION HELPERS
// ===========================================

export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function getFileTypeCategory(mimeType: string): 'document' | 'image' | 'audio' | 'video' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.') ||
    mimeType === 'text/plain'
  ) return 'document';
  return 'unknown';
}

// ===========================================
// TYPE EXPORTS
// ===========================================

export type UploadResourceMetadata = z.infer<typeof uploadResourceMetadataSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourcesByLessonFilter = z.infer<typeof resourcesByLessonFilterSchema>;
export type ResourcesByStudentFilter = z.infer<typeof resourcesByStudentFilterSchema>;

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE };

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateUploadResourceMetadata = validate(uploadResourceMetadataSchema);
export const validateUpdateResource = validate(updateResourceSchema);
export const validateResourcesByLessonFilter = validate(resourcesByLessonFilterSchema, 'query');
export const validateResourcesByStudentFilter = validate(resourcesByStudentFilterSchema, 'query');
export const validateResourceIdParam = validate(resourceIdParamSchema, 'params');
export const validateLessonIdParam = validate(lessonIdParamSchema, 'params');
export const validateStudentIdParam = validate(studentIdParamSchema, 'params');
