// ===========================================
// Google Drive Hooks Tests
// ===========================================
// Unit tests for useGoogleDrive React Query hooks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper, mockAuthStatus, mockFolderMapping, mockGoogleDriveFile, mockSyncStatus, mockStorageStats } from '../../test/utils';
import {
  useGoogleDriveAuthStatus,
  useFolderMappings,
  useGoogleDriveFiles,
  useSyncStatus,
  useStorageStats,
  useLinkFolder,
  useUploadDriveFile,
  useDeleteDriveFile,
  useTriggerSync,
  googleDriveKeys,
} from '../useGoogleDrive';
import { googleDriveApi } from '../../api/googleDrive.api';

// Mock the API module
vi.mock('../../api/googleDrive.api', () => ({
  googleDriveApi: {
    getAuthStatus: vi.fn(),
    getAuthUrl: vi.fn(),
    revokeAccess: vi.fn(),
    browseFolders: vi.fn(),
    getMappings: vi.fn(),
    linkFolder: vi.fn(),
    updateFolderSettings: vi.fn(),
    unlinkFolder: vi.fn(),
    resetFolderSync: vi.fn(),
    getFiles: vi.fn(),
    getFileById: vi.fn(),
    uploadFile: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    getSyncStatus: vi.fn(),
    triggerSync: vi.fn(),
    getJobStatus: vi.fn(),
    getStats: vi.fn(),
  },
  getFileIconName: vi.fn(() => 'InsertDriveFile'),
  getSyncStatusColor: vi.fn(() => 'success'),
  getSyncStatusLabel: vi.fn(() => 'Synced'),
}));

// Mock notistack
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Google Drive Query Keys', () => {
  it('should generate correct query key structure', () => {
    expect(googleDriveKeys.all).toEqual(['googleDrive']);
    expect(googleDriveKeys.authStatus()).toEqual(['googleDrive', 'authStatus']);
    expect(googleDriveKeys.folders()).toEqual(['googleDrive', 'folders']);
    expect(googleDriveKeys.mappings()).toEqual(['googleDrive', 'mappings']);
    expect(googleDriveKeys.files()).toEqual(['googleDrive', 'files', undefined]);
    expect(googleDriveKeys.files({ lessonId: '123' })).toEqual([
      'googleDrive',
      'files',
      { lessonId: '123' },
    ]);
    expect(googleDriveKeys.fileDetail('file-1')).toEqual([
      'googleDrive',
      'files',
      'detail',
      'file-1',
    ]);
    expect(googleDriveKeys.syncStatus()).toEqual(['googleDrive', 'syncStatus']);
    expect(googleDriveKeys.stats()).toEqual(['googleDrive', 'stats']);
  });
});

describe('useGoogleDriveAuthStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch auth status successfully', async () => {
    const mockStatus = mockAuthStatus({ isConnected: true });
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(mockStatus);

    const { result } = renderHook(() => useGoogleDriveAuthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStatus);
    expect(googleDriveApi.getAuthStatus).toHaveBeenCalledTimes(1);
  });

  it('should handle auth status error', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockRejectedValueOnce(
      new Error('Not authenticated')
    );

    const { result } = renderHook(() => useGoogleDriveAuthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useFolderMappings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch folder mappings successfully', async () => {
    const mockMappings = [
      mockFolderMapping({ id: 'mapping-1', folderName: 'Folder 1' }),
      mockFolderMapping({ id: 'mapping-2', folderName: 'Folder 2' }),
    ];
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce(mockMappings);

    const { result } = renderHook(() => useFolderMappings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].folderName).toBe('Folder 1');
  });
});

