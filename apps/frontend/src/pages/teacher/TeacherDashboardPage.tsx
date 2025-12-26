// ===========================================
// Teacher Dashboard Page
// ===========================================
// Dashboard for teachers with attendance, notes, files, and M&G

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Skeleton,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  InsertDriveFile as FileIcon,
  Handshake as MeetAndGreetIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import AttendanceMarker from '../../components/attendance/AttendanceMarker';
import NoteEditor from '../../components/notes/NoteEditor';
import { StatWidget } from '../../components/dashboard/StatWidget';
import { useAuth } from '../../contexts/AuthContext';
import { useLessons, useLessonsByTeacher } from '../../hooks/useLessons';
import { useTeacherPendingNotes, useTeacherWeeklySummary } from '../../hooks/useNotes';
import { useTeacherRecentFiles, useAssignedMeetAndGreets } from '../../hooks/useDashboard';
import { useTeachers } from '../../hooks/useUsers';
import { getNoteStatusColor, getNoteStatusLabel } from '../../api/notes.api';
import { Lesson } from '../../api/lessons.api';

// ===========================================
// TYPES
// ===========================================

// File icon helper for MIME types
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  return '📁';
};

// ===========================================
// TODAY'S LESSONS COMPONENT
// ===========================================

interface TodayLessonsProps {
  lessons: Lesson[];
  onMarkAttendance: (lesson: Lesson) => void;
  onEditNotes: (lesson: Lesson) => void;
}

