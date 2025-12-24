// ===========================================
// Google Drive Routes
// ===========================================
// OAuth authentication, folder management, file operations, sync control
// CRITICAL: All operations respect multi-tenancy (schoolId filtering)

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin, parentOrAbove } from '../middleware/authorize';
import { AppError } from '../middleware/errorHandler';
import * as driveService from '../services/googleDrive.service';
import * as syncService from '../services/googleDriveSync.service';
import * as fileService from '../services/googleDriveFile.service';
import * as syncJob from '../jobs/googleDriveSync.job';
import { generateSecureToken } from '../utils/crypto';
import { config } from '../config';
import {
  validateAuthCallback,
  validateBrowseFoldersQuery,
  validateLinkFolder,
  validateFolderIdParam,
  validateUpdateFolderSettings,
  validateFilesQuery,
  validateUpdateFile,
  validateFileIdParam,
  validateUploadFileMetadata,
  validateTriggerSync,
  LinkFolderInput,
  BrowseFoldersQuery,
  UpdateFolderSettingsInput,
  FilesQuery,
  UpdateFileInput,
  UploadFileMetadata,
  TriggerSyncInput,
} from '../validators/googleDrive.validators';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.googleDrive.maxFileSizeMB * 1024 * 1024,
  },
});

// All routes require authentication
router.use(authenticate);

// ===========================================
// OAUTH AUTHENTICATION
// ===========================================

/**
 * GET /google-drive/auth/url
 * Get OAuth authorization URL for admin to authorize Google Drive access
 * Access: Admin only
 */
