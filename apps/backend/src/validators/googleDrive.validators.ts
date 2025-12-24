// ===========================================
// Google Drive Validation Schemas
// ===========================================
// Validates Google Drive API endpoints
// OAuth, folder mapping, file operations, sync control

import { z } from 'zod';
import { validate } from '../middleware/validate';

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

// ===========================================
// AUTH SCHEMAS
// ===========================================

/**
 * OAuth callback query parameters
 */
export const authCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code required'),
  state: z.string().min(1, 'State parameter required'),
  error: z.string().optional(), // Google may return error instead of code
  error_description: z.string().optional(),
});

// ===========================================
// FOLDER SCHEMAS
// ===========================================

/**
 * Browse folders query parameters
 */
export const browseFoldersQuerySchema = z.object({
  parentId: z.string().optional(),
  query: z.string().max(200, 'Search query cannot exceed 200 characters').optional(),
});

/**
 * Link folder to lesson or student
 */
export const linkFolderSchema = z.object({
  driveFolderId: z.string().min(1, 'Drive folder ID required'),
  folderName: z.string().min(1, 'Folder name required').max(500, 'Folder name cannot exceed 500 characters'),
  folderUrl: z.string().url('Invalid folder URL'),
  lessonId: uuidSchema.optional(),
  studentId: uuidSchema.optional(),
}).refine(
  (data) => (data.lessonId && !data.studentId) || (!data.lessonId && data.studentId),
  { message: 'Must provide either lessonId or studentId, but not both' }
);

/**
 * Folder ID parameter
 */
export const folderIdParamSchema = z.object({
  folderId: uuidSchema,
});

/**
 * Update folder sync settings
 */
export const updateFolderSettingsSchema = z.object({
  syncEnabled: z.boolean(),
});

// ===========================================
// FILE SCHEMAS
// ===========================================

/**
 * Query files with filters
 */
export const filesQuerySchema = z.object({
  lessonId: uuidSchema.optional(),
  studentId: uuidSchema.optional(),
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
  includeDeleted: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional().default(false)
  ),
});

/**
 * Update file metadata
 */
export const updateFileSchema = z.object({
  visibility: fileVisibilitySchema.optional(),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).max(10, 'Maximum 10 tags allowed').optional(),
});

/**
 * File ID parameter
 */
export const fileIdParamSchema = z.object({
  fileId: uuidSchema,
});

/**
 * Upload file body (form data)
 * Note: Actual file is handled by multer, this validates metadata
 */
export const uploadFileMetadataSchema = z.object({
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
    z.array(z.string().max(50)).max(10).optional().default([])
  ),
}).refine(
  (data) => data.lessonId || data.studentId,
  { message: 'Must provide either lessonId or studentId to upload file' }
);

// ===========================================
// SYNC SCHEMAS
// ===========================================

/**
 * Trigger sync request body
 */
export const triggerSyncSchema = z.object({
  folderId: uuidSchema.optional(), // If provided, sync specific folder; otherwise sync all
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type AuthCallbackInput = z.infer<typeof authCallbackSchema>;
export type BrowseFoldersQuery = z.infer<typeof browseFoldersQuerySchema>;
export type LinkFolderInput = z.infer<typeof linkFolderSchema>;
export type UpdateFolderSettingsInput = z.infer<typeof updateFolderSettingsSchema>;
export type FilesQuery = z.infer<typeof filesQuerySchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type UploadFileMetadata = z.infer<typeof uploadFileMetadataSchema>;
export type TriggerSyncInput = z.infer<typeof triggerSyncSchema>;

// ===========================================
// VALIDATOR MIDDLEWARE
// ===========================================

export const validateAuthCallback = validate(authCallbackSchema, 'query');
export const validateBrowseFoldersQuery = validate(browseFoldersQuerySchema, 'query');
export const validateLinkFolder = validate(linkFolderSchema);
export const validateFolderIdParam = validate(folderIdParamSchema, 'params');
export const validateUpdateFolderSettings = validate(updateFolderSettingsSchema);
export const validateFilesQuery = validate(filesQuerySchema, 'query');
export const validateUpdateFile = validate(updateFileSchema);
export const validateFileIdParam = validate(fileIdParamSchema, 'params');
export const validateUploadFileMetadata = validate(uploadFileMetadataSchema);
export const validateTriggerSync = validate(triggerSyncSchema);