function TodayLessons({ lessons, onMarkAttendance, onEditNotes }: TodayLessonsProps) {
  const todayDayOfWeek = new Date().getDay();
  const todayLessons = lessons.filter((l) => l.dayOfWeek === todayDayOfWeek && l.isActive);

  if (todayLessons.length === 0) {
    return (
      <Alert severity="info">No lessons scheduled for today.</Alert>
    );
  }

  return (
    <List>
      {todayLessons.map((lesson) => (
        <ListItem
          key={lesson.id}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            '&:last-child': { mb: 0 },
          }}
        >
          <ListItemText
            primary={
              <Typography variant="subtitle1" fontWeight="medium">
                {lesson.name}
              </Typography>
            }
            secondary={
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  icon={<ScheduleIcon />}
                  label={`${lesson.startTime} - ${lesson.endTime}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={lesson.lessonType?.name || 'Unknown'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${lesson._count?.enrollments || 0} students`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            }
          />
          <ListItemSecondaryAction>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckIcon />}
                onClick={() => onMarkAttendance(lesson)}
              >
                Attendance
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEditNotes(lesson)}
              >
                Notes
              </Button>
            </Stack>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}

// ===========================================
// ALL LESSONS TABLE COMPONENT
// ===========================================

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AllLessonsListProps {
  lessons: Lesson[];
  isLoading: boolean;
  onMarkAttendance: (lesson: Lesson) => void;
  onEditNotes: (lesson: Lesson) => void;
}

function AllLessonsList({ lessons, isLoading, onMarkAttendance, onEditNotes }: AllLessonsListProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  if (isLoading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  const filteredLessons = selectedDay === 'all'
    ? lessons.filter((l) => l.isActive)
    : lessons.filter((l) => l.isActive && l.dayOfWeek === selectedDay);

  // Sort by day of week, then by start time
  const sortedLessons = [...filteredLessons].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Box>
      <Tabs
        value={selectedDay}
        onChange={(_, v) => setSelectedDay(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab value="all" label="All Days" />
        {dayNames.map((day, index) => (
          <Tab key={day} value={index} label={day} />
        ))}
      </Tabs>

      {sortedLessons.length === 0 ? (
        <Alert severity="info">No lessons found.</Alert>
      ) : (
        <List>
          {sortedLessons.map((lesson) => (
            <ListItem
              key={lesson.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {lesson.name}
                    </Typography>
                    <Chip
                      label={dayNames[lesson.dayOfWeek]}
                      size="small"
                      color={lesson.dayOfWeek === new Date().getDay() ? 'primary' : 'default'}
                    />
                  </Box>
                }
                secondary={
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={`${lesson.startTime} - ${lesson.endTime}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={lesson.teacher?.user?.firstName + ' ' + lesson.teacher?.user?.lastName}
                      size="small"
                      variant="outlined"
                      icon={<PersonIcon />}
                    />
                    <Chip
                      label={lesson.room?.name}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${lesson._count?.enrollments || 0} students`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CheckIcon />}
                    onClick={() => onMarkAttendance(lesson)}
                  >
                    Attendance
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => onEditNotes(lesson)}
                  >
                    Notes
                  </Button>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for modals
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Find teacher ID from user
  const { data: teachers } = useTeachers();
  const teacher = teachers?.find((t) => t.userId === user?.id);

  // Queries
  const { data: myLessons, isLoading: myLessonsLoading } = useLessonsByTeacher(teacher?.id || '');
  const { data: allLessons, isLoading: allLessonsLoading } = useLessons();
  const { data: pendingNotes, isLoading: pendingNotesLoading } = useTeacherPendingNotes(
    teacher?.id || ''
  );
  const { data: weeklySummary, isLoading: weeklySummaryLoading } = useTeacherWeeklySummary(
    teacher?.id || ''
  );

  // New dashboard hooks for files and M&G
  const { data: recentFiles, isLoading: filesLoading } = useTeacherRecentFiles(5);
  const { data: assignedMeetAndGreets, isLoading: meetAndGreetsLoading } = useAssignedMeetAndGreets(5);

  // Handle mark attendance
  const handleMarkAttendance = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedDate(new Date());
    setAttendanceModalOpen(true);
  };

  // Handle edit notes
  const handleEditNotes = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedDate(new Date());
    setNotesModalOpen(true);
  };

  // Close modals
  const handleCloseAttendance = () => {
    setAttendanceModalOpen(false);
    setSelectedLesson(null);
  };

  const handleCloseNotes = () => {
    setNotesModalOpen(false);
    setSelectedLesson(null);
  };

  const todayDayOfWeek = new Date().getDay();
  const todayLessonsCount = myLessons?.filter(
    (l) => l.dayOfWeek === todayDayOfWeek && l.isActive
  ).length || 0;

  return (
    <Box>
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}!`}
      />

      {/* Stats Row - Using new StatWidget */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Today's Lessons"
            value={todayLessonsCount}
            icon={<CalendarIcon />}
            color="primary"
            loading={myLessonsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="My Lessons"
            value={myLessons?.filter((l) => l.isActive).length || 0}
            icon={<SchoolIcon />}
            color="secondary"
            loading={myLessonsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Pending Notes"
            value={pendingNotes?.totalPending || 0}
            icon={<EditIcon />}
            color={pendingNotes?.totalPending ? 'warning' : 'success'}
            loading={pendingNotesLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Completion"
            value={`${weeklySummary?.overallCompletionRate || 100}%`}
            icon={<CheckIcon />}
            color={(weeklySummary?.overallCompletionRate || 100) < 100 ? 'warning' : 'success'}
            subtitle="This week"
            loading={weeklySummaryLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Recent Files"
            value={recentFiles?.length || 0}
            icon={<UploadIcon />}
            color="info"
            subtitle="Last 7 days"
            loading={filesLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Meet & Greets"
            value={assignedMeetAndGreets?.length || 0}
            icon={<MeetAndGreetIcon />}
            color={(assignedMeetAndGreets?.length || 0) > 0 ? 'warning' : 'success'}
            subtitle="Assigned to you"
            loading={meetAndGreetsLoading}
          />
        </Grid>
      </Grid>

      {/* Pending Notes Alert */}
      {pendingNotes && pendingNotes.totalPending > 0 && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          You have {pendingNotes.totalPending} lesson(s) with incomplete notes.
          {pendingNotes.pendingClassNotes > 0 && ` ${pendingNotes.pendingClassNotes} class note(s) missing.`}
          {pendingNotes.pendingStudentNotes > 0 && ` ${pendingNotes.pendingStudentNotes} student note(s) missing.`}
          Notes must be completed by end of week.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Today's Lessons */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Today's Lessons ({format(new Date(), 'EEEE, MMMM d')})
              </Typography>
              <Divider sx={{ my: 2 }} />
              {myLessonsLoading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TodayLessons
                  lessons={myLessons || []}
                  onMarkAttendance={handleMarkAttendance}
                  onEditNotes={handleEditNotes}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Progress */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Weekly Note Progress
              </Typography>
              <Divider sx={{ my: 2 }} />
              {weeklySummaryLoading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : weeklySummary ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">Overall Completion:</Typography>
                    <Chip
                      label={`${weeklySummary.overallCompletionRate}%`}
                      color={weeklySummary.overallCompletionRate === 100 ? 'success' : 'warning'}
                    />
                  </Box>
                  <List dense>
                    {weeklySummary.lessons.slice(0, 5).map((lesson) => (
                      <ListItem key={lesson.lessonId} sx={{ px: 0 }}>
                        <ListItemText
                          primary={lesson.lessonName}
                          secondary={
                            lesson.dates.length > 0
                              ? `${format(new Date(lesson.dates[0].date), 'EEEE')}`
                              : 'No sessions this week'
                          }
                        />
                        {lesson.dates.length > 0 && (
                          <Chip
                            label={getNoteStatusLabel(lesson.dates[0].status)}
                            color={getNoteStatusColor(lesson.dates[0].status)}
                            size="small"
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Alert severity="info">No weekly data available.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recently Uploaded Files */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadIcon color="primary" />
                  <Typography variant="h6">Recently Uploaded Files</Typography>
                </Box>
              }
              action={
                <Button
                  size="small"
                  onClick={() => navigate('/admin/google-drive')}
                >
                  View All
                </Button>
              }
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mx: 2, mt: 2 }} />
            <CardContent>
              {filesLoading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : recentFiles && recentFiles.length > 0 ? (
                <List disablePadding>
                  {recentFiles.map((file) => (
                    <ListItem key={file.id} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: '#a3d9f6',
                            color: '#4580E4',
                            width: 40,
                            height: 40,
                            fontSize: '1.2rem',
                          }}
                        >
                          {getFileIcon(file.mimeType)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {file.fileName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {file.lessonName || file.studentName || 'General'} •{' '}
                            {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <FileIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    No files uploaded recently
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/admin/google-drive')}
                  >
                    Upload Files
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Assigned Meet & Greets */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MeetAndGreetIcon color="primary" />
                  <Typography variant="h6">Assigned Meet & Greets</Typography>
                </Box>
              }
              action={
                assignedMeetAndGreets && assignedMeetAndGreets.length > 0 && (
                  <Chip
                    label={`${assignedMeetAndGreets.length} pending`}
                    size="small"
                    sx={{
                      bgcolor: '#ffd4cc',
                      color: '#e67761',
                      fontWeight: 600,
                    }}
                  />
                )
              }
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mx: 2, mt: 2 }} />
            <CardContent>
              {meetAndGreetsLoading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : assignedMeetAndGreets && assignedMeetAndGreets.length > 0 ? (
                <List disablePadding>
                  {assignedMeetAndGreets.map((mg) => (
                    <ListItem key={mg.id} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: mg.status === 'APPROVED' ? '#c5ebe2' : '#ffd4cc',
                            color: mg.status === 'APPROVED' ? '#5cb399' : '#e67761',
                            width: 40,
                            height: 40,
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {mg.studentName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {mg.scheduledDateTime
                              ? format(new Date(mg.scheduledDateTime), 'MMM d, yyyy h:mm a')
                              : 'Not yet scheduled'}
                          </Typography>
                        }
                      />
                      <Chip
                        label={mg.status === 'APPROVED' ? 'Scheduled' : 'Pending'}
                        size="small"
                        sx={{
                          bgcolor: mg.status === 'APPROVED' ? '#c5ebe2' : '#FFE066',
                          color: mg.status === 'APPROVED' ? '#5cb399' : '#E6B800',
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <MeetAndGreetIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    No meet & greets assigned to you
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Check back later for new assignments
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All School Lessons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                All School Lessons
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can mark attendance for any lesson (for coverage).
              </Typography>
              <Divider sx={{ my: 2 }} />
              <AllLessonsList
                lessons={allLessons || []}
                isLoading={allLessonsLoading}
                onMarkAttendance={handleMarkAttendance}
                onEditNotes={handleEditNotes}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance Modal */}
      <Dialog
        open={attendanceModalOpen}
        onClose={handleCloseAttendance}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Mark Attendance</Typography>
            <IconButton onClick={handleCloseAttendance}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLesson && (
            <AttendanceMarker
              lessonId={selectedLesson.id}
              lessonName={selectedLesson.name}
              date={selectedDate}
              onClose={handleCloseAttendance}
              onSaved={handleCloseAttendance}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog
        open={notesModalOpen}
        onClose={handleCloseNotes}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Teacher Notes</Typography>
            <IconButton onClick={handleCloseNotes}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLesson && (
            <NoteEditor
              lessonId={selectedLesson.id}
              lessonName={selectedLesson.name}
              date={selectedDate}
              onClose={handleCloseNotes}
              onSaved={handleCloseNotes}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
