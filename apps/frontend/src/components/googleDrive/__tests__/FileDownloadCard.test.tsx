// ===========================================
// FileDownloadCard Component Tests
// ===========================================
// Unit tests for parent/student file download card

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDownloadCard, { FileDownloadListItem } from '../FileDownloadCard';
import { createWrapper, mockGoogleDriveFile } from '../../../test/utils';

// Mock resources API
vi.mock('../../../api/resources.api', () => ({
  formatFileSize: (bytes: number) => `${Math.round(bytes / 1024)} KB`,
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('FileDownloadCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render file name', () => {
    const file = mockGoogleDriveFile({ fileName: 'homework-week1.pdf' });

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('homework-week1.pdf')).toBeInTheDocument();
  });

  it('should display file size', () => {
    const file = mockGoogleDriveFile({ fileSize: 2048000 }); // ~2MB

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('2000 KB')).toBeInTheDocument();
  });

  it('should display file type chip', () => {
    const file = mockGoogleDriveFile({ mimeType: 'application/pdf' });

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('PDF Document')).toBeInTheDocument();
  });

  it('should display lesson name when showLesson is true', () => {
    const file = mockGoogleDriveFile({
      folder: {
        id: 'folder-1',
        lesson: { id: 'lesson-1', name: 'Piano Beginners' },
        syncStatus: 'SYNCED',
      },
    });

    render(<FileDownloadCard file={file} showLesson={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Piano Beginners')).toBeInTheDocument();
  });

  it('should hide lesson name when showLesson is false', () => {
    const file = mockGoogleDriveFile({
      folder: {
        id: 'folder-1',
        lesson: { id: 'lesson-1', name: 'Piano Beginners' },
        syncStatus: 'SYNCED',
      },
    });

    render(<FileDownloadCard file={file} showLesson={false} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText('Piano Beginners')).not.toBeInTheDocument();
  });

  it('should display formatted date', () => {
    const file = mockGoogleDriveFile({
      createdAt: '2024-03-15T10:30:00Z',
    });

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    // Date format: "Added 15 Mar 2024"
    expect(screen.getByText(/Added/)).toBeInTheDocument();
  });

  it('should open file when View File button is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({
      webViewLink: 'https://drive.google.com/file/abc123',
    });

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /view file/i }));

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://drive.google.com/file/abc123',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should display thumbnail when available', () => {
    const file = mockGoogleDriveFile({
      fileName: 'photo.jpg',
      thumbnailLink: 'https://example.com/thumb.jpg',
    });

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    const thumbnail = screen.getByAltText('photo.jpg');
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('should show file icon when no thumbnail', () => {
    const file = mockGoogleDriveFile({
      thumbnailLink: undefined,
      mimeType: 'audio/mpeg',
    });

    render(<FileDownloadCard file={file} />, { wrapper: createWrapper() });

    // Should have an audio icon (MusicNote)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

describe('FileDownloadListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render file name', () => {
    const file = mockGoogleDriveFile({ fileName: 'scale-practice.mp3' });

    render(<FileDownloadListItem file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText('scale-practice.mp3')).toBeInTheDocument();
  });

  it('should display file size', () => {
    const file = mockGoogleDriveFile({ fileSize: 5120000 });

    render(<FileDownloadListItem file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText(/5000 KB/)).toBeInTheDocument();
  });

  it('should open file when View button is clicked', async () => {
    const user = userEvent.setup();
    const file = mockGoogleDriveFile({
      webViewLink: 'https://drive.google.com/file/xyz789',
    });

    render(<FileDownloadListItem file={file} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /view/i }));

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://drive.google.com/file/xyz789',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should display lesson name when available', () => {
    const file = mockGoogleDriveFile({
      folder: {
        id: 'folder-1',
        lesson: { id: 'lesson-1', name: 'Guitar Advanced' },
        syncStatus: 'SYNCED',
      },
    });

    render(<FileDownloadListItem file={file} />, { wrapper: createWrapper() });

    expect(screen.getByText(/Guitar Advanced/)).toBeInTheDocument();
  });
});
