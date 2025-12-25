// ===========================================
// TeacherResourcesPanel Component Tests
// ===========================================
// Unit tests for teacher resources management panel

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherResourcesPanel from '../TeacherResourcesPanel';
import { createWrapper, mockAuthStatus, mockFolderMapping, mockGoogleDriveFile } from '../../../test/utils';
import { googleDriveApi } from '../../../api/googleDrive.api';

// Mock the API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      getAuthStatus: vi.fn(),
      getMappings: vi.fn(),
      getFiles: vi.fn(),
      deleteFile: vi.fn(),
    },
  };
});

// Mock resources API
vi.mock('../../../api/resources.api', () => ({
  formatFileSize: (bytes: number) => `${Math.round(bytes / 1024)} KB`,
  getVisibilityColor: () => 'primary',
  getVisibilityLabel: (visibility: string) => visibility,
  isAllowedFileType: () => true,
  isFileSizeAllowed: () => true,
  MAX_FILE_SIZE: 50 * 1024 * 1024,
}));

// Mock debounce hook
vi.mock('../../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
}));

// Mock lessons hook
vi.mock('../../../hooks/useLessons', () => ({
  useLessons: () => ({
    data: [
      { id: 'lesson-1', name: 'Piano Beginners' },
      { id: 'lesson-2', name: 'Guitar Advanced' },
    ],
  }),
}));

describe('TeacherResourcesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockReturnValue(
      new Promise(() => {})
    );
    vi.mocked(googleDriveApi.getMappings).mockReturnValue(
      new Promise(() => {})
    );

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('should show not connected message when Drive not connected', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Google Drive Not Connected')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Connect Google Drive to manage lesson resources/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /go to google drive settings/i })
    ).toBeInTheDocument();
  });

  it('should show no folder linked message when no folder mapped', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      // Folder for a different lesson
      mockFolderMapping({ lesson: { id: 'lesson-other', name: 'Other' } }),
    ]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('No Folder Linked')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Link a Google Drive folder to this lesson/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /link a folder/i })
    ).toBeInTheDocument();
  });

  it('should show resources panel when folder is linked', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      mockFolderMapping({
        folderName: 'Piano Resources',
        lesson: { id: 'lesson-1', name: 'Piano Beginners' },
        syncStatus: 'SYNCED',
      }),
    ]);
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([
      mockGoogleDriveFile({ id: 'file-1', fileName: 'worksheet.pdf' }),
    ]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Lesson Resources')).toBeInTheDocument();
    });

    expect(screen.getByText('Linked folder: Piano Resources')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /upload file/i })
    ).toBeInTheDocument();
  });

  it('should show error alert when sync status is ERROR', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      mockFolderMapping({
        lesson: { id: 'lesson-1', name: 'Piano' },
        syncStatus: 'ERROR',
        syncError: 'Folder not found',
      }),
    ]);
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Sync error: Folder not found/i)).toBeInTheDocument();
    });
  });

  it('should show syncing alert when sync is in progress', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      mockFolderMapping({
        lesson: { id: 'lesson-1', name: 'Piano' },
        syncStatus: 'SYNCING',
      }),
    ]);
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Syncing files from Google Drive/i)
      ).toBeInTheDocument();
    });
  });

  it('should open upload dialog when Upload File is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      mockFolderMapping({
        lesson: { id: 'lesson-1', name: 'Piano' },
        syncStatus: 'SYNCED',
      }),
    ]);
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /upload file/i }));

    await waitFor(() => {
      expect(screen.getByText('Upload to Google Drive')).toBeInTheDocument();
    });
  });

  it('should show files from FileList', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      mockFolderMapping({
        lesson: { id: 'lesson-1', name: 'Piano' },
        syncStatus: 'SYNCED',
      }),
    ]);
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([
      mockGoogleDriveFile({ id: 'file-1', fileName: 'homework-week1.pdf' }),
      mockGoogleDriveFile({ id: 'file-2', fileName: 'scales-practice.mp3' }),
    ]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('homework-week1.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('scales-practice.mp3')).toBeInTheDocument();
  });

  it('should show delete confirmation when delete is triggered', async () => {
    const user = userEvent.setup();
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.getMappings).mockResolvedValueOnce([
      mockFolderMapping({
        lesson: { id: 'lesson-1', name: 'Piano' },
        syncStatus: 'SYNCED',
      }),
    ]);
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([
      mockGoogleDriveFile({ id: 'file-1', fileName: 'test-file.pdf' }),
    ]);

    render(<TeacherResourcesPanel lessonId="lesson-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    // Open the file menu
    const menuButtons = screen.getAllByRole('button');
    const menuButton = menuButtons.find((btn) =>
      btn.querySelector('[data-testid="MoreVertIcon"]')
    );

    if (menuButton) {
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Delete File')).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to delete "test-file.pdf"/i)
        ).toBeInTheDocument();
      });
    }
  });
});
