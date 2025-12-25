// ===========================================
// Lesson Detail Page
// ===========================================
// View lesson details and manage enrollments

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PersonAdd as EnrollIcon,
  PersonRemove as UnenrollIcon,
  Search as SearchIcon,
  School as StudentIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useLesson,
  useLessonEnrollments,
  useLessonCapacity,
  useEnrollStudent,
  useBulkEnrollStudents,
  useUnenrollStudent,
} from '../../hooks/useLessons';
import { useStudents } from '../../hooks/useUsers';
import {
  LessonEnrollment,
  getDayName,
  formatTime,
  getLessonTypeColor,
} from '../../api/lessons.api';
import { Student } from '../../api/users.api';
import FileList from '../../components/googleDrive/FileList';
import DriveFileUploader from '../../components/googleDrive/DriveFileUploader';
import { useGoogleDriveAuthStatus } from '../../hooks/useGoogleDrive';

// ===========================================
// COMPONENT
// ===========================================

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: lessonData, isLoading, error } = useLesson(id || '');
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useLessonEnrollments(id || '');
  const { data: capacityData } = useLessonCapacity(id || '');
  const { data: studentsData } = useStudents();
  const { data: driveAuthStatus } = useGoogleDriveAuthStatus();

  // State for file uploader
  const [uploaderOpen, setUploaderOpen] = useState(false);

  const isDriveConnected = driveAuthStatus?.isConnected ?? false;

  const lesson = lessonData;
  const enrollments = enrollmentsData ?? [];
  const capacity = capacityData;
  const allStudents = studentsData ?? [];

  // Get students not already enrolled (types inferred from React Query select)
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student.id));
  const availableStudents = allStudents.filter(
    (s) => !enrolledStudentIds.has(s.id) && s.isActive
  );

  // Mutations
  const enrollMutation = useEnrollStudent();
  const bulkEnrollMutation = useBulkEnrollStudents();
  const unenrollMutation = useUnenrollStudent();

  // Enrollment modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Unenroll confirmation state
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState<LessonEnrollment | null>(null);

  // Filter students by search (types inferred from availableStudents)
  const filteredStudents = availableStudents.filter((student) => {
    const searchLower = studentSearch.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower)
    );
  });

  // Handlers
  const handleBack = () => {
    navigate('/admin/lessons');
  };

  const handleEdit = () => {
    // Navigate back to lessons page in edit mode (or could open modal)
    navigate('/admin/lessons', { state: { editLessonId: lesson?.id } });
  };

  const handleOpenEnrollModal = () => {
    setSelectedStudents([]);
    setStudentSearch('');
    setEnrollModalOpen(true);
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleEnrollStudents = async () => {
    if (!id || selectedStudents.length === 0) return;

    try {
      if (selectedStudents.length === 1) {
        await enrollMutation.mutateAsync({
          lessonId: id,
          studentId: selectedStudents[0],
        });
      } else {
        await bulkEnrollMutation.mutateAsync({
          lessonId: id,
          studentIds: selectedStudents,
        });
      }
      setEnrollModalOpen(false);
      setSelectedStudents([]);
    } catch {
      // Error handled by mutation
    }
  };

  const handleUnenroll = (enrollment: LessonEnrollment) => {
    setStudentToUnenroll(enrollment);
    setUnenrollDialogOpen(true);
  };

  const handleConfirmUnenroll = async () => {
    if (!id || !studentToUnenroll) return;

    try {
      await unenrollMutation.mutateAsync({
        lessonId: id,
        studentId: studentToUnenroll.student.id,
      });
      setUnenrollDialogOpen(false);
      setStudentToUnenroll(null);
    } catch {
      // Error handled by mutation
    }
  };

  const isEnrollLoading = enrollMutation.isPending || bulkEnrollMutation.isPending;
  const isUnenrollLoading = unenrollMutation.isPending;

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ? 'Failed to load lesson details.' : 'Lesson not found.'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Back to Lessons
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={lesson.name}
        subtitle={`${getDayName(lesson.dayOfWeek)} ${formatTime(lesson.startTime)} - ${formatTime(lesson.endTime)}`}
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lessons', path: '/admin/lessons' },
          { label: lesson.name },
        ]}
      />

      <Box sx={{ mb: 2 }}>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Button startIcon={<EditIcon />} variant="outlined" onClick={handleEdit}>
          Edit Lesson
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lesson Details Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lesson Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Box>
                  <Chip
                    label={lesson.lessonType.type}
                    size="small"
                    color={getLessonTypeColor(lesson.lessonType.type)}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box>
                  <Chip
                    label={lesson.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={lesson.isActive ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Day & Time
                </Typography>
                <Typography>
                  {getDayName(lesson.dayOfWeek)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography>{lesson.durationMins} minutes</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Teacher
                </Typography>
                <Typography>
                  {lesson.teacher.user.firstName} {lesson.teacher.user.lastName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography>{lesson.room.location.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {lesson.room.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Term
                </Typography>
                <Typography>{lesson.term.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Instrument
                </Typography>
                <Typography>{lesson.instrument?.name || 'Not specified'}</Typography>
              </Grid>
              {lesson.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography>{lesson.description}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Hybrid Pattern Card (if applicable) */}
        {lesson.hybridPattern && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hybrid Pattern
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Pattern Type
                  </Typography>
                  <Typography>{lesson.hybridPattern.patternType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Individual Slot Duration
                  </Typography>
                  <Typography>{lesson.hybridPattern.individualSlotDuration} mins</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Group Weeks
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(lesson.hybridPattern.groupWeeks as number[]).map((week) => (
                      <Chip key={week} label={`W${week}`} size="small" color="success" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Individual Weeks
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(lesson.hybridPattern.individualWeeks as number[]).map((week) => (
                      <Chip key={week} label={`W${week}`} size="small" color="primary" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Booking Deadline
                  </Typography>
                  <Typography>{lesson.hybridPattern.bookingDeadlineHours} hours before</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Bookings Status
                  </Typography>
                  <Chip
                    label={lesson.hybridPattern.bookingsOpen ? 'Open' : 'Closed'}
                    size="small"
                    color={lesson.hybridPattern.bookingsOpen ? 'success' : 'default'}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Enrollments Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  Enrolled Students
                </Typography>
                {capacity && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(capacity.current / capacity.max) * 100}
                      sx={{ width: 100 }}
                      color={capacity.available <= 0 ? 'error' : capacity.current > 0 ? 'success' : 'primary'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {capacity.current}/{capacity.max} enrolled ({capacity.available} spots available)
                    </Typography>
                  </Box>
                )}
              </Box>
              <Button
                startIcon={<EnrollIcon />}
                variant="contained"
                onClick={handleOpenEnrollModal}
                disabled={capacity?.available === 0}
              >
                Enroll Student
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {enrollmentsLoading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : enrollments.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <StudentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  No students enrolled yet. Click "Enroll Student" to add students.
                </Typography>
              </Box>
            ) : (
              <List>
                {enrollments.map((enrollment: LessonEnrollment) => (
                  <ListItem key={enrollment.id} divider>
                    <ListItemText
                      primary={`${enrollment.student.firstName} ${enrollment.student.lastName}`}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={enrollment.student.ageGroup}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Unenroll Student">
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleUnenroll(enrollment)}
                        >
                          <UnenrollIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Lesson Resources Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Lesson Resources
              </Typography>
              {isDriveConnected && (
                <Button
                  variant="contained"
                  onClick={() => setUploaderOpen(true)}
                >
                  Upload Resource
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {!isDriveConnected ? (
              <Alert severity="info">
                Google Drive is not connected. Connect Google Drive in{' '}
                <Button
                  size="small"
                  onClick={() => navigate('/admin/google-drive')}
                  sx={{ ml: 1 }}
                >
                  Settings
                </Button>
              </Alert>
            ) : (
              <FileList
                lessonId={id}
                editable
                showFilters={false}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* File Uploader Modal */}
      {isDriveConnected && (
        <DriveFileUploader
          open={uploaderOpen}
          onClose={() => setUploaderOpen(false)}
          lessonId={id}
        />
      )}

      {/* Enroll Students Modal */}
      <Dialog
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enroll Students</DialogTitle>
        <DialogContent>
          <TextField
            placeholder="Search students..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1, mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {capacity && capacity.available < selectedStudents.length && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You've selected more students than available spots ({capacity.available}).
            </Alert>
          )}

          {filteredStudents.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              {studentSearch
                ? 'No students match your search.'
                : 'All eligible students are already enrolled.'}
            </Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredStudents.map((student: Student) => (
                <ListItem key={student.id} dense>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleToggleStudent(student.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography>
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.ageGroup}
                          {student.family && ` - ${student.family.name}`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollModalOpen(false)} disabled={isEnrollLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEnrollStudents}
            disabled={selectedStudents.length === 0 || isEnrollLoading}
          >
            {isEnrollLoading
              ? 'Enrolling...'
              : `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unenroll Confirmation */}
      <ConfirmDialog
        open={unenrollDialogOpen}
        title="Unenroll Student"
        message={`Are you sure you want to unenroll ${studentToUnenroll?.student.firstName} ${studentToUnenroll?.student.lastName} from this lesson?`}
        confirmLabel="Unenroll"
        confirmColor="error"
        loading={isUnenrollLoading}
        onConfirm={handleConfirmUnenroll}
        onCancel={() => setUnenrollDialogOpen(false)}
      />
    </Box>
  );
}
