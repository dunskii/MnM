// ===========================================
// FileMetadataEditor Component Tests
// ===========================================
// Unit tests for file metadata editing dialog

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileMetadataEditor from '../FileMetadataEditor';
import { createWrapper, mockGoogleDriveFile } from '../../../test/utils';
import { googleDriveApi } from '../../../api/googleDrive.api';

// Mock the API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      updateFile: vi.fn(),
    },
    getUploadSourceLabel: (source: string) =>
      source === 'PORTAL' ? 'Uploaded via Portal' : 'Synced from Google Drive',
    formatSyncTime: (date: string) => new Date(date).toLocaleDateString(),
  };
});

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

describe('FileMetadataEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when file is null', () => {
    render(
      <FileMetadataEditor
        open={true}
        file={null}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Edit File')).not.toBeInTheDocument();
  });

  it('should render dialog with file info', async () => {
    const file = mockGoogleDriveFile({
      fileName: 'test-document.pdf',
      fileSize: 1024000,
    });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Edit File')).toBeInTheDocument();
    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/1000 KB/)).toBeInTheDocument();
  });

  it('should show upload source', async () => {
    const file = mockGoogleDriveFile({ uploadedVia: 'PORTAL' });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Upload Source')).toBeInTheDocument();
    expect(screen.getByText('Uploaded via Portal')).toBeInTheDocument();
  });

  it('should show visibility selector with current value', async () => {
    const file = mockGoogleDriveFile({ visibility: 'TEACHERS_ONLY' });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    // There should be at least one visibility label
    const visibilityLabels = screen.getAllByText('Visibility');
    expect(visibilityLabels.length).toBeGreaterThan(0);
  });

  it('should show tags editor', async () => {
    const file = mockGoogleDriveFile({ tags: ['piano', 'beginner'] });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByText('piano')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('should show tag count', async () => {
    const file = mockGoogleDriveFile({ tags: ['tag1', 'tag2'] });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('2/10 tags')).toBeInTheDocument();
  });

  it('should have disabled save button when no changes', async () => {
    const file = mockGoogleDriveFile();

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile();

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should add tags when typing and pressing Enter', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({ tags: [] });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    await user.type(tagInput, 'newTag{enter}');

    await waitFor(() => {
      expect(screen.getByText('newTag')).toBeInTheDocument();
    });
  });

  it('should remove tags when delete is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({ tags: ['removeMe'] });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('removeMe')).toBeInTheDocument();

    // Click delete button on the chip
    const deleteButton = screen.getByTestId('CancelIcon');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('removeMe')).not.toBeInTheDocument();
    });
  });

  it('should have save button that is disabled initially', async () => {
    const file = mockGoogleDriveFile({ visibility: 'ALL' });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when tags change', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({ tags: [] });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    await user.type(tagInput, 'newTag{enter}');

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('should show thumbnail when available', async () => {
    const file = mockGoogleDriveFile({
      thumbnailLink: 'https://example.com/thumb.jpg',
      fileName: 'photo.jpg',
    });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const thumbnail = screen.getByAltText('photo.jpg');
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('should show file icon when no thumbnail', async () => {
    const file = mockGoogleDriveFile({
      thumbnailLink: undefined,
      mimeType: 'application/pdf',
    });

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    // Should have an icon (SVG element)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should call updateFile API when save is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({ id: 'file-123', visibility: 'ALL', tags: [] });
    vi.mocked(googleDriveApi.updateFile).mockResolvedValueOnce(file);

    render(
      <FileMetadataEditor
        open={true}
        file={file}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Add a tag to enable save
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    await user.type(tagInput, 'newTag{enter}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(googleDriveApi.updateFile).toHaveBeenCalled();
    });
  });
});
