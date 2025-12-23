// ===========================================
// Resources API Functions
// ===========================================
// API calls for file upload and resource management endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export type FileVisibility = 'ALL' | 'TEACHERS_AND_PARENTS' | 'TEACHERS_ONLY';

export interface Resource {
  id: string;
  schoolId: string;
  uploadedById: string;
  lessonId: string | null;
  studentId: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  driveFileId: string | null;
  driveFolderId: string | null;
  visibility: FileVisibility;
  syncStatus: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lesson?: {
    id: string;
    name: string;
    teacher: {
      user: { id: string; firstName: string; lastName: string };
    };
    room: {
      name: string;
      location: { name: string };
    };
  } | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    ageGroup: string;
  } | null;
}

export interface UploadResourceInput {
  file: File;
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
  tags?: string;
}

export interface ResourcesByStudentFilter {
  lessonId?: string;
  visibility?: FileVisibility;
  tags?: string;
}

export interface ResourceStats {
  totalResources: number;
  totalSize: number;
  byType: Record<string, number>;
}

// ===========================================
// RESOURCES API
// ===========================================

export const resourcesApi = {
  // ===========================================
  // UPLOAD OPERATIONS
  // ===========================================

  /**
   * Upload a new resource file
   */
  upload: (input: UploadResourceInput): Promise<Resource> => {
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
      .post<{ status: string; data: Resource }>('/resources', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data);
  },

  // ===========================================
  // UPDATE/DELETE OPERATIONS
  // ===========================================

  /**
   * Update resource metadata
   */
  update: (id: string, data: UpdateResourceInput): Promise<Resource> =>
    apiClient
      .patch<{ status: string; data: Resource }>(`/resources/${id}`, data)
      .then((res) => res.data),

  /**
   * Delete a resource
   */
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/resources/${id}`).then(() => undefined),

  // ===========================================
  // GET OPERATIONS
  // ===========================================

  /**
   * Get a single resource
   */
  getById: (id: string): Promise<Resource> =>
    apiClient
      .get<{ status: string; data: Resource }>(`/resources/${id}`)
      .then((res) => res.data),

  /**
   * Download a resource file
   */
  download: async (id: string): Promise<{ blob: Blob; fileName: string }> => {
    const response = await apiClient.getRaw<Blob>(`/resources/${id}/download`, {
      responseType: 'blob',
    });

    // Extract filename from content-disposition header if available
    const contentDisposition = response.headers?.['content-disposition'];
    let fileName = 'download';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }

    return { blob: response.data, fileName };
  },

  /**
   * Get resources for a lesson
   */
  getByLesson: (lessonId: string, filters?: ResourcesByLessonFilter): Promise<Resource[]> =>
    apiClient
      .get<{ status: string; data: Resource[] }>(`/resources/lesson/${lessonId}`, {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get resources for a student
   */
  getByStudent: (studentId: string, filters?: ResourcesByStudentFilter): Promise<Resource[]> =>
    apiClient
      .get<{ status: string; data: Resource[] }>(`/resources/student/${studentId}`, {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get resource statistics for the school (admin only)
   */
  getStats: (): Promise<ResourceStats> =>
    apiClient
      .get<{ status: string; data: ResourceStats }>('/resources/stats')
      .then((res) => res.data),
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get visibility color for chip/badge
 */
export const getVisibilityColor = (
  visibility: FileVisibility
): 'success' | 'warning' | 'error' | 'default' => {
  switch (visibility) {
    case 'ALL':
      return 'success';
    case 'TEACHERS_AND_PARENTS':
      return 'warning';
    case 'TEACHERS_ONLY':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get visibility label for display
 */
export const getVisibilityLabel = (visibility: FileVisibility): string => {
  switch (visibility) {
    case 'ALL':
      return 'Everyone';
    case 'TEACHERS_AND_PARENTS':
      return 'Teachers & Parents';
    case 'TEACHERS_ONLY':
      return 'Teachers Only';
    default:
      return visibility;
  }
};

/**
 * Get file type category from MIME type
 */
export const getFileTypeCategory = (
  mimeType: string
): 'document' | 'image' | 'audio' | 'video' | 'unknown' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.') ||
    mimeType === 'text/plain'
  ) {
    return 'document';
  }
  return 'unknown';
};

/**
 * Get file type icon name (for MUI icons)
 */
export const getFileTypeIcon = (mimeType: string): string => {
  const category = getFileTypeCategory(mimeType);
  switch (category) {
    case 'image':
      return 'Image';
    case 'audio':
      return 'AudioFile';
    case 'video':
      return 'VideoFile';
    case 'document':
      return 'Description';
    default:
      return 'InsertDriveFile';
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Parse tags from resource (stored as JSON string)
 */
export const parseTags = (resource: Resource): string[] => {
  try {
    return JSON.parse(resource.tags);
  } catch {
    return [];
  }
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (mimeType: string): boolean => {
  const allowedTypes = [
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

  return allowedTypes.includes(mimeType);
};

/**
 * Max file size in bytes (25MB)
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Check if file size is within limit
 */
export const isFileSizeAllowed = (size: number): boolean => {
  return size <= MAX_FILE_SIZE;
};

/**
 * Trigger file download in browser
 */
export const triggerDownload = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
