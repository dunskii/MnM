// ===========================================
// File List Component
// ===========================================
// Display list of Google Drive files with filtering

import { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Link,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useGoogleDriveFiles } from '../../hooks/useGoogleDrive';
import { useLessons } from '../../hooks/useLessons';
import {
  GoogleDriveFile,
  FilesQuery,
  FileVisibility,
  formatSyncTime,
} from '../../api/googleDrive.api';
import {
  formatFileSize,
  getVisibilityColor,
  getVisibilityLabel,
} from '../../api/resources.api';
import FileCard from './FileCard';
import SyncStatusBadge from './SyncStatusBadge';
import VirtualizedFileGrid, { shouldUseVirtualization } from './VirtualizedFileGrid';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// ===========================================
// TYPES
// ===========================================

interface FileListProps {
  lessonId?: string;
  studentId?: string;
  showFilters?: boolean;
  editable?: boolean;
  onEdit?: (file: GoogleDriveFile) => void;
  onDelete?: (file: GoogleDriveFile) => void;
}

type ViewMode = 'grid' | 'list';

// ===========================================
// COMPONENT
// ===========================================

export default function FileList({
  lessonId,
  studentId,
  showFilters = true,
  editable = false,
  onEdit,
  onDelete,
}: FileListProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>(lessonId || '');
  const [visibilityFilter, setVisibilityFilter] = useState<FileVisibility | ''>('');

  // Debounce search
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Build filters
  const filters: FilesQuery = useMemo(() => {
    const f: FilesQuery = {};
    if (lessonId) f.lessonId = lessonId;
    if (studentId) f.studentId = studentId;
    if (lessonFilter && !lessonId) f.lessonId = lessonFilter;
    if (visibilityFilter) f.visibility = visibilityFilter;
    return f;
  }, [lessonId, studentId, lessonFilter, visibilityFilter]);

  // Queries
  const { data: files, isLoading, error } = useGoogleDriveFiles(filters);
  const { data: lessons } = useLessons();

  // Filter files by search query (client-side)
  const filteredFiles = useMemo(() => {
    if (!files) return [];
    if (!debouncedSearch) return files;

    const query = debouncedSearch.toLowerCase();
    return files.filter((file) =>
      file.fileName.toLowerCase().includes(query) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [files, debouncedSearch]);

  // Handlers
  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    if (newMode) setViewMode(newMode);
  };

  const handleLessonFilterChange = (event: SelectChangeEvent) => {
    setLessonFilter(event.target.value);
  };

  const handleVisibilityFilterChange = (event: SelectChangeEvent) => {
    setVisibilityFilter(event.target.value as FileVisibility | '');
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Skeleton variant="rectangular" width={200} height={40} />
            <Skeleton variant="rectangular" width={150} height={40} />
            <Skeleton variant="rectangular" width={150} height={40} />
          </Box>
        )}
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error">
        Failed to load files. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      {showFilters && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          {/* Lesson Filter */}
          {!lessonId && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Lesson</InputLabel>
              <Select
                value={lessonFilter}
                onChange={handleLessonFilterChange}
                label="Lesson"
              >
                <MenuItem value="">All Lessons</MenuItem>
                {lessons?.map((lesson) => (
                  <MenuItem key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Visibility Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibilityFilter}
              onChange={handleVisibilityFilterChange}
              label="Visibility"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ALL">Everyone</MenuItem>
              <MenuItem value="TEACHERS_AND_PARENTS">Teachers & Parents</MenuItem>
              <MenuItem value="TEACHERS_ONLY">Teachers Only</MenuItem>
            </Select>
          </FormControl>

          {/* View Toggle */}
          <Box sx={{ ml: 'auto' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="grid">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list">
                <ListViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      )}

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
        {debouncedSearch && ` matching "${debouncedSearch}"`}
      </Typography>

      {/* Empty state */}
      {filteredFiles.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'grey.50',
          }}
        >
          <FolderIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            No files found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {debouncedSearch
              ? 'Try a different search term'
              : 'Upload files or link a Google Drive folder to see files here'}
          </Typography>
        </Paper>
      )}

      {/* Grid View - Virtualized for large lists */}
      {viewMode === 'grid' && filteredFiles.length > 0 && (
        shouldUseVirtualization(filteredFiles.length) ? (
          <VirtualizedFileGrid
            files={filteredFiles}
            height={600}
            editable={editable}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <Grid container spacing={2}>
            {filteredFiles.map((file) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                <FileCard
                  file={file}
                  editable={editable}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* List View */}
      {viewMode === 'list' && filteredFiles.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Lesson/Student</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {file.fileName}
                      </Typography>
                      {file.folder?.syncStatus && (
                        <SyncStatusBadge
                          status={file.folder.syncStatus}
                          showLabel={false}
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {file.folder?.lesson?.name || file.folder?.student?.firstName || '-'}
                  </TableCell>
                  <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getVisibilityLabel(file.visibility)}
                      size="small"
                      color={getVisibilityColor(file.visibility)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatSyncTime(file.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Open in Drive">
                        <IconButton
                          size="small"
                          component={Link}
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {editable && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => onEdit?.(file)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete?.(file)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
