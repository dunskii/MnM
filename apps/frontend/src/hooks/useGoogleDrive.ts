// ===========================================
// Google Drive React Query Hooks
// ===========================================
// Custom hooks for Google Drive API operations
// OAuth, folder management, file operations, sync control

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  googleDriveApi,
  BrowseFoldersQuery,
  FilesQuery,
  LinkFolderInput,
  UpdateFileInput,
  UploadFileInput,
  TriggerSyncInput,
} from '../api/googleDrive.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const googleDriveKeys = {
  all: ['googleDrive'] as const,
  authStatus: () => [...googleDriveKeys.all, 'authStatus'] as const,
  folders: () => [...googleDriveKeys.all, 'folders'] as const,
  browseFolders: (params?: BrowseFoldersQuery) =>
    [...googleDriveKeys.folders(), 'browse', params] as const,
  mappings: () => [...googleDriveKeys.all, 'mappings'] as const,
  files: (filters?: FilesQuery) => [...googleDriveKeys.all, 'files', filters] as const,
  fileDetail: (id: string) => [...googleDriveKeys.all, 'files', 'detail', id] as const,
  syncStatus: () => [...googleDriveKeys.all, 'syncStatus'] as const,
  jobStatus: (jobId: string) => [...googleDriveKeys.all, 'job', jobId] as const,
  stats: () => [...googleDriveKeys.all, 'stats'] as const,
};

// ===========================================
// AUTH QUERIES
// ===========================================

/**
 * Check if Google Drive is connected for the school
 */
export function useGoogleDriveAuthStatus() {
  return useQuery({
    queryKey: googleDriveKeys.authStatus(),
    queryFn: () => googleDriveApi.getAuthStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get OAuth authorization URL
 */
export function useGoogleDriveAuthUrl() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: () => googleDriveApi.getAuthUrl(),
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to get authorization URL', {
        variant: 'error',
      });
    },
  });
}

/**
 * Revoke Google Drive access
 */
export function useRevokeGoogleDriveAccess() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: () => googleDriveApi.revokeAccess(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.all });
      enqueueSnackbar('Google Drive disconnected successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to disconnect Google Drive', {
        variant: 'error',
      });
    },
  });
}

// ===========================================
// FOLDER QUERIES
// ===========================================

/**
 * Browse Google Drive folders
 */
export function useBrowseFolders(params?: BrowseFoldersQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: googleDriveKeys.browseFolders(params),
    queryFn: () => googleDriveApi.browseFolders(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  });
}

/**
 * Get all folder mappings for the school
 */
export function useFolderMappings() {
  return useQuery({
    queryKey: googleDriveKeys.mappings(),
    queryFn: () => googleDriveApi.getMappings(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// ===========================================
// FOLDER MUTATIONS
// ===========================================

/**
 * Link a Google Drive folder to a lesson or student
 */
export function useLinkFolder() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (input: LinkFolderInput) => googleDriveApi.linkFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.mappings() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.syncStatus() });
      enqueueSnackbar('Folder linked successfully. Sync started.', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to link folder', { variant: 'error' });
    },
  });
}

/**
 * Update folder sync settings
 */
export function useUpdateFolderSettings() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ folderId, syncEnabled }: { folderId: string; syncEnabled: boolean }) =>
      googleDriveApi.updateFolderSettings(folderId, syncEnabled),
    onSuccess: (_, { syncEnabled }) => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.mappings() });
      enqueueSnackbar(
        syncEnabled ? 'Sync enabled for folder' : 'Sync disabled for folder',
        { variant: 'success' }
      );
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update folder settings', {
        variant: 'error',
      });
    },
  });
}

/**
 * Unlink a Google Drive folder
 */
export function useUnlinkFolder() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (folderId: string) => googleDriveApi.unlinkFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.mappings() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.files() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.stats() });
      enqueueSnackbar('Folder unlinked successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to unlink folder', { variant: 'error' });
    },
  });
}

/**
 * Reset sync status for a folder
 */
export function useResetFolderSync() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (folderId: string) => googleDriveApi.resetFolderSync(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.mappings() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.syncStatus() });
      enqueueSnackbar('Folder sync status reset. You can now trigger a new sync.', {
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to reset folder sync', { variant: 'error' });
    },
  });
}

// ===========================================
// FILE QUERIES
// ===========================================

/**
 * Get files from synced folders
 */
export function useGoogleDriveFiles(filters?: FilesQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: googleDriveKeys.files(filters),
    queryFn: () => googleDriveApi.getFiles(filters),
    staleTime: 60 * 1000, // 1 minute
    enabled: options?.enabled !== false,
  });
}

/**
 * Get a single file by ID
 */
export function useGoogleDriveFile(fileId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: googleDriveKeys.fileDetail(fileId),
    queryFn: () => googleDriveApi.getFileById(fileId),
    enabled: !!fileId && options?.enabled !== false,
  });
}

// ===========================================
// FILE MUTATIONS
// ===========================================

/**
 * Upload a file via portal (syncs to Google Drive)
 */
export function useUploadDriveFile() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (input: UploadFileInput) => googleDriveApi.uploadFile(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.files() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.stats() });
      if (variables.lessonId) {
        queryClient.invalidateQueries({
          queryKey: googleDriveKeys.files({ lessonId: variables.lessonId }),
        });
      }
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: googleDriveKeys.files({ studentId: variables.studentId }),
        });
      }
      enqueueSnackbar('File uploaded and synced to Google Drive', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to upload file', { variant: 'error' });
    },
  });
}

/**
 * Update file metadata (visibility, tags)
 */
export function useUpdateDriveFile() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ fileId, data }: { fileId: string; data: UpdateFileInput }) =>
      googleDriveApi.updateFile(fileId, data),
    onSuccess: (updatedFile) => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.files() });
      queryClient.setQueryData(
        googleDriveKeys.fileDetail(updatedFile.id),
        updatedFile
      );
      enqueueSnackbar('File updated successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update file', { variant: 'error' });
    },
  });
}

/**
 * Delete a file
 */
export function useDeleteDriveFile() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (fileId: string) => googleDriveApi.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.files() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.stats() });
      enqueueSnackbar('File deleted successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to delete file', { variant: 'error' });
    },
  });
}

// ===========================================
// SYNC QUERIES & MUTATIONS
// ===========================================

/**
 * Get sync status for the school
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: googleDriveKeys.syncStatus(),
    queryFn: () => googleDriveApi.getSyncStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

/**
 * Get status of a sync job
 */
export function useJobStatus(jobId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: googleDriveKeys.jobStatus(jobId || ''),
    queryFn: () => googleDriveApi.getJobStatus(jobId!),
    enabled: !!jobId && options?.enabled !== false,
    refetchInterval: (query) => {
      // Stop polling when job is completed or failed
      const state = query.state.data?.state;
      if (state === 'completed' || state === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds while job is running
    },
  });
}

/**
 * Trigger manual sync
 */
export function useTriggerSync() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (input?: TriggerSyncInput) => googleDriveApi.triggerSync(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.syncStatus() });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.mappings() });
      enqueueSnackbar(
        input?.folderId
          ? 'Folder sync started'
          : 'Full sync started for all folders',
        { variant: 'info' }
      );
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to trigger sync', { variant: 'error' });
    },
  });
}

// ===========================================
// STATS QUERIES
// ===========================================

/**
 * Get storage statistics for the school
 */
export function useStorageStats() {
  return useQuery({
    queryKey: googleDriveKeys.stats(),
    queryFn: () => googleDriveApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
