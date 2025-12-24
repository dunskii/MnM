// ===========================================
// Google Drive Service
// ===========================================
// Handles OAuth 2.0 authentication and Drive API operations
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { google, drive_v3 } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { encrypt, decrypt } from '../utils/crypto';
import {
  checkRateLimit,
  getFromCache,
  setInCache,
  getFolderCacheKey,
  getFileCacheKey,
  invalidateSchoolCache,
  invalidateFolderCache,
} from '../utils/driveRateLimiter';
import { GoogleDriveAuth, GoogleDriveFolder } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  webViewLink: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  webViewLink: string;
  webContentLink: string | null;
  thumbnailLink: string | null;
  modifiedTime: string;
  createdTime: string;
}

export interface LinkFolderInput {
  driveFolderId: string;
  folderName: string;
  folderUrl: string;
  lessonId?: string;
  studentId?: string;
}

export interface FolderMappingWithDetails extends GoogleDriveFolder {
  lesson?: { id: string; name: string } | null;
  student?: { id: string; firstName: string; lastName: string } | null;
  _count: { files: number };
}

// ===========================================
// OAUTH CLIENT FACTORY
// ===========================================

/**
 * Create OAuth2 client
 */
function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    config.googleDrive.clientId,
    config.googleDrive.clientSecret,
    config.googleDrive.redirectUri
  );
}

/**
 * Get OAuth2 client with tokens for a school
 * Handles automatic token refresh
 */
export async function getAuthenticatedClient(schoolId: string): Promise<OAuth2Client> {
  // Get stored tokens - CRITICAL: Filter by schoolId
  const auth = await prisma.googleDriveAuth.findUnique({
    where: { schoolId },
  });

  if (!auth) {
    throw new AppError('Google Drive not connected. Please authorize access.', 401);
  }

  const client = createOAuthClient();

  // Decrypt tokens
  const credentials: Credentials = {
    access_token: decrypt(auth.accessToken),
    refresh_token: decrypt(auth.refreshToken),
    expiry_date: auth.expiresAt.getTime(),
    token_type: auth.tokenType,
    scope: auth.scope,
  };

  client.setCredentials(credentials);

  // Check if token needs refresh (with 5-minute buffer)
  const bufferMs = 5 * 60 * 1000;
  if (auth.expiresAt.getTime() < Date.now() + bufferMs) {
    try {
      const { credentials: newCredentials } = await client.refreshAccessToken();

      // Store refreshed tokens
      await prisma.googleDriveAuth.update({
        where: { schoolId },
        data: {
          accessToken: encrypt(newCredentials.access_token!),
          expiresAt: new Date(newCredentials.expiry_date!),
        },
      });

      client.setCredentials(newCredentials);
    } catch (error) {
      // Token refresh failed - user needs to re-authorize
      console.error('Token refresh failed:', error);
      throw new AppError('Google Drive authorization expired. Please re-authorize.', 401);
    }
  }

  return client;
}

/**
 * Get Drive API client for a school
 */
export async function getDriveClient(schoolId: string): Promise<drive_v3.Drive> {
  const auth = await getAuthenticatedClient(schoolId);
  return google.drive({ version: 'v3', auth });
}

// ===========================================
// OAUTH FLOW
// ===========================================

/**
 * Generate OAuth authorization URL
 * @param state State parameter for CSRF protection (should include schoolId)
 */
export function getAuthUrl(state: string): string {
  const client = createOAuthClient();

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [...config.googleDrive.scopes], // Spread to create mutable array
    state,
    prompt: 'consent', // Force consent to always get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 * @param schoolId School ID to associate tokens with
 * @param code Authorization code from OAuth callback
 */
export async function exchangeCodeForTokens(
  schoolId: string,
  code: string
): Promise<GoogleDriveAuth> {
  const client = createOAuthClient();

  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new AppError('Failed to get access tokens from Google', 400);
  }

  // Store encrypted tokens (upsert in case of re-authorization)
  const scopeString = tokens.scope || [...config.googleDrive.scopes].join(' ');
  const auth = await prisma.googleDriveAuth.upsert({
    where: { schoolId },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      scope: scopeString,
      tokenType: tokens.token_type || 'Bearer',
    },
    create: {
      schoolId,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      scope: scopeString,
      tokenType: tokens.token_type || 'Bearer',
    },
  });

  return auth;
}

/**
 * Revoke Google Drive access for a school
 * Deletes tokens and optionally revokes with Google
 */
