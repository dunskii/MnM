// ===========================================
// Resources Service
// ===========================================
// Manages file uploads and resource management
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy
// Local file storage (Google Drive sync deferred to Week 8-9)

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  Resource,
  FileVisibility,
  Lesson,
  Student,
  UserRole,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  validateFileType,
  validateFileSize,
  getFileTypeCategory,
} from '../validators/resources.validators';

// ===========================================
// TYPES
// ===========================================

export interface ResourceWithRelations extends Resource {
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lesson?: Lesson & {
    teacher: {
      user: { id: string; firstName: string; lastName: string };
    };
    room: {
      name: string;
      location: { name: string };
    };
  } | null;
  student?: Student | null;
}

export interface UploadResourceInput {
  lessonId?: string;
  studentId?: string;
  visibility?: FileVisibility;
  tags?: string[];
}

export interface UpdateResourceInput {
  visibility?: FileVisibility;
  tags?: string[];
}

export interface ResourcesByLessonFilter {
  visibility?: FileVisibility;
  tags?: string[];
}

export interface ResourcesByStudentFilter {
  lessonId?: string;
  visibility?: FileVisibility;
  tags?: string[];
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// ===========================================
// INCLUDE DEFINITIONS
// ===========================================

const resourceInclude = {
  uploadedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  lesson: {
    include: {
      teacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      room: {
        include: {
          location: { select: { name: true } },
        },
      },
    },
  },
  student: true,
} as const;

// ===========================================
// CONFIGURATION
// ===========================================

// Base upload directory (relative to project root)
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
function ensureUploadDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Generate unique file path for storage
 */
function generateFilePath(
  schoolId: string,
  lessonId: string | undefined,
  studentId: string | undefined,
  originalName: string
): string {
  const ext = path.extname(originalName);
  const uniqueId = uuidv4();
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  let subDir = schoolId;
  if (lessonId) {
    subDir = path.join(subDir, 'lessons', lessonId);
  } else if (studentId) {
    subDir = path.join(subDir, 'students', studentId);
  } else {
    subDir = path.join(subDir, 'general');
  }

  return path.join(subDir, `${uniqueId}-${sanitizedName}${ext ? '' : ''}`);
}

/**
 * Verify lesson belongs to school
 */
async function verifyLessonAccess(schoolId: string, lessonId: string): Promise<Lesson> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      room: {
        location: { schoolId },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  return lesson;
}

/**
 * Verify student belongs to school
 */
async function verifyStudentAccess(schoolId: string, studentId: string): Promise<Student> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw new AppError('Student not found or access denied', 404);
  }

  return student;
}

/**
 * Check if user can view resource based on visibility
 */
function canViewResource(
  resource: Resource,
  userRole: UserRole
): boolean {
  switch (resource.visibility) {
    case 'ALL':
      return true;
    case 'TEACHERS_AND_PARENTS':
      return userRole !== 'STUDENT';
    case 'TEACHERS_ONLY':
      return userRole === 'ADMIN' || userRole === 'TEACHER';
    default:
      return false;
  }
}

// ===========================================
// UPLOAD RESOURCE
// ===========================================

/**
 * Upload a new resource file
 */
export async function uploadResource(
  schoolId: string,
  uploadedById: string,
  file: UploadedFile,
  metadata: UploadResourceInput
): Promise<ResourceWithRelations> {
  const { lessonId, studentId, visibility = 'ALL', tags = [] } = metadata;

  // Validate file type
  if (!validateFileType(file.mimetype)) {
    throw new AppError(
      'Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, images, audio, and video files.',
      400
    );
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    throw new AppError('File size exceeds maximum allowed (25MB)', 400);
  }

  // Verify access to lesson and/or student
  if (lessonId) {
    await verifyLessonAccess(schoolId, lessonId);
  }

  if (studentId) {
    await verifyStudentAccess(schoolId, studentId);
  }

  // Generate file path and save file
  const relativePath = generateFilePath(schoolId, lessonId, studentId, file.originalname);
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  const dirPath = path.dirname(fullPath);

  // Ensure directory exists and save file
  ensureUploadDir(dirPath);
  fs.writeFileSync(fullPath, file.buffer);

  // Create database record
  const resource = await prisma.resource.create({
    data: {
      schoolId,
      uploadedById,
      lessonId: lessonId || null,
      studentId: studentId || null,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: relativePath,
      visibility,
      tags: JSON.stringify(tags),
      syncStatus: 'synced', // Local storage is always synced
    },
    include: resourceInclude,
  });

  return resource as ResourceWithRelations;
}

// ===========================================
// UPDATE RESOURCE
// ===========================================

/**
 * Update resource metadata
 */
export async function updateResource(
  schoolId: string,
  resourceId: string,
  input: UpdateResourceInput
): Promise<ResourceWithRelations> {
  // Verify resource exists and belongs to school
  const existing = await prisma.resource.findFirst({
    where: { id: resourceId, schoolId },
  });

  if (!existing) {
    throw new AppError('Resource not found or access denied', 404);
  }

  const resource = await prisma.resource.update({
    where: { id: resourceId },
    data: {
      ...(input.visibility && { visibility: input.visibility }),
      ...(input.tags && { tags: JSON.stringify(input.tags) }),
    },
    include: resourceInclude,
  });

  return resource as ResourceWithRelations;
}

