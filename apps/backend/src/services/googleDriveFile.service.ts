// ===========================================
// Google Drive File Service
// ===========================================
// Handles file operations for synced Google Drive files
// Includes visibility filtering, upload, update, delete
// CRITICAL: All queries MUST filter by schoolId

import { Readable } from 'stream';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { FileVisibility, UserRole, GoogleDriveFile } from '@prisma/client';
import * as driveService from './googleDrive.service';

// ===========================================
// TYPES
// ===========================================

export interface FileFilters {
  lessonId?: string;
  studentId?: string;
  visibility?: FileVisibility;
  tags?: string[];
  includeDeleted?: boolean;
}

export interface UploadFileInput {
  lessonId?: string;
  studentId?: string;
  visibility?: FileVisibility;
  tags?: string[];
}

export interface UpdateFileInput {
  visibility?: FileVisibility;
  tags?: string[];
}

export interface FileWithDetails extends GoogleDriveFile {
  driveFolder: {
    id: string;
    folderName: string;
    lesson?: { id: string; name: string } | null;
    student?: { id: string; firstName: string; lastName: string } | null;
  };
}

// ===========================================
// FILE VISIBILITY LOGIC
// ===========================================

/**
 * Get visibility filter based on user role
 * - ADMIN/TEACHER: Can see all files
 * - PARENT: Can see ALL and TEACHERS_AND_PARENTS
 * - STUDENT: Can only see ALL
 */
function getVisibilityFilter(userRole: UserRole): FileVisibility[] | undefined {
  switch (userRole) {
    case 'ADMIN':
    case 'TEACHER':
      return undefined; // No filter - can see all
    case 'PARENT':
      return ['ALL', 'TEACHERS_AND_PARENTS'];
    case 'STUDENT':
      return ['ALL'];
    default:
      return ['ALL'];
  }
}

// ===========================================
// FILE OPERATIONS
// ===========================================

/**
 * Get files with visibility filtering
 * CRITICAL: All queries filter by schoolId
 */
