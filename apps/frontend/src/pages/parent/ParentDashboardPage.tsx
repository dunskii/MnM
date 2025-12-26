// ===========================================
// Parent Dashboard Page
// ===========================================
// Dashboard for parents with family overview, schedules, notes, and resources

import { useState, useMemo, useEffect } from 'react';
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
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  Divider,
  Skeleton,
  Stack,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  InsertDriveFile as FileIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { format, isSameDay, addDays, startOfWeek, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { StatWidget } from '../../components/dashboard/StatWidget';
import { CharacterIllustration, getAgeGroupFromBirthDate } from '../../components/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useLessons } from '../../hooks/useLessons';
import { useMyBookings } from '../../hooks/useHybridBooking';
import { useNotesByStudent } from '../../hooks/useNotes';
import { useResourcesByStudent } from '../../hooks/useResources';
import { useStudents } from '../../hooks/useUsers';
import { useParentSharedFiles, formatCurrency as formatDashboardCurrency } from '../../hooks/useDashboard';
import { HybridBooking, formatTimeSlot, getBookingStatusColor } from '../../api/hybridBooking.api';
import { Note } from '../../api/notes.api';
import { Resource, formatFileSize } from '../../api/resources.api';
import { Lesson, getDayName, formatTime } from '../../api/lessons.api';
import { useParentInvoices } from '../../hooks/useInvoices';
import { Invoice, InvoiceStatus } from '../../api/invoices.api';

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
// STUDENT SELECTOR TAB
// ===========================================

interface StudentSelectorProps {
  students: Array<{ id: string; firstName: string; lastName: string }>;
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
}

function StudentSelector({ students, selectedStudentId, onSelectStudent }: StudentSelectorProps) {
  if (students.length <= 1) return null;

  return (
    <Tabs
      value={selectedStudentId}
      onChange={(_, value) => onSelectStudent(value)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 3 }}
    >
      {students.map((student) => (
        <Tab
          key={student.id}
          value={student.id}
          label={`${student.firstName} ${student.lastName}`}
          icon={<PersonIcon />}
          iconPosition="start"
        />
      ))}
    </Tabs>
  );
}

// ===========================================
// UPCOMING SCHEDULE COMPONENT
// ===========================================

interface UpcomingScheduleProps {
  lessons: Lesson[];
  bookings: HybridBooking[];
  studentId: string;
  isLoading: boolean;
}

