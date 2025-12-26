// ===========================================
// DriveFileUploader Component Tests
// ===========================================
// Unit tests for file upload to Google Drive

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DriveFileUploader from '../DriveFileUploader';
import { createWrapper } from '../../../test/utils';

// Mock the API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      uploadFile: vi.fn(),
    },
  };
});

// Mock resources API
vi.mock('../../../api/resources.api', () => ({
  formatFileSize: (bytes: number) => `${Math.round(bytes / 1024)} KB`,
  getVisibilityLabel: (visibility: string) => {
    const labels: Record<string, string> = {
      ALL: 'Everyone',
      TEACHERS_AND_PARENTS: 'Teachers & Parents',
      TEACHERS_ONLY: 'Teachers Only',
    };
    return labels[visibility] || visibility;
  },
  getVisibilityColor: () => 'primary',
  isAllowedFileType: (mimeType: string) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'audio/mpeg'];
    return allowed.includes(mimeType);
  },
  isFileSizeAllowed: (size: number) => size <= 50 * 1024 * 1024,
  MAX_FILE_SIZE: 50 * 1024 * 1024,
}));

describe('DriveFileUploader', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload header', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Upload to Google Drive')).toBeInTheDocument();
  });

  it('should show info alert about sync', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(/Files uploaded here will automatically sync/i)
    ).toBeInTheDocument();
  });

  it('should render drag and drop zone', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Drag & drop file here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse')).toBeInTheDocument();
  });

  it('should show visibility selector', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    // There should be at least one visibility label
    const visibilityLabels = screen.getAllByText('Visibility');
    expect(visibilityLabels.length).toBeGreaterThan(0);
  });

  it('should show tags input', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a tag and press Enter')).toBeInTheDocument();
  });

  it('should show cancel button when onClose is provided', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DriveFileUploader lessonId="lesson-1" onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have disabled upload button initially', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    const uploadButton = screen.getByRole('button', { name: /upload to drive/i });
    expect(uploadButton).toBeDisabled();
  });

  it('should add and remove tags', async () => {
    const user = userEvent.setup();

    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');

    // Add a tag
    await user.type(tagInput, 'piano{enter}');

    await waitFor(() => {
      expect(screen.getByText('piano')).toBeInTheDocument();
    });

    // Add another tag
    await user.type(tagInput, 'beginner{enter}');

    await waitFor(() => {
      expect(screen.getByText('beginner')).toBeInTheDocument();
    });

    // Remove first tag
    const deleteButtons = screen.getAllByTestId('CancelIcon');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('piano')).not.toBeInTheDocument();
    });
  });

  it('should show selected file when file is chosen', async () => {
    const user = userEvent.setup();
    const testFile = new File(['test content'], 'test-document.pdf', {
      type: 'application/pdf',
    });

    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, testFile);

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    // Should show remove button
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('should enable upload button when file is selected', async () => {
    const user = userEvent.setup();
    const testFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, testFile);

    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload to drive/i });
      expect(uploadButton).not.toBeDisabled();
    });
  });

  it('should accept valid file types', async () => {
    const user = userEvent.setup();
    const validFile = new File(['test'], 'test.pdf', {
      type: 'application/pdf',
    });

    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, validFile);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should clear file when remove is clicked', async () => {
    const user = userEvent.setup();
    const testFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, testFile);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('Drag & drop file here')).toBeInTheDocument();
    });
  });

  it('should show tag count', () => {
    render(
      <DriveFileUploader lessonId="lesson-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('0/10 tags')).toBeInTheDocument();
  });
});