export async function revokeAccess(schoolId: string): Promise<void> {
  const auth = await prisma.googleDriveAuth.findUnique({
    where: { schoolId },
  });

  if (!auth) {
    throw new AppError('Google Drive not connected', 404);
  }

  // Try to revoke credentials with Google (best effort)
  try {
    const client = createOAuthClient();
    client.setCredentials({
      access_token: decrypt(auth.accessToken),
    });
    await client.revokeCredentials();
  } catch (error) {
    // Continue with deletion even if revoke fails
    console.error('Failed to revoke Google credentials:', error);
  }

  // Delete auth record
  await prisma.googleDriveAuth.delete({
    where: { schoolId },
  });
}

/**
 * Check if school has Google Drive connected
 */
export async function isConnected(schoolId: string): Promise<boolean> {
  const auth = await prisma.googleDriveAuth.findUnique({
    where: { schoolId },
    select: { id: true },
  });
  return !!auth;
}

// ===========================================
// FOLDER OPERATIONS
// ===========================================

/**
 * Browse folders in Google Drive
 * @param schoolId School ID for authentication
 * @param parentId Optional parent folder ID to browse into
 * @param query Optional search query
 */
export async function browseFolders(
  schoolId: string,
  parentId?: string,
  query?: string
): Promise<DriveFolder[]> {
  // Check cache first (5-minute TTL)
  const cacheKey = getFolderCacheKey(schoolId, parentId, query);
  const cached = getFromCache<DriveFolder[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);

  let q = "mimeType='application/vnd.google-apps.folder' and trashed=false";

  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    // Show root folders (or "My Drive" root)
    q += " and 'root' in parents";
  }

  if (query) {
    // Escape single quotes in query
    const escapedQuery = query.replace(/'/g, "\\'");
    q += ` and name contains '${escapedQuery}'`;
  }

  const response = await drive.files.list({
    q,
    fields: 'files(id, name, parents, webViewLink)',
    pageSize: 100,
    orderBy: 'name',
  });

  const folders = (response.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    parentId: f.parents?.[0] || null,
    webViewLink: f.webViewLink || '',
  }));

  // Cache the results
  setInCache(cacheKey, folders);

  return folders;
}

/**
 * Get folder details from Google Drive
 */
export async function getFolderDetails(
  schoolId: string,
  folderId: string
): Promise<DriveFolder> {
  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);

  const response = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, parents, webViewLink',
  });

  return {
    id: response.data.id!,
    name: response.data.name!,
    parentId: response.data.parents?.[0] || null,
    webViewLink: response.data.webViewLink || '',
  };
}

/**
 * Link a Google Drive folder to a lesson or student
 * CRITICAL: Validates that lesson/student belongs to the school
 */
export async function linkFolder(
  schoolId: string,
  input: LinkFolderInput
): Promise<GoogleDriveFolder> {
  // Validate that exactly one of lessonId or studentId is provided
  if ((!input.lessonId && !input.studentId) || (input.lessonId && input.studentId)) {
    throw new AppError('Must provide either lessonId or studentId, but not both', 400);
  }

  // Verify lesson/student belongs to school - CRITICAL multi-tenancy check
  if (input.lessonId) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: input.lessonId, schoolId },
    });
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check if lesson already has a folder linked
    const existingLessonFolder = await prisma.googleDriveFolder.findUnique({
      where: { lessonId: input.lessonId },
    });
    if (existingLessonFolder) {
      throw new AppError('This lesson already has a Google Drive folder linked', 409);
    }
  }

  if (input.studentId) {
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, schoolId },
    });
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Check if student already has a folder linked
    const existingStudentFolder = await prisma.googleDriveFolder.findUnique({
      where: { studentId: input.studentId },
    });
    if (existingStudentFolder) {
      throw new AppError('This student already has a Google Drive folder linked', 409);
    }
  }

  // Check if this Drive folder is already linked to something else in this school
  const existingDriveFolder = await prisma.googleDriveFolder.findUnique({
    where: {
      schoolId_driveFolderId: {
        schoolId,
        driveFolderId: input.driveFolderId,
      },
    },
  });

  if (existingDriveFolder) {
    throw new AppError('This Google Drive folder is already linked to another lesson or student', 409);
  }

  // Create folder mapping
  const folder = await prisma.googleDriveFolder.create({
    data: {
      schoolId,
      driveFolderId: input.driveFolderId,
      folderName: input.folderName,
      folderUrl: input.folderUrl,
      lessonId: input.lessonId || null,
      studentId: input.studentId || null,
      syncStatus: 'PENDING',
    },
  });

  return folder;
}

/**
 * Unlink a Google Drive folder
 * Marks files as deleted but doesn't remove from Drive
 */
