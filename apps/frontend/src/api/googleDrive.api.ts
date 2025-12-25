// ===========================================
// Google Drive API Functions
// ===========================================
// API calls for Google Drive integration endpoints
// OAuth, folder mapping, file operations, sync control

import { apiClient } from '../services/api';
import { FileVisibility } from './resources.api';

// ===========================================
// ENUMS & TYPES
// ===========================================

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';

export type UploadSource = 'GOOGLE_DRIVE' | 'PORTAL';

export type { FileVisibility };

// ===========================================
// AUTH TYPES
// ===========================================

export interface GoogleDriveAuthStatus {
  isConnected: boolean;
}

export interface AuthUrlResponse {
  authUrl: string;
}

// ===========================================
// FOLDER TYPES
// ===========================================

/** Google Drive folder from browsing */
export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  webViewLink: string;
}

/** Folder mapping linking Drive folder to lesson or student */
export interface GoogleDriveFolderMapping {
  id: string;
  driveFolderId: string;
  folderName: string;
  folderUrl: string;
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
  lesson?: {
    id: string;
    name: string;
    teacher?: {
      user: { id: string; firstName: string; lastName: string };
    };
  } | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    ageGroup: string;
  } | null;
  _count?: {
    files: number;
  };
}

export interface LinkFolderInput {
  driveFolderId: string;
  folderName: string;
  folderUrl: string;
  lessonId?: string;
  studentId?: string;
}

export interface BrowseFoldersQuery {
  parentId?: string;
  query?: string;
}

// ===========================================
// FILE TYPES
// ===========================================

/** Google Drive file synced to portal */
export interface GoogleDriveFile {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  webViewLink: string;
  thumbnailLink: string | null;
  visibility: FileVisibility;
  tags: string[];
  uploadedVia: UploadSource;
  deletedInDrive: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  folder?: {
    id: string;
    folderName: string;
    syncStatus: SyncStatus;
    lesson?: {
      id: string;
      name: string;
    } | null;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
}

export interface FilesQuery {
  lessonId?: string;
  studentId?: string;
  visibility?: FileVisibility;
  tags?: string[];
  includeDeleted?: boolean;
}

export interface UpdateFileInput {
  visibility?: FileVisibility;
  tags?: string[];
}

export interface UploadFileInput {
  file: File;
  lessonId?: string;
  studentId?: string;
  visibility?: FileVisibility;
  tags?: string[];
}

// ===========================================
// SYNC TYPES
// ===========================================

export interface SyncStatusFolder {
  id: string;
  folderName: string;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  syncError: string | null;
  filesAdded: number;
  filesUpdated: number;
  filesDeleted: number;
}

export interface SyncStatusResponse {
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  inProgress: boolean;
  folders: SyncStatusFolder[];
}

export interface TriggerSyncInput {
  folderId?: string;
}

export interface TriggerSyncResponse {
  jobId: string;
}

export interface JobStatus {
  id: string;
  state: 'active' | 'completed' | 'failed' | 'waiting' | 'delayed';
  progress: number;
  data?: Record<string, unknown>;
  returnvalue?: unknown;
  failedReason?: string;
}

// ===========================================
// STATS TYPES
// ===========================================

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byMimeType: Record<string, number>;
  byVisibility: Record<FileVisibility, number>;
}

// ===========================================
// API RESPONSE WRAPPERS
// ===========================================

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// ===========================================
// GOOGLE DRIVE API
// ===========================================