// ===========================================
// DELETE RESOURCE
// ===========================================

/**
 * Delete a resource and its file
 */
export async function deleteResource(
  schoolId: string,
  resourceId: string
): Promise<void> {
  // Verify resource exists and belongs to school
  const existing = await prisma.resource.findFirst({
    where: { id: resourceId, schoolId },
  });

  if (!existing) {
    throw new AppError('Resource not found or access denied', 404);
  }

  // Delete file from storage
  const fullPath = path.join(UPLOAD_DIR, existing.filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // Delete database record
  await prisma.resource.delete({
    where: { id: resourceId },
  });
}

// ===========================================
// GET RESOURCES
// ===========================================

/**
 * Get a single resource
 */
export async function getResource(
  schoolId: string,
  resourceId: string,
  userRole: UserRole
): Promise<ResourceWithRelations | null> {
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, schoolId },
    include: resourceInclude,
  });

  if (!resource) {
    return null;
  }

  // Check visibility
  if (!canViewResource(resource, userRole)) {
    throw new AppError('Access denied', 403);
  }

  return resource as ResourceWithRelations;
}

/**
 * Get resources for a lesson
 */
export async function getResourcesByLesson(
  schoolId: string,
  lessonId: string,
  userRole: UserRole,
  filters: ResourcesByLessonFilter = {}
): Promise<ResourceWithRelations[]> {
  // Verify lesson access
  await verifyLessonAccess(schoolId, lessonId);

  const where: Record<string, unknown> = {
    schoolId,
    lessonId,
  };

  // Filter by visibility based on user role
  if (userRole === 'STUDENT') {
    where.visibility = 'ALL';
  } else if (userRole === 'PARENT') {
    where.visibility = { in: ['ALL', 'TEACHERS_AND_PARENTS'] };
  } else if (filters.visibility) {
    where.visibility = filters.visibility;
  }

  const resources = await prisma.resource.findMany({
    where,
    include: resourceInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Filter by tags if specified
  let result = resources as ResourceWithRelations[];
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((r) => {
      const resourceTags = JSON.parse(r.tags as string) as string[];
      return filters.tags!.some((t) => resourceTags.includes(t));
    });
  }

  return result;
}

/**
 * Get resources for a student
 */
export async function getResourcesByStudent(
  schoolId: string,
  studentId: string,
  userRole: UserRole,
  filters: ResourcesByStudentFilter = {}
): Promise<ResourceWithRelations[]> {
  // Verify student access
  await verifyStudentAccess(schoolId, studentId);

  const where: Record<string, unknown> = {
    schoolId,
    studentId,
  };

  if (filters.lessonId) {
    where.lessonId = filters.lessonId;
  }

  // Filter by visibility based on user role
  if (userRole === 'STUDENT') {
    where.visibility = 'ALL';
  } else if (userRole === 'PARENT') {
    where.visibility = { in: ['ALL', 'TEACHERS_AND_PARENTS'] };
  } else if (filters.visibility) {
    where.visibility = filters.visibility;
  }

  const resources = await prisma.resource.findMany({
    where,
    include: resourceInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Filter by tags if specified
  let result = resources as ResourceWithRelations[];
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((r) => {
      const resourceTags = JSON.parse(r.tags as string) as string[];
      return filters.tags!.some((t) => resourceTags.includes(t));
    });
  }

  return result;
}

// ===========================================
// DOWNLOAD RESOURCE
// ===========================================

/**
 * Get file stream for download
 */
export async function downloadResource(
  schoolId: string,
  resourceId: string,
  userRole: UserRole
): Promise<{
  stream: fs.ReadStream;
  fileName: string;
  mimeType: string;
  size: number;
}> {
  // Get resource and verify access
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, schoolId },
  });

  if (!resource) {
    throw new AppError('Resource not found or access denied', 404);
  }

  // Check visibility
  if (!canViewResource(resource, userRole)) {
    throw new AppError('Access denied', 403);
  }

  // Get file path
  const fullPath = path.join(UPLOAD_DIR, resource.filePath);

  if (!fs.existsSync(fullPath)) {
    throw new AppError('File not found', 404);
  }

  const stream = fs.createReadStream(fullPath);

  return {
    stream,
    fileName: resource.fileName,
    mimeType: resource.fileType,
    size: resource.fileSize,
  };
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get resource statistics for a school
 */
export async function getResourceStats(schoolId: string): Promise<{
  totalResources: number;
  totalSize: number;
  byType: Record<string, number>;
}> {
  const resources = await prisma.resource.findMany({
    where: { schoolId },
    select: { fileSize: true, fileType: true },
  });

  const byType: Record<string, number> = {};

  resources.forEach((r) => {
    const category = getFileTypeCategory(r.fileType);
    byType[category] = (byType[category] || 0) + 1;
  });

  return {
    totalResources: resources.length,
    totalSize: resources.reduce((sum, r) => sum + r.fileSize, 0),
    byType,
  };
}
