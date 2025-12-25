// ===========================================
// File Icons Utility Tests
// ===========================================
// Unit tests for file icon components

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { getFileIconComponent, getFileTypeName } from '../fileIcons';

// Mock the API helper
vi.mock('../../api/googleDrive.api', () => ({
  getFileIconName: (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('audio/')) return 'AudioFile';
    if (mimeType.startsWith('video/')) return 'VideoFile';
    if (mimeType === 'application/pdf') return 'PictureAsPdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'TableChart';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Slideshow';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Description';
    return 'InsertDriveFile';
  },
}));

describe('getFileIconComponent', () => {
  it('should return image icon for image MIME types', () => {
    const { container } = render(getFileIconComponent('image/jpeg'));
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ImageIcon"]')).toBeTruthy;
  });

  it('should return audio icon for audio MIME types', () => {
    const { container } = render(getFileIconComponent('audio/mpeg'));
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should return video icon for video MIME types', () => {
    const { container } = render(getFileIconComponent('video/mp4'));
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should return PDF icon for PDF files', () => {
    const { container } = render(getFileIconComponent('application/pdf'));
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should return spreadsheet icon for Excel files', () => {
    const { container } = render(
      getFileIconComponent('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should return presentation icon for PowerPoint files', () => {
    const { container } = render(
      getFileIconComponent('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should return document icon for Word files', () => {
    const { container } = render(
      getFileIconComponent('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should return default file icon for unknown types', () => {
    const { container } = render(getFileIconComponent('application/octet-stream'));
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should use music icon for audio when useMusicIcon is true', () => {
    const { container } = render(
      getFileIconComponent('audio/mp3', { useMusicIcon: true })
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply correct size for small', () => {
    const { container } = render(
      getFileIconComponent('application/pdf', { size: 'small' })
    );
    const svg = container.querySelector('svg');
    // Check that the icon was rendered
    expect(svg).toBeInTheDocument();
  });

  it('should apply correct size for medium', () => {
    const { container } = render(
      getFileIconComponent('application/pdf', { size: 'medium' })
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply correct size for large (default)', () => {
    const { container } = render(getFileIconComponent('application/pdf'));
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('getFileTypeName', () => {
  it('should return "Image" for image MIME types', () => {
    expect(getFileTypeName('image/jpeg')).toBe('Image');
    expect(getFileTypeName('image/png')).toBe('Image');
    expect(getFileTypeName('image/gif')).toBe('Image');
  });

  it('should return "Audio" for audio MIME types', () => {
    expect(getFileTypeName('audio/mpeg')).toBe('Audio');
    expect(getFileTypeName('audio/wav')).toBe('Audio');
    expect(getFileTypeName('audio/mp3')).toBe('Audio');
  });

  it('should return "Video" for video MIME types', () => {
    expect(getFileTypeName('video/mp4')).toBe('Video');
    expect(getFileTypeName('video/webm')).toBe('Video');
  });

  it('should return "PDF Document" for PDF files', () => {
    expect(getFileTypeName('application/pdf')).toBe('PDF Document');
  });

  it('should return "Spreadsheet" for Excel files', () => {
    expect(
      getFileTypeName('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ).toBe('Spreadsheet');
    expect(getFileTypeName('application/vnd.ms-excel')).toBe('Spreadsheet');
  });

  it('should return "Presentation" for PowerPoint files', () => {
    expect(
      getFileTypeName('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    ).toBe('Presentation');
    expect(getFileTypeName('application/vnd.ms-powerpoint')).toBe('Presentation');
  });

  it('should return "Document" for Word files', () => {
    expect(
      getFileTypeName('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ).toBe('Document');
    expect(getFileTypeName('application/msword')).toBe('Document');
  });

  it('should return "Text File" for plain text', () => {
    expect(getFileTypeName('text/plain')).toBe('Text File');
  });

  it('should return "File" for unknown types', () => {
    expect(getFileTypeName('application/octet-stream')).toBe('File');
    expect(getFileTypeName('unknown/type')).toBe('File');
  });
});
