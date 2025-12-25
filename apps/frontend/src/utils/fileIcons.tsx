// ===========================================
// File Icon Utilities
// ===========================================
// Shared file type icon components for consistent UI

import {
  Image as ImageIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  Description as DocIcon,
  PictureAsPdf as PdfIcon,
  TableChart as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  InsertDriveFile as FileIcon,
  MusicNote as MusicIcon,
} from '@mui/icons-material';
import { getFileIconName } from '../api/googleDrive.api';

// ===========================================
// TYPES
// ===========================================

export type FileIconSize = 'small' | 'medium' | 'large';

interface FileIconOptions {
  /** Icon size: small (32px), medium (48px), large (64px) */
  size?: FileIconSize;
  /** Whether to use music-specific icons for audio files */
  useMusicIcon?: boolean;
}

// ===========================================
// SIZE MAPPING
// ===========================================

const sizeMap: Record<FileIconSize, number> = {
  small: 32,
  medium: 48,
  large: 64,
};

// ===========================================
// ICON COMPONENT
// ===========================================

/**
 * Get a file type icon component based on MIME type
 *
 * @param mimeType - The MIME type of the file
 * @param options - Configuration options
 * @returns JSX element with appropriate icon
 *
 * @example
 * // Default large icon
 * getFileIconComponent('application/pdf')
 *
 * @example
 * // Small icon with music styling for audio
 * getFileIconComponent('audio/mp3', { size: 'small', useMusicIcon: true })
 */
export function getFileIconComponent(
  mimeType: string,
  options: FileIconOptions = {}
): JSX.Element {
  const { size = 'large', useMusicIcon = false } = options;
  const fontSize = sizeMap[size];

  // Special case for audio files with music branding
  if (useMusicIcon && mimeType.startsWith('audio/')) {
    return <MusicIcon sx={{ fontSize }} color="secondary" />;
  }

  const iconName = getFileIconName(mimeType);

  switch (iconName) {
    case 'Image':
      return <ImageIcon sx={{ fontSize }} color="primary" />;
    case 'AudioFile':
      return <AudioIcon sx={{ fontSize }} color="secondary" />;
    case 'VideoFile':
      return <VideoIcon sx={{ fontSize }} color="error" />;
    case 'PictureAsPdf':
      return <PdfIcon sx={{ fontSize }} color="error" />;
    case 'TableChart':
      return <SpreadsheetIcon sx={{ fontSize }} color="success" />;
    case 'Slideshow':
      return <PresentationIcon sx={{ fontSize }} color="warning" />;
    case 'Description':
      return <DocIcon sx={{ fontSize }} color="primary" />;
    default:
      return <FileIcon sx={{ fontSize }} color="action" />;
  }
}

/**
 * Get file type display name from MIME type
 *
 * @param mimeType - The MIME type of the file
 * @returns Human-readable file type name
 */
export function getFileTypeName(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType === 'application/pdf') return 'PDF Document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Document';
  if (mimeType === 'text/plain') return 'Text File';
  return 'File';
}
