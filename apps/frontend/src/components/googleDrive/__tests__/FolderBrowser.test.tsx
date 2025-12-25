// ===========================================
// FolderBrowser Component Tests
// ===========================================
// Unit tests for folder browsing and navigation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderBrowser from '../FolderBrowser';
import { createWrapper, mockDriveFolder } from '../../../test/utils';
import { googleDriveApi } from '../../../api/googleDrive.api';

// Mock the API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      browseFolders: vi.fn(),
    },
  };
});

// Mock the debounce hook to be immediate for testing
vi.mock('../../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
}));

describe('FolderBrowser', () => {
  const mockOnSelectFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton initially', () => {
    vi.mocked(googleDriveApi.browseFolders).mockReturnValue(
      new Promise(() => {}) // Never resolves - stays in loading state
    );

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    // Should show loading skeletons
    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('should render folder list after loading', async () => {
    const mockFolders = [
      mockDriveFolder({ id: 'folder-1', name: 'Documents' }),
      mockDriveFolder({ id: 'folder-2', name: 'Music Files' }),
      mockDriveFolder({ id: 'folder-3', name: 'Homework' }),
    ];
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce(mockFolders);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    expect(screen.getByText('Music Files')).toBeInTheDocument();
    expect(screen.getByText('Homework')).toBeInTheDocument();
  });

  it('should show empty state when no folders found', async () => {
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce([]);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByText('No folders found in this location')
      ).toBeInTheDocument();
    });
  });

  it('should show error state on API error', async () => {
    vi.mocked(googleDriveApi.browseFolders).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load folders/i)
      ).toBeInTheDocument();
    });
  });

  it('should call onSelectFolder when folder is clicked', async () => {
    const user = userEvent.setup();
    const mockFolders = [mockDriveFolder({ id: 'folder-1', name: 'Documents' })];
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce(mockFolders);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Documents'));

    expect(mockOnSelectFolder).toHaveBeenCalledWith(mockFolders[0]);
  });

  it('should show selected state for current selection', async () => {
    const mockFolders = [
      mockDriveFolder({ id: 'folder-1', name: 'Documents' }),
      mockDriveFolder({ id: 'folder-2', name: 'Music' }),
    ];
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce(mockFolders);

    render(
      <FolderBrowser
        onSelectFolder={mockOnSelectFolder}
        selectedFolderId="folder-1"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Should show "Selected" chip
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('should render search input', async () => {
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce([]);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search folders...')
      ).toBeInTheDocument();
    });
  });

  it('should have a search input for folders', async () => {
    const mockFolders = [mockDriveFolder({ id: 'folder-1', name: 'Documents' })];
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValue(mockFolders);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Verify search input exists and is functional
    const searchInput = screen.getByPlaceholderText('Search folders...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).not.toBeDisabled();
  });

  it('should navigate into folder when arrow is clicked', async () => {
    const user = userEvent.setup();
    const parentFolders = [
      mockDriveFolder({ id: 'parent-1', name: 'Parent Folder' }),
    ];
    const childFolders = [
      mockDriveFolder({
        id: 'child-1',
        name: 'Child Folder',
        parentId: 'parent-1',
      }),
    ];

    vi.mocked(googleDriveApi.browseFolders)
      .mockResolvedValueOnce(parentFolders)
      .mockResolvedValue(childFolders);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Parent Folder')).toBeInTheDocument();
    });

    // Click the navigation arrow (not the folder itself)
    const arrowButtons = screen.getAllByRole('button');
    const navigateButton = arrowButtons.find((btn) =>
      btn.getAttribute('title') === 'Open folder'
    );

    if (navigateButton) {
      await user.click(navigateButton);
    }

    // Should update breadcrumbs - check any call has the parent ID
    await waitFor(() => {
      const calls = vi.mocked(googleDriveApi.browseFolders).mock.calls;
      const hasParentCall = calls.some((call) => call[0]?.parentId === 'parent-1');
      expect(hasParentCall).toBe(true);
    }, { timeout: 2000 });
  });

  it('should show breadcrumb navigation', async () => {
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce([]);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('My Drive')).toBeInTheDocument();
    });
  });

  it('should disable interactions when disabled prop is true', async () => {
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce([]);

    render(
      <FolderBrowser onSelectFolder={mockOnSelectFolder} disabled={true} />,
      { wrapper: createWrapper() }
    );

    // Should not make API call when disabled
    await waitFor(() => {
      // Check that query is not enabled
      expect(googleDriveApi.browseFolders).not.toHaveBeenCalled();
    });
  });

  it('should show help text', async () => {
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValueOnce([]);

    render(<FolderBrowser onSelectFolder={mockOnSelectFolder} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Click a folder to select it/i)
      ).toBeInTheDocument();
    });
  });
});