router.get(
  '/auth/url',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate state token for CSRF protection
      // Format: schoolId:randomToken
      const stateToken = generateSecureToken(16);
      const state = `${req.user!.schoolId}:${stateToken}`;

      // In production, store state in Redis or session for verification
      // For now, we encode schoolId in state and verify it in callback

      const authUrl = driveService.getAuthUrl(state);

      res.json({
        status: 'success',
        data: { authUrl },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /google-drive/auth/callback
 * OAuth callback endpoint - handles authorization code exchange
 * Access: Admin only (redirected from Google)
 */
router.get(
  '/auth/callback',
  adminOnly,
  validateAuthCallback,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { code, state, error, error_description } = req.query as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
      };

      // Handle OAuth error
      if (error) {
        console.error('OAuth error:', error, error_description);
        res.redirect(
          `${config.frontendUrl}/admin/google-drive?error=${encodeURIComponent(error)}`
        );
        return;
      }

      if (!code || !state) {
        res.redirect(`${config.frontendUrl}/admin/google-drive?error=missing_params`);
        return;
      }

      // Validate state parameter
      const [stateSchoolId] = state.split(':');
      if (stateSchoolId !== req.user!.schoolId) {
        res.redirect(`${config.frontendUrl}/admin/google-drive?error=invalid_state`);
        return;
      }

      // Exchange code for tokens
      await driveService.exchangeCodeForTokens(req.user!.schoolId, code);

      // Redirect to frontend success page
      res.redirect(`${config.frontendUrl}/admin/google-drive?connected=true`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}/admin/google-drive?error=auth_failed`);
    }
  }
);

/**
 * POST /google-drive/auth/revoke
 * Revoke Google Drive access
 * Access: Admin only
 */
router.post(
  '/auth/revoke',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await driveService.revokeAccess(req.user!.schoolId);

      res.json({
        status: 'success',
        message: 'Google Drive access revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /google-drive/auth/status
 * Check Google Drive connection status
 * Access: Admin only
 */
router.get(
  '/auth/status',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isConnected = await driveService.isConnected(req.user!.schoolId);

      res.json({
        status: 'success',
        data: { isConnected },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// FOLDER MANAGEMENT
// ===========================================

/**
 * GET /google-drive/folders
 * Browse Google Drive folders
 * Access: Admin only
 */
router.get(
  '/folders',
  adminOnly,
  validateBrowseFoldersQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { parentId, query } = req.query as BrowseFoldersQuery;

      const folders = await driveService.browseFolders(
        req.user!.schoolId,
        parentId,
        query
      );

      res.json({
        status: 'success',
        data: { folders },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /google-drive/folders/mappings
 * List all folder mappings for the school
 * Access: Admin only
 */
router.get(
  '/folders/mappings',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mappings = await driveService.getFolderMappings(req.user!.schoolId);

      res.json({
        status: 'success',
        data: { mappings, total: mappings.length },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /google-drive/folders/link
 * Link a Google Drive folder to a lesson or student
 * Access: Admin only
 */
router.post(
  '/folders/link',
  adminOnly,
  validateLinkFolder,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as LinkFolderInput;

      const folder = await driveService.linkFolder(req.user!.schoolId, input);

      // Queue immediate sync for new folder
      const jobId = await syncJob.queueFolderSync(req.user!.schoolId, folder.id);

      res.status(201).json({
        status: 'success',
        data: { ...folder, syncJobId: jobId },
        message: 'Folder linked successfully. Initial sync queued.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /google-drive/folders/:folderId
 * Update folder sync settings
 * Access: Admin only
 */
router.patch(
  '/folders/:folderId',
  adminOnly,
  validateFolderIdParam,
  validateUpdateFolderSettings,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { syncEnabled } = req.body as UpdateFolderSettingsInput;

      const folder = await driveService.updateFolderSyncSettings(
        req.user!.schoolId,
        req.params.folderId,
        syncEnabled
      );

      res.json({
        status: 'success',
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /google-drive/folders/:folderId
 * Unlink a Google Drive folder
 * Access: Admin only
 */
router.delete(
  '/folders/:folderId',
  adminOnly,
  validateFolderIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await driveService.unlinkFolder(req.user!.schoolId, req.params.folderId);

      res.json({
        status: 'success',
        message: 'Folder unlinked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// FILE MANAGEMENT
// ===========================================

/**
 * GET /google-drive/files
 * List files from synced folders
 * Access: All authenticated users (filtered by visibility)
 */
router.get(
  '/files',
  parentOrAbove,
  validateFilesQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as FilesQuery;

      const files = await fileService.getFiles(
        req.user!.schoolId,
        req.user!.role,
        filters
      );

      res.json({
        status: 'success',
        data: { files, total: files.length },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /google-drive/files/:fileId
 * Get a single file's details
 * Access: All authenticated users (filtered by visibility)
 */
router.get(
  '/files/:fileId',
  parentOrAbove,
  validateFileIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await fileService.getFileById(
        req.user!.schoolId,
        req.params.fileId,
        req.user!.role
      );

      if (!file) {
        throw new AppError('File not found', 404);
      }

      res.json({
        status: 'success',
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /google-drive/files/upload
 * Upload a file via portal (will be pushed to Google Drive)
 * Access: Teacher or Admin
 */
router.post(
  '/files/upload',
  teacherOrAdmin,
  upload.single('file'),
  validateUploadFileMetadata,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const metadata = req.body as UploadFileMetadata;

      const file = await fileService.uploadFile(
        req.user!.schoolId,
        req.user!.userId,
        {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        {
          lessonId: metadata.lessonId,
          studentId: metadata.studentId,
          visibility: metadata.visibility,
          tags: metadata.tags,
        }
      );

      res.status(201).json({
        status: 'success',
        data: file,
        message: 'File uploaded and synced to Google Drive',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /google-drive/files/:fileId
 * Update file metadata (visibility, tags)
 * Access: Teacher (own uploads) or Admin
 */
router.patch(
  '/files/:fileId',
  teacherOrAdmin,
  validateFileIdParam,
  validateUpdateFile,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as UpdateFileInput;

      const file = await fileService.updateFile(
        req.user!.schoolId,
        req.params.fileId,
        req.user!.userId,
        req.user!.role,
        input
      );

      res.json({
        status: 'success',
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /google-drive/files/:fileId
 * Delete a file (removes from portal and Google Drive if uploaded via portal)
 * Access: Teacher (own uploads) or Admin
 */
router.delete(
  '/files/:fileId',
  teacherOrAdmin,
  validateFileIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fileService.deleteFile(
        req.user!.schoolId,
        req.params.fileId,
        req.user!.userId,
        req.user!.role
      );

      res.json({
        status: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// SYNC MANAGEMENT
// ===========================================

/**
 * GET /google-drive/sync/status
 * Get sync status for the school
 * Access: Admin only
 */
router.get(
  '/sync/status',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await syncService.getSyncStatus(req.user!.schoolId);

      res.json({
        status: 'success',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /google-drive/sync/trigger
 * Manually trigger sync for all folders or specific folder
 * Access: Admin only
 */
router.post(
  '/sync/trigger',
  adminOnly,
  validateTriggerSync,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { folderId } = req.body as TriggerSyncInput;

      let jobId: string;

      if (folderId) {
        // Sync specific folder
        jobId = await syncJob.queueFolderSync(req.user!.schoolId, folderId);
      } else {
        // Sync all school folders
        jobId = await syncJob.queueSchoolSync(req.user!.schoolId);
      }

      res.json({
        status: 'success',
        message: 'Sync job queued successfully',
        data: { jobId },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /google-drive/sync/job/:jobId
 * Get status of a sync job
 * Access: Admin only
 */
router.get(
  '/sync/job/:jobId',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobStatus = await syncJob.getJobStatus(req.params.jobId);

      if (!jobStatus) {
        throw new AppError('Job not found', 404);
      }

      res.json({
        status: 'success',
        data: jobStatus,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /google-drive/folders/:folderId/reset-sync
 * Reset sync status for a folder (useful for retry after errors)
 * Access: Admin only
 */
router.post(
  '/folders/:folderId/reset-sync',
  adminOnly,
  validateFolderIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const folder = await syncService.resetFolderSyncStatus(
        req.user!.schoolId,
        req.params.folderId
      );

      res.json({
        status: 'success',
        data: folder,
        message: 'Folder sync status reset. You can now trigger a new sync.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// STORAGE STATISTICS
// ===========================================

/**
 * GET /google-drive/stats
 * Get storage statistics for the school
 * Access: Admin only
 */
router.get(
  '/stats',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await fileService.getStorageStats(req.user!.schoolId);

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
