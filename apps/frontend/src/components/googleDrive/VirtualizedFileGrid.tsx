// ===========================================
// Virtualized File Grid Component
// ===========================================
// Performance-optimized grid for large file lists using react-window v2

import { useMemo, CSSProperties } from 'react';
import { Grid } from 'react-window';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { GoogleDriveFile } from '../../api/googleDrive.api';
import FileCard from './FileCard';

// ===========================================
// TYPES
// ===========================================

interface VirtualizedFileGridProps {
  files: GoogleDriveFile[];
  height?: number;
  editable?: boolean;
  onEdit?: (file: GoogleDriveFile) => void;
  onDelete?: (file: GoogleDriveFile) => void;
}

interface CellProps {
  files: GoogleDriveFile[];
  columnCount: number;
  editable: boolean;
  onEdit?: (file: GoogleDriveFile) => void;
  onDelete?: (file: GoogleDriveFile) => void;
}

// ===========================================
// CONSTANTS
// ===========================================

// Grid item dimensions
const ITEM_HEIGHT = 280;
const GAP = 16;

// Threshold for enabling virtualization
export const VIRTUALIZATION_THRESHOLD = 50;

// ===========================================
// CELL COMPONENT
// ===========================================

function Cell({
  columnIndex,
  rowIndex,
  style,
  files,
  columnCount,
  editable,
  onEdit,
  onDelete,
}: {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  ariaAttributes: {
    'aria-colindex': number;
    role: 'gridcell';
  };
} & CellProps) {
  const index = rowIndex * columnCount + columnIndex;
  const file = files[index];

  // Return empty div for non-existent cells (required by Grid)
  if (!file) {
    return <div style={style} />;
  }

  return (
    <div
      style={{
        ...style,
        left: Number(style.left) + GAP / 2,
        top: Number(style.top) + GAP / 2,
        width: Number(style.width) - GAP,
        height: Number(style.height) - GAP,
      }}
    >
      <FileCard
        file={file}
        editable={editable}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// ===========================================
// COMPONENT
// ===========================================

export default function VirtualizedFileGrid({
  files,
  height = 600,
  editable = false,
  onEdit,
  onDelete,
}: VirtualizedFileGridProps) {
  const theme = useTheme();

  // Responsive column count
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const columnCount = useMemo(() => {
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 3;
    return 4;
  }, [isXs, isSm, isMd]);

  // Calculate dimensions
  const containerWidth = useMemo(() => {
    // Default based on breakpoint
    if (isXs) return 320;
    if (isSm) return 600;
    if (isMd) return 900;
    return 1200;
  }, [isXs, isSm, isMd]);

  const columnWidth = containerWidth / columnCount;
  const rowCount = Math.ceil(files.length / columnCount);

  // Cell props for react-window v2
  const cellProps = useMemo<CellProps>(
    () => ({
      files,
      columnCount,
      editable,
      onEdit,
      onDelete,
    }),
    [files, columnCount, editable, onEdit, onDelete]
  );

  return (
    <Box
      sx={{
        width: '100%',
        height,
        overflow: 'hidden',
      }}
    >
      <Grid
        cellComponent={Cell}
        cellProps={cellProps}
        columnCount={columnCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={ITEM_HEIGHT}
        defaultHeight={height}
        defaultWidth={containerWidth}
        overscanCount={2}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
}

// ===========================================
// HELPER
// ===========================================

/**
 * Determine if virtualization should be used based on file count
 */
export function shouldUseVirtualization(fileCount: number): boolean {
  return fileCount >= VIRTUALIZATION_THRESHOLD;
}