describe('useGoogleDriveFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch files without filters', async () => {
    const mockFiles = [
      mockGoogleDriveFile({ id: 'file-1', fileName: 'test1.pdf' }),
      mockGoogleDriveFile({ id: 'file-2', fileName: 'test2.pdf' }),
    ];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    const { result } = renderHook(() => useGoogleDriveFiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(googleDriveApi.getFiles).toHaveBeenCalledWith(undefined);
  });

  it('should fetch files with lesson filter', async () => {
    const mockFiles = [mockGoogleDriveFile({ id: 'file-1' })];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    const { result } = renderHook(
      () => useGoogleDriveFiles({ lessonId: 'lesson-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(googleDriveApi.getFiles).toHaveBeenCalledWith({ lessonId: 'lesson-1' });
  });

  it('should fetch files with visibility filter', async () => {
    const mockFiles = [mockGoogleDriveFile({ visibility: 'TEACHERS_ONLY' })];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    const { result } = renderHook(
      () => useGoogleDriveFiles({ visibility: 'TEACHERS_ONLY' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(googleDriveApi.getFiles).toHaveBeenCalledWith({
      visibility: 'TEACHERS_ONLY',
    });
  });
});

describe('useSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch sync status', async () => {
    const mockStatus = mockSyncStatus({ inProgress: false });
    vi.mocked(googleDriveApi.getSyncStatus).mockResolvedValueOnce(mockStatus);

    const { result } = renderHook(() => useSyncStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStatus);
    expect(result.current.data?.inProgress).toBe(false);
  });
});

describe('useStorageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch storage stats', async () => {
    const mockStats = mockStorageStats({ totalFiles: 150 });
    vi.mocked(googleDriveApi.getStats).mockResolvedValueOnce(mockStats);

    const { result } = renderHook(() => useStorageStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalFiles).toBe(150);
  });
});

describe('useLinkFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should link folder successfully', async () => {
    const mockMapping = mockFolderMapping();
    vi.mocked(googleDriveApi.linkFolder).mockResolvedValueOnce(mockMapping);

    const { result } = renderHook(() => useLinkFolder(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      driveFolderId: 'folder-1',
      folderName: 'Test Folder',
      folderUrl: 'https://drive.google.com/folder/1',
      lessonId: 'lesson-1',
    });

    expect(googleDriveApi.linkFolder).toHaveBeenCalledWith({
      driveFolderId: 'folder-1',
      folderName: 'Test Folder',
      folderUrl: 'https://drive.google.com/folder/1',
      lessonId: 'lesson-1',
    });
  });
});

describe('useUploadDriveFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload file successfully', async () => {
    const mockFile = mockGoogleDriveFile();
    vi.mocked(googleDriveApi.uploadFile).mockResolvedValueOnce(mockFile);

    const { result } = renderHook(() => useUploadDriveFile(), {
      wrapper: createWrapper(),
    });

    const testFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    await result.current.mutateAsync({
      file: testFile,
      lessonId: 'lesson-1',
      visibility: 'ALL',
      tags: ['homework'],
    });

    expect(googleDriveApi.uploadFile).toHaveBeenCalledWith({
      file: testFile,
      lessonId: 'lesson-1',
      visibility: 'ALL',
      tags: ['homework'],
    });
  });
});

describe('useDeleteDriveFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete file successfully', async () => {
    vi.mocked(googleDriveApi.deleteFile).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteDriveFile(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('file-1');

    expect(googleDriveApi.deleteFile).toHaveBeenCalledWith('file-1');
  });
});

describe('useTriggerSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger full sync', async () => {
    vi.mocked(googleDriveApi.triggerSync).mockResolvedValueOnce({
      jobId: 'job-1',
    });

    const { result } = renderHook(() => useTriggerSync(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(undefined);

    expect(googleDriveApi.triggerSync).toHaveBeenCalledWith(undefined);
  });

  it('should trigger sync for specific folder', async () => {
    vi.mocked(googleDriveApi.triggerSync).mockResolvedValueOnce({
      jobId: 'job-1',
    });

    const { result } = renderHook(() => useTriggerSync(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ folderId: 'folder-1' });

    expect(googleDriveApi.triggerSync).toHaveBeenCalledWith({
      folderId: 'folder-1',
    });
  });
});
