// ===========================================
// Google Drive Sync Service
// ===========================================
// Handles synchronization between Google Drive and Portal
// Drive is source of truth - sync runs every 15 minutes
// CRITICAL: All queries MUST filter by schoolId

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  GoogleDriveFolder,
  SyncStatus,
} from '@prisma/client';
import * as driveService from './googleDrive.service';

// ===========================================
// TYPES
// ===========================================

export interface SyncResult {
  folderId: string;
  folderName: string;
  success: boolean;
  filesAdded: number;
  filesUpdated: number;
  filesDeleted: number;
  error?: string;
  duration?: number;
}

export interface SyncJobResult {
  schoolId: string;
  totalFolders: number;
  syncedFolders: number;
  failedFolders: number;
  results: SyncResult[];
  startedAt: Date;
  completedAt: Date;
}

export interface SyncStatusResponse {
  isConnected: boolean;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  folders: Array<{
    id: string;
    folderName: string;
    syncStatus: SyncStatus;
    lastSyncAt: Date | null;
    fileCount: number;
    syncError?: string | null;
  }>;
}

// ===========================================
// SYNC OPERATIONS
// ===========================================

/**
 * Sync a single folder from Google Drive to Portal
 * Drive is source of truth - portal records are updated to match Drive state
 */
export async function syncFolder(folder: GoogleDriveFolder): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    folderId: folder.id,
    folderName: folder.folderName,
    success: false,
    filesAdded: 0,
    filesUpdated: 0,
    filesDeleted: 0,
  };

  try {
    // Update status to SYNCING
    await prisma.googleDriveFolder.update({
      where: { id: folder.id },
      data: { syncStatus: 'SYNCING', syncError: null },
    });

    // Get files from Google Drive
    const driveFiles = await driveService.listDriveFiles(
      folder.schoolId,
      folder.driveFolderId
    );
    const driveFileIds = new Set(driveFiles.map((f) => f.id));

    // Get existing files in portal (not marked as deleted)
    const existingFiles = await prisma.googleDriveFile.findMany({
      where: {
        driveFolderId: folder.id,
        deletedInDrive: false,
        schoolId: folder.schoolId, // CRITICAL: Multi-tenancy filter
      },
    });
    const existingFileMap = new Map(existingFiles.map((f) => [f.driveFileId, f]));

    // Process files from Drive
    for (const driveFile of driveFiles) {
      const existingFile = existingFileMap.get(driveFile.id);

      if (!existingFile) {
        // New file in Drive - create portal record
        await prisma.googleDriveFile.create({
          data: {
            schoolId: folder.schoolId,
            driveFileId: driveFile.id,
            fileName: driveFile.name,
            mimeType: driveFile.mimeType,
            fileSize: driveFile.size,
            webViewLink: driveFile.webViewLink,
            webContentLink: driveFile.webContentLink,
            thumbnailLink: driveFile.thumbnailLink,
            modifiedTime: new Date(driveFile.modifiedTime),
            createdTime: new Date(driveFile.createdTime),
            driveFolderId: folder.id,
            visibility: 'ALL', // Default visibility
            tags: [],
            uploadedVia: 'GOOGLE_DRIVE',
          },
        });
        result.filesAdded++;
      } else {
        // Existing file - check if updated in Drive
        const driveModifiedTime = new Date(driveFile.modifiedTime);
        if (driveModifiedTime > existingFile.modifiedTime) {
          // File was modified in Drive - update portal record
          await prisma.googleDriveFile.update({
            where: { id: existingFile.id },
            data: {
              fileName: driveFile.name,
              mimeType: driveFile.mimeType,
              fileSize: driveFile.size,
              webViewLink: driveFile.webViewLink,
              webContentLink: driveFile.webContentLink,
              thumbnailLink: driveFile.thumbnailLink,
              modifiedTime: driveModifiedTime,
            },
          });
          result.filesUpdated++;
        }
      }
    }

    // Process deleted files (in portal but not in Drive anymore)
    for (const existingFile of existingFiles) {
      if (!driveFileIds.has(existingFile.driveFileId)) {
        // File was deleted from Drive - soft delete in portal
        await prisma.googleDriveFile.update({
          where: { id: existingFile.id },
          data: {
            deletedInDrive: true,
            deletedAt: new Date(),
          },
        });
        result.filesDeleted++;
      }
    }

    // Restore files that were previously deleted but now exist again in Drive
    const deletedFiles = await prisma.googleDriveFile.findMany({
      where: {
        driveFolderId: folder.id,
        deletedInDrive: true,
        schoolId: folder.schoolId,
      },
    });

    for (const deletedFile of deletedFiles) {
      if (driveFileIds.has(deletedFile.driveFileId)) {
        // File exists again in Drive - restore it
        const driveFile = driveFiles.find((f) => f.id === deletedFile.driveFileId)!;
        await prisma.googleDriveFile.update({
          where: { id: deletedFile.id },
          data: {
            deletedInDrive: false,
            deletedAt: null,
            fileName: driveFile.name,
            mimeType: driveFile.mimeType,
            fileSize: driveFile.size,
            modifiedTime: new Date(driveFile.modifiedTime),
          },
        });
        result.filesAdded++; // Count as added since it's back
      }
    }

    // Update sync status to SYNCED
    await prisma.googleDriveFolder.update({
      where: { id: folder.id },
      data: {
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
        syncError: null,
      },
    });

    result.success = true;
    result.duration = Date.now() - startTime;
  } catch (error: unknown) {
    // Update status to ERROR
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
    await prisma.googleDriveFolder.update({
      where: { id: folder.id },
      data: {
        syncStatus: 'ERROR',
        syncError: errorMessage,
      },
    });

    result.error = errorMessage;
    result.duration = Date.now() - startTime;
    console.error(`Sync failed for folder ${folder.id}:`, error);
  }

  return result;
}

