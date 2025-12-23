// ===========================================
// Teacher Dashboard Page
// ===========================================
// Dashboard for teachers with attendance, notes, and all school lessons

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../components/common/PageHeader';
import AttendanceMarker from '../../components/attendance/AttendanceMarker';
import NoteEditor from '../../components/notes/NoteEditor';
import { useAuth } from '../../contexts/AuthContext';
import { useLessons, useLessonsByTeacher } from '../../hooks/useLessons';
import { useTeacherPendingNotes, useTeacherWeeklySummary } from '../../hooks/useNotes';
import { useTeachers } from '../../hooks/useUsers';
import { getNoteStatusColor, getNoteStatusLabel } from '../../api/notes.api';
import { Lesson } from '../../api/lessons.api';

// ===========================================
// TYPES
// ===========================================

// ===========================================
// STAT CARD COMPONENT
// ===========================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

function StatCard({ title, value, icon, color = 'primary', loading }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={60} height={40} />
            ) : (
              <Typography variant="h4" component="div" color={`${color}.main`}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

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

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Lessons"
            value={todayLessonsCount}
            icon={<CalendarIcon />}
            loading={myLessonsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Total Lessons"
            value={myLessons?.filter((l) => l.isActive).length || 0}
            icon={<SchoolIcon />}
            loading={myLessonsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Notes"
            value={pendingNotes?.totalPending || 0}
            icon={<EditIcon />}
            color={pendingNotes?.totalPending ? 'warning' : 'success'}
            loading={pendingNotesLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Weekly Completion"
            value={`${weeklySummary?.overallCompletionRate || 100}%`}
            icon={<CheckIcon />}
            color={(weeklySummary?.overallCompletionRate || 100) < 100 ? 'warning' : 'success'}
            loading={weeklySummaryLoading}
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
          <Card>
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
