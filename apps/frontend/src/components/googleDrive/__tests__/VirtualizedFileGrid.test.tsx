// ===========================================
// VirtualizedFileGrid Component Tests
// ===========================================
// Unit tests for virtualized file grid display

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VirtualizedFileGrid, {
  shouldUseVirtualization,
  VIRTUALIZATION_THRESHOLD,
} from '../VirtualizedFileGrid';
import { createWrapper, mockGoogleDriveFile } from '../../../test/utils';

// Mock resources API
vi.mock('../../../api/resources.api', () => ({
  formatFileSize: (bytes: number) => `${Math.round(bytes / 1024)} KB`,
  getVisibilityColor: () => 'primary',
  getVisibilityLabel: (visibility: string) => visibility,
  isAllowedFileType: () => true,
  isFileSizeAllowed: () => true,
  MAX_FILE_SIZE: 50 * 1024 * 1024,
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

describe('VirtualizedFileGrid', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render files', () => {
    const files = [
      mockGoogleDriveFile({ id: 'file-1', fileName: 'document1.pdf' }),
      mockGoogleDriveFile({ id: 'file-2', fileName: 'document2.pdf' }),
    ];

    render(
      <VirtualizedFileGrid files={files} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('document2.pdf')).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    const files = [mockGoogleDriveFile({ id: 'file-1' })];

    const { container } = render(
      <VirtualizedFileGrid files={files} height={400} />,
      { wrapper: createWrapper() }
    );

    const gridContainer = container.querySelector('.MuiBox-root');
    expect(gridContainer).toHaveStyle({ height: '400px' });
  });

  it('should pass editable props to FileCard', () => {
    const files = [mockGoogleDriveFile({ id: 'file-1', fileName: 'test.pdf' })];

    render(
      <VirtualizedFileGrid
        files={files}
        editable
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    // When editable, should have more menu button
    const buttons = screen.getAllByRole('button');
    // Should have at least 2 buttons (open and menu)
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should render empty grid for empty files array', () => {
    const { container } = render(
      <VirtualizedFileGrid files={[]} />,
      { wrapper: createWrapper() }
    );

    // Grid should still render but be empty
    expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
  });

  it('should render many files efficiently', () => {
    // Generate 100 files
    const files = Array.from({ length: 100 }, (_, i) =>
      mockGoogleDriveFile({ id: `file-${i}`, fileName: `document-${i}.pdf` })
    );

    const { container } = render(
      <VirtualizedFileGrid files={files} height={600} />,
      { wrapper: createWrapper() }
    );

    // Grid should render (virtualized, so not all items visible)
    expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();

    // At least some files should be visible
    expect(screen.getByText('document-0.pdf')).toBeInTheDocument();
  });
});

describe('shouldUseVirtualization', () => {
  it('should return false for file count below threshold', () => {
    expect(shouldUseVirtualization(10)).toBe(false);
    expect(shouldUseVirtualization(49)).toBe(false);
  });

  it('should return true for file count at or above threshold', () => {
    expect(shouldUseVirtualization(VIRTUALIZATION_THRESHOLD)).toBe(true);
    expect(shouldUseVirtualization(100)).toBe(true);
    expect(shouldUseVirtualization(500)).toBe(true);
  });

  it('should return false for zero files', () => {
    expect(shouldUseVirtualization(0)).toBe(false);
  });
});

describe('VIRTUALIZATION_THRESHOLD', () => {
  it('should be defined and be a positive number', () => {
    expect(VIRTUALIZATION_THRESHOLD).toBeDefined();
    expect(typeof VIRTUALIZATION_THRESHOLD).toBe('number');
    expect(VIRTUALIZATION_THRESHOLD).toBeGreaterThan(0);
  });

  it('should be 50', () => {
    expect(VIRTUALIZATION_THRESHOLD).toBe(50);
  });
});
