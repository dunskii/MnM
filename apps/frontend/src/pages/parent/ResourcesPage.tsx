// ===========================================
// Parent Resources Page
// ===========================================
// Parent/student view of shared resources from Google Drive

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
  Typography,
  Paper,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Folder as FolderIcon,
  CloudOff as DisconnectedIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import FileDownloadCard from '../../components/googleDrive/FileDownloadCard';
import { useGoogleDriveFiles, useGoogleDriveAuthStatus } from '../../hooks/useGoogleDrive';
import { useLessons } from '../../hooks/useLessons';
import { useStudents } from '../../hooks/useUsers';
import { GoogleDriveFile, FilesQuery } from '../../api/googleDrive.api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// ===========================================
// COMPONENT
// ===========================================

export default function ResourcesPage() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [lessonFilter, setLessonFilter] = useState<string>('');

  // Debounce search
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Queries
  const { data: authStatus, isLoading: isLoadingAuth } = useGoogleDriveAuthStatus();
  const { data: students, isLoading: isLoadingStudents } = useStudents();
  const { data: lessons } = useLessons();

  // Build filters
  const filters: FilesQuery = useMemo(() => {
    const f: FilesQuery = {};
    if (selectedChild) f.studentId = selectedChild;
    if (lessonFilter) f.lessonId = lessonFilter;
    return f;
  }, [selectedChild, lessonFilter]);

  const { data: files, isLoading: isLoadingFiles, error } = useGoogleDriveFiles(filters);

  const isConnected = authStatus?.isConnected ?? false;

  // Filter files by search query (client-side)
  const filteredFiles = useMemo(() => {
    if (!files) return [];
    if (!debouncedSearch) return files;

    const query = debouncedSearch.toLowerCase();
    return files.filter((file) =>
      file.fileName.toLowerCase().includes(query) ||
      file.folder?.lesson?.name.toLowerCase().includes(query) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [files, debouncedSearch]);

  // Group files by lesson
  const filesByLesson = useMemo(() => {
    const grouped: Record<string, GoogleDriveFile[]> = {};

    filteredFiles.forEach((file) => {
      const lessonName = file.folder?.lesson?.name || 'Other Resources';
      if (!grouped[lessonName]) {
        grouped[lessonName] = [];
      }
      grouped[lessonName].push(file);
    });

    return grouped;
  }, [filteredFiles]);

  // Handle child selection
  const handleChildChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedChild(newValue);
    setLessonFilter('');
  };

  // Handle lesson filter
  const handleLessonFilterChange = (event: SelectChangeEvent) => {
    setLessonFilter(event.target.value);
  };

  // Loading state
  if (isLoadingAuth || isLoadingStudents) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Not connected - show info message
  if (!isConnected) {
    return (
      <Box>
        <PageHeader
          title="Resources"
          subtitle="View lesson materials and resources"
        />
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DisconnectedIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Resources Not Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The school's Google Drive is not connected. Please contact your school administrator.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Resources"
        subtitle="View and download lesson materials and resources"
      />

      {/* Child Selector Tabs (if multiple children) */}
      {students && students.length > 1 && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedChild || false}
            onChange={handleChildChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Children" value="" />
            {students.map((student) => (
              <Tab
                key={student.id}
                label={`${student.firstName} ${student.lastName}`}
                value={student.id}
              />
            ))}
          </Tabs>
        </Paper>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Lesson</InputLabel>
          <Select
            value={lessonFilter}
            onChange={handleLessonFilterChange}
            label="Filter by Lesson"
          >
            <MenuItem value="">All Lessons</MenuItem>
            {lessons?.map((lesson) => (
              <MenuItem key={lesson.id} value={lesson.id}>
                {lesson.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load resources. Please try again later.
        </Alert>
      )}

      {/* Loading state */}
      {isLoadingFiles && (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={240} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Results count */}
      {!isLoadingFiles && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredFiles.length} resource{filteredFiles.length !== 1 ? 's' : ''} available
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </Typography>
      )}

      {/* Empty state */}
      {!isLoadingFiles && filteredFiles.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <FolderIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Resources Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {debouncedSearch
              ? 'Try a different search term'
              : 'Your teacher will upload resources here as they become available'}
          </Typography>
        </Paper>
      )}

      {/* Files grouped by lesson */}
      {!isLoadingFiles && filteredFiles.length > 0 && (
        <Box>
          {Object.entries(filesByLesson).map(([lessonName, lessonFiles]) => (
            <Box key={lessonName} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {lessonName}
              </Typography>
              <Grid container spacing={2}>
                {lessonFiles.map((file) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                    <FileDownloadCard file={file} showLesson={false} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