export const googleDriveApi = {
  // ===========================================
  // OAUTH AUTHENTICATION
  // ===========================================

  /**
   * Get OAuth authorization URL to connect Google Drive
   * Admin only
   */
  getAuthUrl: (): Promise<AuthUrlResponse> =>
    apiClient
      .get<ApiResponse<AuthUrlResponse>>('/google-drive/auth/url')
      .then((res) => res.data),

  /**
   * Check if Google Drive is connected for the school
   * Admin only
   */
  getAuthStatus: (): Promise<GoogleDriveAuthStatus> =>
    apiClient
      .get<ApiResponse<GoogleDriveAuthStatus>>('/google-drive/auth/status')
      .then((res) => res.data),

  /**
   * Revoke Google Drive access for the school
   * Admin only
   */
  revokeAccess: (): Promise<void> =>
    apiClient.post('/google-drive/auth/revoke').then(() => undefined),

  // ===========================================
  // FOLDER MANAGEMENT
  // ===========================================

  /**
   * Browse Google Drive folders
   * Admin only
   */
  browseFolders: (params?: BrowseFoldersQuery): Promise<DriveFolder[]> =>
    apiClient
      .get<ApiResponse<{ folders: DriveFolder[] }>>('/google-drive/folders', {
        params,
      })
      .then((res) => res.data.folders),

  /**
   * Get all folder mappings for the school
   * Admin only
   */
  getMappings: (): Promise<GoogleDriveFolderMapping[]> =>
    apiClient
      .get<ApiResponse<{ mappings: GoogleDriveFolderMapping[]; total: number }>>(
        '/google-drive/folders/mappings'
      )
      .then((res) => res.data.mappings),

  /**
   * Link a Google Drive folder to a lesson or student
   * Admin only
   */
  linkFolder: (input: LinkFolderInput): Promise<GoogleDriveFolderMapping> =>
    apiClient
      .post<ApiResponse<GoogleDriveFolderMapping & { syncJobId: string }>>(
        '/google-drive/folders/link',
        input
      )
      .then((res) => res.data),

  /**
   * Update folder sync settings
   * Admin only
   */
  updateFolderSettings: (
    folderId: string,
    syncEnabled: boolean
  ): Promise<GoogleDriveFolderMapping> =>
    apiClient
      .patch<ApiResponse<GoogleDriveFolderMapping>>(
        `/google-drive/folders/${folderId}`,
        { syncEnabled }
      )
      .then((res) => res.data),

  /**
   * Unlink a Google Drive folder
   * Admin only
   */
  unlinkFolder: (folderId: string): Promise<void> =>
    apiClient
      .delete(`/google-drive/folders/${folderId}`)
      .then(() => undefined),

  /**
   * Reset sync status for a folder (useful for retry after errors)
   * Admin only
   */
  resetFolderSync: (folderId: string): Promise<GoogleDriveFolderMapping> =>
    apiClient
      .post<ApiResponse<GoogleDriveFolderMapping>>(
        `/google-drive/folders/${folderId}/reset-sync`
      )
      .then((res) => res.data),

  // ===========================================
  // FILE MANAGEMENT
  // ===========================================

  /**
   * Get files from synced folders
   * Filtered by user role and visibility
   * All authenticated users (parent or above)
   */
  getFiles: (filters?: FilesQuery): Promise<GoogleDriveFile[]> =>
    apiClient
      .get<ApiResponse<{ files: GoogleDriveFile[]; total: number }>>(
        '/google-drive/files',
        {
          params: {
            ...filters,
            tags: filters?.tags?.join(','),
          },
        }
      )
      .then((res) => res.data.files),

  /**
   * Get a single file by ID
   * Filtered by user role and visibility
   */
  getFileById: (fileId: string): Promise<GoogleDriveFile> =>
    apiClient
      .get<ApiResponse<GoogleDriveFile>>(`/google-drive/files/${fileId}`)
      .then((res) => res.data),

  /**
   * Upload a file via portal (syncs to Google Drive)
   * Teacher or Admin only
   */
  uploadFile: (input: UploadFileInput): Promise<GoogleDriveFile> => {
    const formData = new FormData();
    formData.append('file', input.file);

    if (input.lessonId) {
      formData.append('lessonId', input.lessonId);
    }

    if (input.studentId) {
      formData.append('studentId', input.studentId);
    }

    if (input.visibility) {
      formData.append('visibility', input.visibility);
    }

    if (input.tags && input.tags.length > 0) {
      formData.append('tags', JSON.stringify(input.tags));
    }

    return apiClient
      .post<ApiResponse<GoogleDriveFile>>('/google-drive/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data);
  },

  /**
   * Update file metadata (visibility, tags)
   * Teacher (own uploads) or Admin
   */
  updateFile: (fileId: string, data: UpdateFileInput): Promise<GoogleDriveFile> =>
    apiClient
      .patch<ApiResponse<GoogleDriveFile>>(`/google-drive/files/${fileId}`, data)
      .then((res) => res.data),

  /**
   * Delete a file
   * Teacher (own uploads) or Admin
   */
  deleteFile: (fileId: string): Promise<void> =>
    apiClient
      .delete(`/google-drive/files/${fileId}`)
      .then(() => undefined),

  // ===========================================
  // SYNC MANAGEMENT
  // ===========================================

  /**
   * Get sync status for the school
   * Admin only
   */
  getSyncStatus: (): Promise<SyncStatusResponse> =>
    apiClient
      .get<ApiResponse<SyncStatusResponse>>('/google-drive/sync/status')
      .then((res) => res.data),

  /**
   * Trigger manual sync for all folders or specific folder
   * Admin only
   */
  triggerSync: (input?: TriggerSyncInput): Promise<TriggerSyncResponse> =>
    apiClient
      .post<ApiResponse<TriggerSyncResponse>>('/google-drive/sync/trigger', input || {})
      .then((res) => res.data),

  /**
   * Get status of a sync job
   * Admin only
   */
  getJobStatus: (jobId: string): Promise<JobStatus> =>
    apiClient
      .get<ApiResponse<JobStatus>>(`/google-drive/sync/job/${jobId}`)
      .then((res) => res.data),

  // ===========================================
  // STORAGE STATISTICS
  // ===========================================

  /**
   * Get storage statistics for the school
   * Admin only
   */
  getStats: (): Promise<StorageStats> =>
    apiClient
      .get<ApiResponse<StorageStats>>('/google-drive/stats')
      .then((res) => res.data),
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get sync status color for chip/badge
 */
export const getSyncStatusColor = (
  status: SyncStatus
): 'default' | 'primary' | 'success' | 'error' => {
  switch (status) {
    case 'SYNCED':
      return 'success';
    case 'SYNCING':
      return 'primary';
    case 'ERROR':
      return 'error';
    case 'PENDING':
    default:
      return 'default';
  }
};

/**
 * Get sync status label for display
 */
export const getSyncStatusLabel = (status: SyncStatus): string => {
  switch (status) {
    case 'SYNCED':
      return 'Synced';
    case 'SYNCING':
      return 'Syncing...';
    case 'ERROR':
      return 'Error';
    case 'PENDING':
      return 'Pending';
    default:
      return status;
  }
};

/**
 * Get upload source label for display
 */
export const getUploadSourceLabel = (source: UploadSource): string => {
  switch (source) {
    case 'GOOGLE_DRIVE':
      return 'Google Drive';
    case 'PORTAL':
      return 'Portal Upload';
    default:
      return source;
  }
};

/**
 * Format timestamp for display
 */
export const formatSyncTime = (timestamp: string | null): string => {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

/**
 * Check if folder has sync error
 */
export const hasSyncError = (folder: GoogleDriveFolderMapping): boolean => {
  return folder.syncStatus === 'ERROR' && !!folder.syncError;
};

/**
 * Get file icon name based on mime type (for MUI icons)
 */
export const getFileIconName = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('audio/')) return 'AudioFile';
  if (mimeType.startsWith('video/')) return 'VideoFile';
  if (mimeType === 'application/pdf') return 'PictureAsPdf';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel')
  ) {
    return 'TableChart';
  }
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint')
  ) {
    return 'Slideshow';
  }
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType === 'text/plain'
  ) {
    return 'Description';
  }
  return 'InsertDriveFile';
};

/**
 * Get Google Drive folder icon URL
 */
export const getDriveFolderIconUrl = (): string => {
  return 'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.folder';
};