export async function getFiles(
  schoolId: string,
  userRole: UserRole,
  filters: FileFilters = {}
): Promise<FileWithDetails[]> {
  const where: any = {
    schoolId, // CRITICAL: Multi-tenancy filter
    deletedInDrive: filters.includeDeleted ? undefined : false,
  };

  // Apply visibility filter based on role
  const roleVisibilities = getVisibilityFilter(userRole);
  if (roleVisibilities) {
    where.visibility = { in: roleVisibilities };
  }

  // Apply explicit visibility filter if provided (only if user has access)
  if (filters.visibility) {
    if (roleVisibilities && !roleVisibilities.includes(filters.visibility)) {
      // User doesn't have access to this visibility level
      return [];
    }
    where.visibility = filters.visibility;
  }

  // Apply lesson/student filters via folder
  if (filters.lessonId || filters.studentId) {
    where.driveFolder = {
      schoolId, // Double-check schoolId
      ...(filters.lessonId && { lessonId: filters.lessonId }),
      ...(filters.studentId && { studentId: filters.studentId }),
    };
  }

  const files = await prisma.googleDriveFile.findMany({
    where,
    include: {
      driveFolder: {
        select: {
          id: true,
          folderName: true,
          lesson: { select: { id: true, name: true } },
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { modifiedTime: 'desc' },
  });

  // Filter by tags if provided (in-memory filter since tags is JSON)
  let result = files as FileWithDetails[];
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((f) => {
      const fileTags = (f.tags as string[]) || [];
      return filters.tags!.some((t) => fileTags.includes(t));
    });
  }

  return result;
}

/**
 * Get a single file by ID
 * CRITICAL: Verifies schoolId ownership
 */
export async function getFileById(
  schoolId: string,
  fileId: string,
  userRole: UserRole
): Promise<FileWithDetails | null> {
  const file = await prisma.googleDriveFile.findFirst({
    where: {
      id: fileId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      driveFolder: {
        select: {
          id: true,
          folderName: true,
          lesson: { select: { id: true, name: true } },
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!file) return null;

  // Check visibility access
  const roleVisibilities = getVisibilityFilter(userRole);
  if (roleVisibilities && !roleVisibilities.includes(file.visibility)) {
    return null; // User doesn't have access to this file
  }

  return file as FileWithDetails;
}

/**
 * Upload a file to portal and sync to Google Drive
 * Creates both portal record and uploads to Drive
 */
export async function uploadFile(
  schoolId: string,
  uploadedBy: string,
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  },
  options: UploadFileInput
): Promise<GoogleDriveFile> {
  const { lessonId, studentId, visibility = 'ALL', tags = [] } = options;

  // Validate at least one target is provided
  if (!lessonId && !studentId) {
    throw new AppError('Must provide either lessonId or studentId', 400);
  }

  // Find linked Drive folder - CRITICAL: Filter by schoolId
  const folder = await prisma.googleDriveFolder.findFirst({
    where: {
      schoolId,
      ...(lessonId && { lessonId }),
      ...(studentId && { studentId }),
    },
  });

  if (!folder) {
    throw new AppError(
      'No Google Drive folder linked to this ' + (lessonId ? 'lesson' : 'student') +
      '. Please link a folder first.',
      400
    );
  }

  // Upload to Google Drive
  const stream = new Readable();
  stream.push(file.buffer);
  stream.push(null);

  const driveFile = await driveService.uploadFileToDrive(
    schoolId,
    folder.driveFolderId,
    {
      name: file.originalname,
      mimeType: file.mimetype,
      body: stream,
    }
  );

  // Create portal record
  const portalFile = await prisma.googleDriveFile.create({
    data: {
      schoolId,
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
      visibility,
      tags: tags,
      uploadedBy,
      uploadedVia: 'PORTAL',
    },
  });

  return portalFile;
}

/**
 * Update file metadata (visibility, tags)
 * CRITICAL: Verifies ownership and schoolId
 */
export async function updateFile(
  schoolId: string,
  fileId: string,
  userId: string,
  userRole: UserRole,
  input: UpdateFileInput
): Promise<GoogleDriveFile> {
  // Get file - CRITICAL: Filter by schoolId
  const file = await prisma.googleDriveFile.findFirst({
    where: { id: fileId, schoolId },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  // Teachers can only update files they uploaded
  if (userRole === 'TEACHER' && file.uploadedBy !== userId) {
    throw new AppError('You can only update files you uploaded', 403);
  }

  // Parents and students cannot update files
  if (userRole === 'PARENT' || userRole === 'STUDENT') {
    throw new AppError('You do not have permission to update files', 403);
  }

  const updated = await prisma.googleDriveFile.update({
    where: { id: fileId },
    data: {
      ...(input.visibility && { visibility: input.visibility }),
      ...(input.tags && { tags: input.tags }),
    },
  });

  return updated;
}

/**
 * Delete a file from portal and optionally from Google Drive
 * CRITICAL: Verifies ownership and schoolId
 */
export async function deleteFile(
  schoolId: string,
  fileId: string,
  userId: string,
  userRole: UserRole,
  deleteFromDrive: boolean = true
): Promise<void> {
  // Get file - CRITICAL: Filter by schoolId
  const file = await prisma.googleDriveFile.findFirst({
    where: { id: fileId, schoolId },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  // Teachers can only delete files they uploaded
  if (userRole === 'TEACHER' && file.uploadedBy !== userId) {
    throw new AppError('You can only delete files you uploaded', 403);
  }

  // Parents and students cannot delete files
  if (userRole === 'PARENT' || userRole === 'STUDENT') {
    throw new AppError('You do not have permission to delete files', 403);
  }

  // Delete from Google Drive if requested and file was uploaded via portal
  if (deleteFromDrive && file.uploadedVia === 'PORTAL') {
    try {
      await driveService.deleteFileFromDrive(schoolId, file.driveFileId);
    } catch (error: any) {
      // Continue if file already deleted from Drive (404)
      if (error.code !== 404 && !error.message?.includes('404')) {
        throw error;
      }
    }
  }

  // Soft delete in portal (keeps audit trail)
  await prisma.googleDriveFile.update({
    where: { id: fileId },
    data: {
      deletedInDrive: true,
      deletedAt: new Date(),
    },
  });
}

/**
 * Get files for a specific lesson
 * Convenience method with proper visibility filtering
 */
export async function getFilesForLesson(
  schoolId: string,
  lessonId: string,
  userRole: UserRole
): Promise<FileWithDetails[]> {
  // First verify the lesson belongs to this school
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, schoolId },
  });

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  return getFiles(schoolId, userRole, { lessonId });
}

/**
 * Get files for a specific student
 * Convenience method with proper visibility filtering
 */
export async function getFilesForStudent(
  schoolId: string,
  studentId: string,
  userRole: UserRole,
  userId: string
): Promise<FileWithDetails[]> {
  // First verify the student belongs to this school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      family: {
        include: {
          parents: {
            include: {
              user: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  // Parents can only see their own children's files
  if (userRole === 'PARENT') {
    const isParentOfStudent = student.family?.parents.some(
      (p) => p.user.id === userId
    );
    if (!isParentOfStudent) {
      throw new AppError('You can only view files for your own children', 403);
    }
  }

  // Students can only see their own files
  if (userRole === 'STUDENT') {
    if (student.userId !== userId) {
      throw new AppError('You can only view your own files', 403);
    }
  }

  return getFiles(schoolId, userRole, { studentId });
}

/**
 * Count files in a folder
 */
export async function countFilesInFolder(
  schoolId: string,
  folderId: string
): Promise<number> {
  return prisma.googleDriveFile.count({
    where: {
      driveFolderId: folderId,
      schoolId,
      deletedInDrive: false,
    },
  });
}

/**
 * Get storage statistics for a school
 */
export async function getStorageStats(schoolId: string): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  byVisibility: Record<FileVisibility, number>;
}> {
  const files = await prisma.googleDriveFile.findMany({
    where: { schoolId, deletedInDrive: false },
    select: { fileSize: true, visibility: true },
  });

  const byVisibility: Record<FileVisibility, number> = {
    ALL: 0,
    TEACHERS_AND_PARENTS: 0,
    TEACHERS_ONLY: 0,
  };

  let totalSizeBytes = 0;

  for (const file of files) {
    totalSizeBytes += file.fileSize || 0;
    byVisibility[file.visibility]++;
  }

  return {
    totalFiles: files.length,
    totalSizeBytes,
    byVisibility,
  };
}
