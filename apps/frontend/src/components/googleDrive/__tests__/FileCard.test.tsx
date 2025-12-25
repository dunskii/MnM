// ===========================================
// FileCard Component Tests
// ===========================================
// Unit tests for file card display and actions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileCard from '../FileCard';
import { createWrapper, mockGoogleDriveFile } from '../../../test/utils';

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

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('FileCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render file name and details', () => {
    const file = mockGoogleDriveFile({ fileName: 'test-document.pdf' });

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
  });

  it('should display file size', () => {
    const file = mockGoogleDriveFile({ fileSize: 1024000 }); // ~1MB

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('1000 KB')).toBeInTheDocument();
  });

  it('should display visibility chip', () => {
    const file = mockGoogleDriveFile({ visibility: 'TEACHERS_ONLY' });

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('Teachers Only')).toBeInTheDocument();
  });

  it('should display tags when present', () => {
    const file = mockGoogleDriveFile({ tags: ['piano', 'beginner'] });

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('piano')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('should show +N for extra tags beyond 2', () => {
    const file = mockGoogleDriveFile({ tags: ['tag1', 'tag2', 'tag3', 'tag4'] });

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByText('tag3')).not.toBeInTheDocument();
  });

  it('should have open in drive button', async () => {
    const file = mockGoogleDriveFile({
      webViewLink: 'https://drive.google.com/file/test',
    });

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    // Check the open button exists
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show menu button when editable is true', () => {
    const file = mockGoogleDriveFile();

    render(
      <FileCard file={file} editable onEdit={mockOnEdit} onDelete={mockOnDelete} />,
      { wrapper: createWrapper() }
    );

    // Look for the more menu button
    const menuButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('[data-testid="MoreVertIcon"]') !== null
    );
    expect(menuButton).toBeDefined();
  });

  it('should not show menu button when editable is false', () => {
    const file = mockGoogleDriveFile();

    render(<FileCard file={file} editable={false} />, { wrapper: createWrapper() });

    // Should only have the open in drive button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);
  });

  it('should call onEdit when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({ id: 'file-123' });

    render(
      <FileCard file={file} editable onEdit={mockOnEdit} onDelete={mockOnDelete} />,
      { wrapper: createWrapper() }
    );

    // Open menu
    const menuButtons = screen.getAllByRole('button');
    const moreButton = menuButtons[menuButtons.length - 1]; // Last button is more menu
    await user.click(moreButton);

    // Click edit
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Edit'));

    expect(mockOnEdit).toHaveBeenCalledWith(file);
  });

  it('should call onDelete when delete menu item is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({ id: 'file-123' });

    render(
      <FileCard file={file} editable onEdit={mockOnEdit} onDelete={mockOnDelete} />,
      { wrapper: createWrapper() }
    );

    // Open menu
    const menuButtons = screen.getAllByRole('button');
    const moreButton = menuButtons[menuButtons.length - 1];
    await user.click(moreButton);

    // Click delete
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Delete'));

    expect(mockOnDelete).toHaveBeenCalledWith(file);
  });

  it('should display thumbnail when available', () => {
    const file = mockGoogleDriveFile({
      fileName: 'my-image.jpg',
      thumbnailLink: 'https://example.com/thumb.jpg',
    });

    render(<FileCard file={file} />, { wrapper: createWrapper() });

    const thumbnail = screen.getByAltText('my-image.jpg');
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('should show upload source icon', () => {
    const portalFile = mockGoogleDriveFile({ uploadedVia: 'PORTAL' });
    const driveFile = mockGoogleDriveFile({ uploadedVia: 'GOOGLE_DRIVE' });

    const { rerender } = render(<FileCard file={portalFile} />, { wrapper: createWrapper() });

    // Portal upload icon should be present
    expect(document.querySelector('[data-testid="UploadIcon"]')).toBeInTheDocument();

    rerender(<FileCard file={driveFile} />);

    // Drive icon should be present
    expect(document.querySelector('[data-testid="CloudDownloadIcon"]')).toBeInTheDocument();
  });
});