/**
 * Sync all enabled folders for a school
 */
export async function syncSchoolFolders(schoolId: string): Promise<SyncJobResult> {
  const startedAt = new Date();
  const results: SyncResult[] = [];

  // Get all enabled folders for school - CRITICAL: Filter by schoolId
  const folders = await prisma.googleDriveFolder.findMany({
    where: { schoolId, syncEnabled: true },
  });

  // Sync folders sequentially to avoid rate limiting
  for (const folder of folders) {
    const result = await syncFolder(folder);
    results.push(result);
  }

  const completedAt = new Date();

  return {
    schoolId,
    totalFolders: folders.length,
    syncedFolders: results.filter((r) => r.success).length,
    failedFolders: results.filter((r) => !r.success).length,
    results,
    startedAt,
    completedAt,
  };
}

/**
 * Sync all schools (for background job)
 * Iterates through all schools with Google Drive connected
 */
export async function syncAllSchools(): Promise<SyncJobResult[]> {
  // Get all schools with Google Drive connected
  const schools = await prisma.googleDriveAuth.findMany({
    select: { schoolId: true },
  });

  const results: SyncJobResult[] = [];

  for (const { schoolId } of schools) {
    try {
      const result = await syncSchoolFolders(schoolId);
      results.push(result);

      // Log if there were failures
      if (result.failedFolders > 0) {
        console.warn(
          `Sync completed with ${result.failedFolders} failures for school ${schoolId}:`,
          result.results.filter((r) => !r.success).map((r) => ({ folder: r.folderName, error: r.error }))
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to sync school ${schoolId}:`, errorMessage);
      // Create a failed result for this school
      results.push({
        schoolId,
        totalFolders: 0,
        syncedFolders: 0,
        failedFolders: 1,
        results: [],
        startedAt: new Date(),
        completedAt: new Date(),
      });
    }
  }

  return results;
}

/**
 * Get sync status for a school
 */
export async function getSyncStatus(schoolId: string): Promise<SyncStatusResponse> {
  const isConnected = await driveService.isConnected(schoolId);

  if (!isConnected) {
    return {
      isConnected: false,
      lastSyncAt: null,
      nextSyncAt: null,
      folders: [],
    };
  }

  // Get all folders with file count - CRITICAL: Filter by schoolId
  const folders = await prisma.googleDriveFolder.findMany({
    where: { schoolId },
    include: {
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Find most recent sync across all folders
  const lastSyncAt = folders.reduce((latest, f) => {
    if (!f.lastSyncAt) return latest;
    if (!latest) return f.lastSyncAt;
    return f.lastSyncAt > latest ? f.lastSyncAt : latest;
  }, null as Date | null);

  // Calculate next sync (sync interval from config)
  const syncIntervalMs = 15 * 60 * 1000; // 15 minutes default
  const nextSyncAt = lastSyncAt
    ? new Date(lastSyncAt.getTime() + syncIntervalMs)
    : new Date(); // If never synced, next sync is now

  return {
    isConnected: true,
    lastSyncAt,
    nextSyncAt,
    folders: folders.map((f) => ({
      id: f.id,
      folderName: f.folderName,
      syncStatus: f.syncStatus,
      lastSyncAt: f.lastSyncAt,
      fileCount: f._count.files,
      syncError: f.syncError,
    })),
  };
}

/**
 * Trigger manual sync for a specific folder
 */
export async function triggerFolderSync(
  schoolId: string,
  folderId: string
): Promise<SyncResult> {
  // CRITICAL: Verify folder belongs to school
  const folder = await prisma.googleDriveFolder.findFirst({
    where: { id: folderId, schoolId },
  });

  if (!folder) {
    throw new AppError('Folder mapping not found', 404);
  }

  return syncFolder(folder);
}

/**
 * Trigger manual sync for all school folders
 */
export async function triggerSchoolSync(schoolId: string): Promise<SyncJobResult> {
  // Verify school has Drive connected
  const isConnected = await driveService.isConnected(schoolId);
  if (!isConnected) {
    throw new AppError('Google Drive not connected', 400);
  }

  return syncSchoolFolders(schoolId);
}

/**
 * Get folders that need syncing (haven't been synced recently or have errors)
 */
export async function getFoldersNeedingSync(
  schoolId: string,
  staleMinutes: number = 60
): Promise<GoogleDriveFolder[]> {
  const staleThreshold = new Date(Date.now() - staleMinutes * 60 * 1000);

  return prisma.googleDriveFolder.findMany({
    where: {
      schoolId,
      syncEnabled: true,
      OR: [
        { syncStatus: 'PENDING' },
        { syncStatus: 'ERROR' },
        { lastSyncAt: null },
        { lastSyncAt: { lt: staleThreshold } },
      ],
    },
  });
}

/**
 * Reset sync status for a folder (useful for retry after errors)
 */
export async function resetFolderSyncStatus(
  schoolId: string,
  folderId: string
): Promise<GoogleDriveFolder> {
  // CRITICAL: Verify folder belongs to school
  const folder = await prisma.googleDriveFolder.findFirst({
    where: { id: folderId, schoolId },
  });

  if (!folder) {
    throw new AppError('Folder mapping not found', 404);
  }

  return prisma.googleDriveFolder.update({
    where: { id: folderId },
    data: {
      syncStatus: 'PENDING',
      syncError: null,
    },
  });
}
