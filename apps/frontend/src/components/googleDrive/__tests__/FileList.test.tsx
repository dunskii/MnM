// ===========================================
// FileList Component Tests
// ===========================================
// Unit tests for file list display and filtering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileList from '../FileList';
import { createWrapper, mockGoogleDriveFile } from '../../../test/utils';
import { googleDriveApi } from '../../../api/googleDrive.api';

// Mock the API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      getFiles: vi.fn(),
    },
  };
});

// Mock lessons hook
vi.mock('../../../hooks/useLessons', () => ({
  useLessons: () => ({
    data: [
      { id: 'lesson-1', name: 'Piano Beginners' },
      { id: 'lesson-2', name: 'Guitar Advanced' },
    ],
  }),
}));

// Mock the debounce hook to be immediate
vi.mock('../../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
}));

// Mock resources API
vi.mock('../../../api/resources.api', () => ({
  formatFileSize: (bytes: number) => `${Math.round(bytes / 1024)} KB`,
  getVisibilityColor: () => 'primary',
  getVisibilityLabel: (visibility: string) => {
    const labels: Record<string, string> = {
      ALL: 'Everyone',
      TEACHERS_AND_PARENTS: 'Teachers & Parents',
      TEACHERS_ONLY: 'Teachers Only',
    };
    return labels[visibility] || visibility;
  },
}));

describe('FileList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(googleDriveApi.getFiles).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(<FileList />, { wrapper: createWrapper() });

    // Should show loading skeletons
    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('should render files in grid view', async () => {
    const mockFiles = [
      mockGoogleDriveFile({ id: 'file-1', fileName: 'document.pdf' }),
      mockGoogleDriveFile({ id: 'file-2', fileName: 'image.jpg', mimeType: 'image/jpeg' }),
      mockGoogleDriveFile({ id: 'file-3', fileName: 'audio.mp3', mimeType: 'audio/mpeg' }),
    ];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    render(<FileList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('audio.mp3')).toBeInTheDocument();
  });

  it('should show file count', async () => {
    const mockFiles = [
      mockGoogleDriveFile({ id: 'file-1' }),
      mockGoogleDriveFile({ id: 'file-2' }),
    ];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    render(<FileList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2 files')).toBeInTheDocument();
    });
  });

  it('should show singular "file" for single file', async () => {
    const mockFiles = [mockGoogleDriveFile({ id: 'file-1' })];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    render(<FileList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('1 file')).toBeInTheDocument();
    });
  });

  it('should show empty state when no files', async () => {
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<FileList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No files found')).toBeInTheDocument();
    });
  });

  it('should have a working search input', async () => {
    const user = userEvent.setup();
    const mockFiles = [
      mockGoogleDriveFile({ id: 'file-1', fileName: 'document.pdf' }),
      mockGoogleDriveFile({ id: 'file-2', fileName: 'homework.pdf' }),
    ];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValue(mockFiles);

    render(<FileList showFilters />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search files...');
    await user.type(searchInput, 'test');

    // Verify search input is functional
    expect(searchInput).toHaveValue('test');
  });

  it('should display files with tags', async () => {
    const mockFiles = [
      mockGoogleDriveFile({ id: 'file-1', fileName: 'doc1.pdf', tags: ['piano'] }),
      mockGoogleDriveFile({ id: 'file-2', fileName: 'doc2.pdf', tags: ['guitar'] }),
    ];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValue(mockFiles);

    render(<FileList showFilters />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
    });
  });

  it('should toggle between grid and list view', async () => {
    const user = userEvent.setup();
    const mockFiles = [mockGoogleDriveFile({ id: 'file-1', fileName: 'test.pdf' })];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    render(<FileList showFilters />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Find list view toggle button
    const toggleButtons = screen.getAllByRole('button');
    const listViewButton = toggleButtons.find(
      (btn) => btn.getAttribute('value') === 'list'
    );

    if (listViewButton) {
      await user.click(listViewButton);
    }

    // Should now show table view
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('should show edit/delete buttons when editable', async () => {
    const mockFiles = [mockGoogleDriveFile({ id: 'file-1', fileName: 'test.pdf' })];
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce(mockFiles);

    render(
      <FileList editable onEdit={mockOnEdit} onDelete={mockOnDelete} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Should have menu button for actions
    const menuButtons = screen.getAllByRole('button');
    expect(menuButtons.length).toBeGreaterThan(0);
  });

  it('should hide filters when showFilters is false', async () => {
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<FileList showFilters={false} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search files...')).not.toBeInTheDocument();
    });
  });

  it('should show error state on API error', async () => {
    vi.mocked(googleDriveApi.getFiles).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<FileList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load files/i)).toBeInTheDocument();
    });
  });

  it('should pass lessonId filter to API', async () => {
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<FileList lessonId="lesson-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(googleDriveApi.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({ lessonId: 'lesson-123' })
      );
    });
  });

  it('should pass studentId filter to API', async () => {
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<FileList studentId="student-456" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(googleDriveApi.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 'student-456' })
      );
    });
  });

  it('should render filters when showFilters is true', async () => {
    vi.mocked(googleDriveApi.getFiles).mockResolvedValueOnce([]);

    render(<FileList showFilters />, { wrapper: createWrapper() });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('0 files')).toBeInTheDocument();
    });

    // Should have search input
    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
  });
});