function UpcomingSchedule({ lessons, bookings, studentId, isLoading }: UpcomingScheduleProps) {
  if (isLoading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  const today = new Date();

  // Filter lessons for this student's enrollment
  const studentLessons = lessons.filter((lesson) =>
    lesson.enrollments?.some((e) => e.studentId === studentId && e.isActive)
  );

  // Get upcoming bookings (not cancelled, future dates)
  const upcomingBookings = bookings
    .filter(
      (b) =>
        b.studentId === studentId &&
        b.status !== 'CANCELLED' &&
        new Date(b.scheduledDate) >= today
    )
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  // Generate weekly schedule
  const weekStart = startOfWeek(today);
  const weekSchedule = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(weekStart, i);
    const dayOfWeek = dayDate.getDay();
    const dayLessons = studentLessons.filter((l) => l.dayOfWeek === dayOfWeek && l.isActive);
    const dayBookings = upcomingBookings.filter((b) =>
      isSameDay(new Date(b.scheduledDate), dayDate)
    );

    if (dayLessons.length > 0 || dayBookings.length > 0) {
      weekSchedule.push({
        date: dayDate,
        dayName: getDayName(dayOfWeek),
        lessons: dayLessons,
        bookings: dayBookings,
        isToday: isSameDay(dayDate, today),
      });
    }
  }

  if (weekSchedule.length === 0) {
    return <Alert severity="info">No lessons scheduled this week.</Alert>;
  }

  return (
    <List disablePadding>
      {weekSchedule.map(({ date, dayName, lessons: dayLessons, bookings: dayBookings, isToday }) => (
        <Box key={date.toISOString()} sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            color={isToday ? 'primary.main' : 'text.secondary'}
            sx={{ fontWeight: isToday ? 'bold' : 'normal', mb: 1 }}
          >
            {dayName} {format(date, 'MMM d')} {isToday && '(Today)'}
          </Typography>

          {dayLessons.map((lesson) => (
            <Paper key={lesson.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {lesson.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)} |{' '}
                    {lesson.room?.name}
                  </Typography>
                </Box>
                <Chip
                  label={lesson.lessonType?.name || 'Lesson'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Paper>
          ))}

          {dayBookings.map((booking) => (
            <Paper key={booking.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {booking.lesson?.name || 'Individual Session'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTimeSlot(booking.startTime, booking.endTime)} | Week {booking.weekNumber}
                  </Typography>
                </Box>
                <Chip
                  label={booking.status}
                  size="small"
                  color={getBookingStatusColor(booking.status)}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      ))}
    </List>
  );
}

// ===========================================
// RECENT NOTES COMPONENT
// ===========================================

interface RecentNotesProps {
  notes: Note[];
  isLoading: boolean;
  onViewAll: () => void;
}

function RecentNotes({ notes, isLoading, onViewAll }: RecentNotesProps) {
  if (isLoading) {
    return <Skeleton variant="rectangular" height={150} />;
  }

  // Show only recent public notes (not private)
  const recentNotes = notes
    .filter((n) => !n.isPrivate)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recentNotes.length === 0) {
    return <Alert severity="info">No notes from teachers yet.</Alert>;
  }

  return (
    <Box>
      <List disablePadding>
        {recentNotes.map((note) => (
          <Paper key={note.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">
                {note.lesson?.name || 'General Note'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(note.createdAt), 'MMM d, yyyy')}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {note.content}
            </Typography>
            <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
              By {note.author?.firstName} {note.author?.lastName}
            </Typography>
          </Paper>
        ))}
      </List>
      {notes.filter((n) => !n.isPrivate).length > 5 && (
        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={onViewAll}>
          View All Notes
        </Button>
      )}
    </Box>
  );
}

// ===========================================
// RECENT RESOURCES COMPONENT
// ===========================================

interface RecentResourcesProps {
  resources: Resource[];
  isLoading: boolean;
  onViewAll: () => void;
}

function RecentResources({ resources, isLoading, onViewAll }: RecentResourcesProps) {
  if (isLoading) {
    return <Skeleton variant="rectangular" height={150} />;
  }

  const recentResources = resources
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recentResources.length === 0) {
    return <Alert severity="info">No shared resources yet.</Alert>;
  }

  return (
    <Box>
      <List disablePadding>
        {recentResources.map((resource) => (
          <ListItem
            key={resource.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              px: 2,
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <FolderIcon color="primary" />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={resource.fileName}
              secondary={
                <>
                  {resource.lesson?.name || 'General'} |{' '}
                  {formatFileSize(resource.fileSize)} |{' '}
                  {format(new Date(resource.createdAt), 'MMM d')}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      {resources.length > 5 && (
        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={onViewAll}>
          View All Resources
        </Button>
      )}
    </Box>
  );
}

// ===========================================
// INVOICES WIDGET COMPONENT
// ===========================================

interface InvoicesWidgetProps {
  invoices: Invoice[];
  isLoading: boolean;
  onViewAll: () => void;
  onPay: () => void;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(num);
}

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  DRAFT: { bg: '#FCF6E6', text: '#9DA5AF' },
  SENT: { bg: '#a3d9f6', text: '#4580E4' },
  PAID: { bg: '#96DAC9', text: '#080808' },
  PARTIALLY_PAID: { bg: '#FFCE00', text: '#080808' },
  OVERDUE: { bg: '#FFAE9E', text: '#ff4040' },
  CANCELLED: { bg: '#e0e0e0', text: '#9DA5AF' },
  REFUNDED: { bg: '#e0e0e0', text: '#9DA5AF' },
};

function InvoicesWidget({ invoices, isLoading, onViewAll, onPay }: InvoicesWidgetProps) {
  if (isLoading) {
    return <Skeleton variant="rectangular" height={150} />;
  }

  // Filter to unpaid invoices
  const unpaidInvoices = invoices.filter(
    (i) => i.status === 'SENT' || i.status === 'PARTIALLY_PAID' || i.status === 'OVERDUE'
  );

  const totalOutstanding = unpaidInvoices.reduce(
    (sum, i) => sum + parseFloat(i.total) - parseFloat(i.amountPaid),
    0
  );

  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  if (unpaidInvoices.length === 0) {
    return (
      <Alert severity="success" icon={<ReceiptIcon />}>
        All invoices are paid! No outstanding balance.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Outstanding Balance Summary */}
      <Box
        sx={{
          p: 2,
          bgcolor: overdueCount > 0 ? '#FFAE9E' : '#FCF6E6',
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Outstanding Balance
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalOutstanding)}
            </Typography>
            {overdueCount > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${overdueCount} overdue`}
                color="error"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PaymentIcon />}
            onClick={onPay}
          >
            Pay Now
          </Button>
        </Box>
      </Box>

      {/* Recent Invoices List */}
      <List disablePadding>
        {unpaidInvoices.slice(0, 3).map((invoice) => (
          <Paper key={invoice.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {invoice.invoiceNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {invoice.description || invoice.term?.name || 'Invoice'} | Due:{' '}
                  {format(new Date(invoice.dueDate), 'MMM d')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(parseFloat(invoice.total) - parseFloat(invoice.amountPaid))}
                </Typography>
                <Chip
                  label={invoice.status.replace('_', ' ')}
                  size="small"
                  sx={{
                    backgroundColor: STATUS_COLORS[invoice.status].bg,
                    color: STATUS_COLORS[invoice.status].text,
                    fontSize: '0.65rem',
                  }}
                />
              </Box>
            </Box>
          </Paper>
        ))}
      </List>

      {unpaidInvoices.length > 3 && (
        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={onViewAll}>
          View All ({unpaidInvoices.length} invoices)
        </Button>
      )}
    </Box>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get students for this parent
  const { data: allStudents, isLoading: studentsLoading } = useStudents();

  // Filter to only students linked to this parent's family
  // In a real implementation, this would use the parent's familyId
  const myStudents = useMemo(() => {
    // For now, show all students (would be filtered by family in production)
    return allStudents?.filter((s) => s.isActive) || [];
  }, [allStudents]);

  // Selected student state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Set initial selected student when data loads
  useEffect(() => {
    if (!selectedStudentId && myStudents.length > 0) {
      setSelectedStudentId(myStudents[0].id);
    }
  }, [selectedStudentId, myStudents]);

  // Queries for selected student
  const { data: lessonsData, isLoading: lessonsLoading } = useLessons({ isActive: true });
  const { data: bookingsData, isLoading: bookingsLoading } = useMyBookings();
  const { data: notesData, isLoading: notesLoading } = useNotesByStudent(selectedStudentId);
  const { data: resourcesData, isLoading: resourcesLoading } = useResourcesByStudent(selectedStudentId);
  const { data: invoicesData, isLoading: invoicesLoading } = useParentInvoices();
  const { data: sharedFiles, isLoading: filesLoading } = useParentSharedFiles(5);

  // Get selected student info for character
  const selectedStudent = myStudents.find((s) => s.id === selectedStudentId);
  const studentAgeGroup = selectedStudent?.birthDate
    ? getAgeGroupFromBirthDate(selectedStudent.birthDate)
    : selectedStudent?.ageGroup || 'KIDS';

  // Calculate stats
  const todayDayOfWeek = new Date().getDay();
  const studentLessons = lessonsData?.filter((lesson) =>
    lesson.enrollments?.some((e) => e.studentId === selectedStudentId && e.isActive)
  ) || [];
  const todayLessons = studentLessons.filter((l) => l.dayOfWeek === todayDayOfWeek);
  const upcomingBookings = bookingsData?.filter(
    (b) =>
      b.studentId === selectedStudentId &&
      b.status !== 'CANCELLED' &&
      new Date(b.scheduledDate) >= new Date()
  ) || [];
  const unreadNotes = notesData?.filter((n) => !n.isPrivate) || [];

  // Calculate outstanding payments
  const unpaidInvoices = invoicesData?.filter(
    (i) => i.status === 'SENT' || i.status === 'PARTIALLY_PAID' || i.status === 'OVERDUE'
  ) || [];
  const totalOutstanding = unpaidInvoices.reduce(
    (sum, i) => sum + (parseFloat(i.total) - parseFloat(i.amountPaid)),
    0
  );
  const overdueCount = invoicesData?.filter((i) => i.status === 'OVERDUE').length || 0;

  const isLoading = studentsLoading || lessonsLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  if (myStudents.length === 0) {
    return (
      <Box>
        <PageHeader
          title="Parent Dashboard"
          subtitle={`Welcome${user?.firstName ? `, ${user.firstName}` : ''}!`}
        />
        <Alert severity="info">
          No students found in your family. Please contact the school to enroll your children.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Parent Dashboard"
        subtitle={`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}!`}
      />

      {/* Student Selector (if multiple children) */}
      <StudentSelector
        students={myStudents}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
      />

      {/* Stats Row - Using StatWidget */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Today"
            value={todayLessons.length}
            icon={<CalendarIcon />}
            color="primary"
            subtitle="Lessons today"
            loading={lessonsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Enrolled"
            value={studentLessons.length}
            icon={<SchoolIcon />}
            color="secondary"
            subtitle="Active lessons"
            loading={lessonsLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Bookings"
            value={upcomingBookings.length}
            icon={<EventIcon />}
            color="info"
            subtitle="Upcoming"
            loading={bookingsLoading}
            href="/parent/hybrid-booking"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Outstanding"
            value={formatDashboardCurrency(totalOutstanding * 100)}
            icon={<PaymentIcon />}
            color={overdueCount > 0 ? 'error' : totalOutstanding > 0 ? 'warning' : 'success'}
            subtitle={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
            loading={invoicesLoading}
            href="/parent/invoices"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Notes"
            value={unreadNotes.length}
            icon={<DescriptionIcon />}
            color="success"
            subtitle="From teachers"
            loading={notesLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Resources"
            value={sharedFiles?.length || 0}
            icon={<FolderIcon />}
            color="info"
            subtitle="Shared files"
            loading={filesLoading}
            href="/parent/resources"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Weekly Schedule */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  This Week's Schedule
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <UpcomingSchedule
                lessons={lessonsData || []}
                bookings={bookingsData || []}
                studentId={selectedStudentId}
                isLoading={lessonsLoading || bookingsLoading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Invoices */}
        <Grid item xs={12} lg={6}>
          {/* Invoices Widget */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Invoices & Payments
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InvoicesWidget
                invoices={invoicesData || []}
                isLoading={invoicesLoading}
                onViewAll={() => navigate('/parent/invoices')}
                onPay={() => navigate('/parent/invoices')}
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  startIcon={<EventIcon />}
                  onClick={() => navigate('/parent/hybrid-booking')}
                >
                  Book Individual Session
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate('/parent/invoices')}
                >
                  View Invoices
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FolderIcon />}
                  onClick={() => navigate('/parent/resources')}
                >
                  View Resources
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Teacher Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <RecentNotes
                notes={notesData || []}
                isLoading={notesLoading}
                onViewAll={() => {}}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Student Profile Card with Character */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              {selectedStudent && (
                <>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <CharacterIllustration
                      ageGroup={studentAgeGroup}
                      size="large"
                      withName
                      withLabel
                      showTooltip={false}
                    />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {studentLessons.length} enrolled lesson{studentLessons.length !== 1 ? 's' : ''}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Shared Files from Drive */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DownloadIcon color="primary" />
                  <Typography variant="h6">Shared Files</Typography>
                </Box>
              }
              action={
                <Button
                  size="small"
                  onClick={() => navigate('/parent/resources')}
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
              ) : sharedFiles && sharedFiles.length > 0 ? (
                <List disablePadding>
                  {sharedFiles.map((file) => (
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
                    No shared files yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Files shared by teachers will appear here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Resources */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Lesson Resources
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <RecentResources
                resources={resourcesData || []}
                isLoading={resourcesLoading}
                onViewAll={() => navigate('/parent/resources')}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