export async function unlinkFolder(
  schoolId: string,
  folderId: string
): Promise<void> {
  // CRITICAL: Verify folder belongs to school
  const folder = await prisma.googleDriveFolder.findFirst({
    where: { id: folderId, schoolId },
  });

  if (!folder) {
    throw new AppError('Folder mapping not found', 404);
  }

  // Soft delete files (mark as deleted) - keeps audit trail
  await prisma.googleDriveFile.updateMany({
    where: { driveFolderId: folderId },
    data: { deletedInDrive: true, deletedAt: new Date() },
  });

  // Delete folder mapping
  await prisma.googleDriveFolder.delete({
    where: { id: folderId },
  });

  // Invalidate caches for this school
  invalidateSchoolCache(schoolId);
}

/**
 * Get all folder mappings for a school
 */
export async function getFolderMappings(
  schoolId: string
): Promise<FolderMappingWithDetails[]> {
  const mappings = await prisma.googleDriveFolder.findMany({
    where: { schoolId },
    include: {
      lesson: { select: { id: true, name: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return mappings as FolderMappingWithDetails[];
}

/**
 * Get a single folder mapping by ID
 */
export async function getFolderById(
  schoolId: string,
  folderId: string
): Promise<GoogleDriveFolder | null> {
  return prisma.googleDriveFolder.findFirst({
    where: { id: folderId, schoolId },
  });
}

/**
 * Update folder sync settings
 */
export async function updateFolderSyncSettings(
  schoolId: string,
  folderId: string,
  syncEnabled: boolean
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
    data: { syncEnabled },
  });
}

// ===========================================
// FILE OPERATIONS
// ===========================================

/**
 * List files in a Google Drive folder
 */
export async function listDriveFiles(
  schoolId: string,
  driveFolderId: string
): Promise<DriveFile[]> {
  // Check cache first (5-minute TTL)
  const cacheKey = getFileCacheKey(schoolId, driveFolderId);
  const cached = getFromCache<DriveFile[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);

  // Escape single quotes in folder ID (though IDs shouldn't have them)
  const escapedFolderId = driveFolderId.replace(/'/g, "\\'");

  const response = await drive.files.list({
    q: `'${escapedFolderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime)',
    pageSize: 100,
    orderBy: 'modifiedTime desc',
  });

  const files = (response.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    size: f.size ? parseInt(f.size) : null,
    webViewLink: f.webViewLink || '',
    webContentLink: f.webContentLink || null,
    thumbnailLink: f.thumbnailLink || null,
    modifiedTime: f.modifiedTime!,
    createdTime: f.createdTime!,
  }));

  // Cache the results
  setInCache(cacheKey, files);

  return files;
}

/**
 * Get a single file's metadata from Google Drive
 */
export async function getDriveFileMetadata(
  schoolId: string,
  driveFileId: string
): Promise<DriveFile> {
  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);

  const response = await drive.files.get({
    fileId: driveFileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime',
  });

  return {
    id: response.data.id!,
    name: response.data.name!,
    mimeType: response.data.mimeType!,
    size: response.data.size ? parseInt(response.data.size) : null,
    webViewLink: response.data.webViewLink || '',
    webContentLink: response.data.webContentLink || null,
    thumbnailLink: response.data.thumbnailLink || null,
    modifiedTime: response.data.modifiedTime!,
    createdTime: response.data.createdTime!,
  };
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFileToDrive(
  schoolId: string,
  driveFolderId: string,
  file: {
    name: string;
    mimeType: string;
    body: NodeJS.ReadableStream | Buffer;
  }
): Promise<DriveFile> {
  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);

  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [driveFolderId],
    },
    media: {
      mimeType: file.mimeType,
      body: file.body,
    },
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime',
  });

  // Invalidate file cache for this folder since we added a new file
  invalidateFolderCache(schoolId, driveFolderId);

  return {
    id: response.data.id!,
    name: response.data.name!,
    mimeType: response.data.mimeType!,
    size: response.data.size ? parseInt(response.data.size) : null,
    webViewLink: response.data.webViewLink || '',
    webContentLink: response.data.webContentLink || null,
    thumbnailLink: response.data.thumbnailLink || null,
    modifiedTime: response.data.modifiedTime!,
    createdTime: response.data.createdTime!,
  };
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(
  schoolId: string,
  driveFileId: string
): Promise<void> {
  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);
  await drive.files.delete({ fileId: driveFileId });

  // Invalidate all caches for this school since we don't know which folder
  invalidateSchoolCache(schoolId);
}

/**
 * Download a file from Google Drive as a stream
 */
export async function downloadFileFromDrive(
  schoolId: string,
  driveFileId: string
): Promise<NodeJS.ReadableStream> {
  // Check rate limit before API call
  checkRateLimit(schoolId);

  const drive = await getDriveClient(schoolId);

  const response = await drive.files.get(
    { fileId: driveFileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return response.data as NodeJS.ReadableStream;
}
