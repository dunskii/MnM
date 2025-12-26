// ===========================================
// LinkFolderDialog Component Tests
// ===========================================
// Unit tests for linking Drive folders to lessons/students

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinkFolderDialog from '../LinkFolderDialog';
import { createWrapper, mockAuthStatus, mockDriveFolder } from '../../../test/utils';
import { googleDriveApi } from '../../../api/googleDrive.api';

// Mock the Google Drive API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      getAuthStatus: vi.fn(),
      browseFolders: vi.fn(),
      linkFolder: vi.fn(),
    },
  };
});

// Mock lessons hook
vi.mock('../../../hooks/useLessons', () => ({
  useLessons: () => ({
    data: [
      {
        id: 'lesson-1',
        name: 'Piano Beginners',
        teacher: { user: { firstName: 'John', lastName: 'Smith' } },
        room: { name: 'Room A' },
      },
      {
        id: 'lesson-2',
        name: 'Guitar Advanced',
        teacher: { user: { firstName: 'Jane', lastName: 'Doe' } },
        room: { name: 'Room B' },
      },
    ],
    isLoading: false,
  }),
}));

// Mock users hook
vi.mock('../../../hooks/useUsers', () => ({
  useStudents: () => ({
    data: [
      { id: 'student-1', firstName: 'Alice', lastName: 'Brown', ageGroup: 'Kids' },
      { id: 'student-2', firstName: 'Bob', lastName: 'Green', ageGroup: 'Teens' },
    ],
    isLoading: false,
  }),
}));

// Mock debounce hook
vi.mock('../../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
}));

// Mock resources API
vi.mock('../../../api/resources.api', () => ({
  formatFileSize: (bytes: number) => `${Math.round(bytes / 1024)} KB`,
  getVisibilityColor: () => 'primary',
  getVisibilityLabel: (visibility: string) => visibility,
}));

describe('LinkFolderDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValue(
      mockAuthStatus({ isConnected: true })
    );
    vi.mocked(googleDriveApi.browseFolders).mockResolvedValue([
      mockDriveFolder({ id: 'folder-1', name: 'Music Files' }),
      mockDriveFolder({ id: 'folder-2', name: 'Resources' }),
    ]);
  });

  it('should render dialog title', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Link Google Drive Folder')).toBeInTheDocument();
  });

  it('should show lesson/student radio options', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText('Lesson')).toBeInTheDocument();
    expect(screen.getByLabelText('Student')).toBeInTheDocument();
  });

  it('should default to lesson selection', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    const lessonRadio = screen.getByLabelText('Lesson');
    expect(lessonRadio).toBeChecked();
  });

  it('should show lesson autocomplete input', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByPlaceholderText('Search lessons...')).toBeInTheDocument();
  });

  it('should switch to student selection when student radio is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByLabelText('Student'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument();
    });
  });

  it('should show warning when not connected', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );

    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Google Drive is not connected/i)
      ).toBeInTheDocument();
    });
  });

  it('should show folder browser section', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Select Google Drive Folder')).toBeInTheDocument();
  });

  it('should have disabled Link button initially', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    const linkButton = screen.getByRole('button', { name: /link folder/i });
    expect(linkButton).toBeDisabled();
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when closed', () => {
    render(
      <LinkFolderDialog open={false} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Link Google Drive Folder')).not.toBeInTheDocument();
  });

  it('should show selected folder display when folder is chosen', async () => {
    const user = userEvent.setup();

    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Wait for folders to load
    await waitFor(() => {
      expect(screen.getByText('Music Files')).toBeInTheDocument();
    });

    // Click to select folder
    await user.click(screen.getByText('Music Files'));

    await waitFor(() => {
      expect(screen.getByText('Selected Folder')).toBeInTheDocument();
      expect(screen.getByText('Ready to link')).toBeInTheDocument();
    });
  });

  it('should have Link button that requires selections', async () => {
    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Wait for folders to load
    await waitFor(() => {
      expect(screen.getByText('Music Files')).toBeInTheDocument();
    });

    // Link button should be disabled without selections
    const linkButton = screen.getByRole('button', { name: /link folder/i });
    expect(linkButton).toBeDisabled();
  });

  it('should show selected folder when folder is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkFolderDialog open={true} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Wait for folders to load
    await waitFor(() => {
      expect(screen.getByText('Music Files')).toBeInTheDocument();
    });

    // Click a folder
    await user.click(screen.getByText('Music Files'));

    // Should show selected folder UI
    await waitFor(() => {
      expect(screen.getByText('Selected Folder')).toBeInTheDocument();
      expect(screen.getByText('Ready to link')).toBeInTheDocument();
    });
  });
});
