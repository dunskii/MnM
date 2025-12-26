// ===========================================
// Calendar Page with Drag-and-Drop
// ===========================================
// Displays all lessons with hybrid placeholders using react-big-calendar
// Supports drag-and-drop rescheduling with conflict detection

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import withDragAndDrop, {
  EventInteractionArgs,
} from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import WarningIcon from '@mui/icons-material/Warning';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PageHeader from '../../components/common/PageHeader';
import { useCalendarEvents } from '../../hooks/useHybridBooking';
import { useTerms } from '../../hooks/useAdmin';
import { useTeachers } from '../../hooks/useUsers';
import { useCheckRescheduleConflicts, useRescheduleLesson } from '../../hooks/useLessons';
import {
  CalendarEvent,
  CalendarEventsFilters,
  getEventTypeColor,
} from '../../api/hybridBooking.api';
import { ConflictCheckResult } from '../../api/lessons.api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// ===========================================
// CALENDAR SETUP
// ===========================================

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

// Create drag-and-drop wrapped calendar with CalendarEvent type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar as any);

// Event type labels for display
const eventTypeLabels: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  GROUP: 'Group',
  BAND: 'Band',
  HYBRID_GROUP: 'Hybrid (Group Week)',
  HYBRID_INDIVIDUAL: 'Hybrid (Booked)',
  HYBRID_PLACEHOLDER: 'Hybrid (Booking Week)',
  MEET_AND_GREET: 'Meet & Greet',
};

// Types that can be dragged (lessons only, not placeholders or M&G)
const draggableTypes = ['INDIVIDUAL', 'GROUP', 'BAND', 'HYBRID_GROUP'];

// ===========================================
// TYPES
// ===========================================

interface RescheduleDialogState {
  open: boolean;
  event: CalendarEvent | null;
  newStart: Date | null;
  newEnd: Date | null;
  conflicts: ConflictCheckResult | null;
  loading: boolean;
}

// ===========================================
// COMPONENT
// ===========================================

export default function CalendarPage() {
  // State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState<CalendarEventsFilters>({});
  const [rescheduleDialog, setRescheduleDialog] = useState<RescheduleDialogState>({
    open: false,
    event: null,
    newStart: null,
    newEnd: null,
    conflicts: null,
    loading: false,
  });
  const [notifyParents, setNotifyParents] = useState(true);
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Queries
  const { data: termsData, isLoading: termsLoading } = useTerms();
  const { data: teachersData, isLoading: teachersLoading } = useTeachers();

  // Mutations
  const checkConflicts = useCheckRescheduleConflicts();
  const rescheduleLesson = useRescheduleLesson();

  // Calculate date range for events query
  const dateRange = useMemo(() => {
    const start = addDays(date, -30);
    const end = addDays(date, 60);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [date]);

  const { data: eventsData, isLoading: eventsLoading, error } = useCalendarEvents({
    ...filters,
    ...dateRange,
  });

  const terms = termsData ?? [];
  const teachers = teachersData ?? [];
  const events = eventsData ?? [];

  // Event style getter for color coding
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const type = event.resource?.type || 'GROUP';
    const color = getEventTypeColor(type);
    const isPlaceholder = type === 'HYBRID_PLACEHOLDER';
    const isYellow = type === 'BAND';
    const isDraggable = draggableTypes.includes(type);

    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: isPlaceholder ? 0.7 : 1,
        color: isYellow ? '#080808' : '#ffffff',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px',
        cursor: isDraggable ? 'grab' : 'pointer',
      },
    };
  }, []);

  // Handle event click
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (field: keyof CalendarEventsFilters) => (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        [field]: value || undefined,
      }));
    },
    []
  );

  // Helper to format time as HH:mm
  const formatTimeForApi = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  // Handle event drag (when user drops an event to a new time)
  const handleEventDrop = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      const eventType = event.resource?.type;
      const lessonId = event.resource?.lessonId;

      // Only allow dragging of actual lessons
      if (!eventType || !draggableTypes.includes(eventType) || !lessonId) {
        return;
      }

      const newStart = new Date(start);
      const newEnd = new Date(end);

      // Check for conflicts
      setRescheduleDialog({
        open: true,
        event,
        newStart,
        newEnd,
        conflicts: null,
        loading: true,
      });

      try {
        const conflicts = await checkConflicts.mutateAsync({
          lessonId,
          input: {
            newDayOfWeek: newStart.getDay(),
            newStartTime: formatTimeForApi(newStart),
            newEndTime: formatTimeForApi(newEnd),
          },
        });

        setRescheduleDialog((prev) => ({
          ...prev,
          conflicts,
          loading: false,
        }));
      } catch {
        setRescheduleDialog((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    },
    [checkConflicts]
  );

  // Handle resize (when user changes event duration)
  const handleEventResize = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      // Treat resize the same as drop
      await handleEventDrop({ event, start, end } as EventInteractionArgs<CalendarEvent>);
    },
    [handleEventDrop]
  );

  // Confirm reschedule
  const handleConfirmReschedule = useCallback(async () => {
    const { event, newStart, newEnd } = rescheduleDialog;
    if (!event || !newStart || !newEnd || !event.resource?.lessonId) return;

    try {
      await rescheduleLesson.mutateAsync({
        lessonId: event.resource.lessonId,
        input: {
          newDayOfWeek: newStart.getDay(),
          newStartTime: formatTimeForApi(newStart),
          newEndTime: formatTimeForApi(newEnd),
          notifyParents,
          reason: rescheduleReason || undefined,
        },
      });

      // Reset dialog
      setRescheduleDialog({
        open: false,
        event: null,
        newStart: null,
        newEnd: null,
        conflicts: null,
        loading: false,
      });
      setRescheduleReason('');
      setNotifyParents(true);
    } catch {
      // Error is handled by the mutation hook
    }
  }, [rescheduleDialog, notifyParents, rescheduleReason, rescheduleLesson]);

  // Cancel reschedule
  const handleCancelReschedule = useCallback(() => {
    setRescheduleDialog({
      open: false,
      event: null,
      newStart: null,
      newEnd: null,
      conflicts: null,
      loading: false,
    });
    setRescheduleReason('');
    setNotifyParents(true);
  }, []);

  // Check if event is draggable
  const draggableAccessor = useCallback(
    (event: CalendarEvent) => {
      const type = event.resource?.type;
      return type ? draggableTypes.includes(type) : false;
    },
    []
  );

  // Loading state
  const isLoading = termsLoading || teachersLoading || eventsLoading;

  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="View and reschedule lessons with drag-and-drop"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Calendar' },
        ]}
      />

      {/* Drag hint */}
      <Alert
        severity="info"
        icon={<DragIndicatorIcon />}
        sx={{ mb: 2 }}
      >
        Drag and drop lessons to reschedule them. Hybrid placeholders and Meet &amp; Greets cannot be moved.
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load calendar events. Please try again.
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Term</InputLabel>
              <Select
                value={filters.termId || ''}
                label="Term"
                onChange={handleFilterChange('termId')}
              >
                <MenuItem value="">All Terms</MenuItem>
                {terms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={filters.teacherId || ''}
                label="Teacher"
                onChange={handleFilterChange('teacherId')}
              >
                <MenuItem value="">All Teachers</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Object.entries(eventTypeLabels).map(([type, label]) => (
                <Chip
                  key={type}
                  label={label}
                  size="small"
                  sx={{
                    backgroundColor: getEventTypeColor(type),
                    color: type === 'BAND' ? '#080808' : '#fff',
                    fontSize: '11px',
                  }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Calendar */}
      <Paper sx={{ p: 2, height: 700, position: 'relative' }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          draggableAccessor={draggableAccessor}
          resizable
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          min={new Date(0, 0, 0, 7, 0)} // 7 AM
          max={new Date(0, 0, 0, 21, 0)} // 9 PM
          style={{ height: '100%', opacity: isLoading ? 0.5 : 1 }}
          popup
          showMultiDayTimes
        />
      </Paper>

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedEvent?.title}
            {selectedEvent?.resource?.type && (
              <Chip
                label={eventTypeLabels[selectedEvent.resource.type] || selectedEvent.resource.type}
                size="small"
                sx={{
                  backgroundColor: getEventTypeColor(selectedEvent.resource.type),
                  color: selectedEvent.resource.type === 'BAND' ? '#080808' : '#fff',
                }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEvent?.resource && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography>
                  {selectedEvent.start &&
                    format(selectedEvent.start, 'EEE, MMM d, yyyy')}
                </Typography>
                <Typography>
                  {selectedEvent.start && format(selectedEvent.start, 'h:mm a')} -{' '}
                  {selectedEvent.end && format(selectedEvent.end, 'h:mm a')}
                </Typography>
              </Grid>
              {selectedEvent.resource.teacherName && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Teacher
                  </Typography>
                  <Typography>{selectedEvent.resource.teacherName}</Typography>
                </Grid>
              )}
              {selectedEvent.resource.roomName && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Room
                  </Typography>
                  <Typography>{selectedEvent.resource.roomName}</Typography>
                </Grid>
              )}
              {selectedEvent.resource.locationName && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography>{selectedEvent.resource.locationName}</Typography>
                </Grid>
              )}
              {selectedEvent.resource.enrolledCount !== undefined && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Enrolled
                  </Typography>
                  <Typography>
                    {selectedEvent.resource.enrolledCount} /{' '}
                    {selectedEvent.resource.maxStudents}
                  </Typography>
                </Grid>
              )}
              {selectedEvent.resource.weekNumber && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Week
                  </Typography>
                  <Typography>Week {selectedEvent.resource.weekNumber}</Typography>
                </Grid>
              )}
              {selectedEvent.resource.studentName && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Student
                  </Typography>
                  <Typography>{selectedEvent.resource.studentName}</Typography>
                </Grid>
              )}
              {selectedEvent.resource.type === 'HYBRID_PLACEHOLDER' && (
                <Grid item xs={12}>
                  <Alert
                    severity={selectedEvent.resource.bookingsOpen ? 'success' : 'warning'}
                    sx={{ mt: 1 }}
                  >
                    {selectedEvent.resource.bookingsOpen
                      ? 'Bookings are open for this week'
                      : 'Bookings are not yet open for this week'}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
          {selectedEvent?.resource?.lessonId && (
            <Button
              variant="outlined"
              href={`/admin/lessons/${selectedEvent.resource.lessonId}`}
            >
              View Lesson
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <Dialog
        open={rescheduleDialog.open}
        onClose={handleCancelReschedule}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Reschedule Lesson
            {rescheduleDialog.conflicts?.hasConflicts && (
              <WarningIcon color="warning" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {rescheduleDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* Event info */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {rescheduleDialog.event?.title}
                </Typography>
                <Typography color="text.secondary">
                  Moving to:{' '}
                  {rescheduleDialog.newStart &&
                    format(rescheduleDialog.newStart, 'EEEE, MMM d')}{' '}
                  at{' '}
                  {rescheduleDialog.newStart &&
                    format(rescheduleDialog.newStart, 'h:mm a')}{' '}
                  -{' '}
                  {rescheduleDialog.newEnd &&
                    format(rescheduleDialog.newEnd, 'h:mm a')}
                </Typography>
              </Box>

              {/* Conflicts */}
              {rescheduleDialog.conflicts?.hasConflicts && (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    Conflicts Detected
                  </Typography>
                  {rescheduleDialog.conflicts.teacherConflict && (
                    <Typography variant="body2">
                      Teacher conflict: {rescheduleDialog.conflicts.teacherConflict.lessonName}{' '}
                      at {rescheduleDialog.conflicts.teacherConflict.time}
                    </Typography>
                  )}
                  {rescheduleDialog.conflicts.roomConflict && (
                    <Typography variant="body2">
                      Room conflict: {rescheduleDialog.conflicts.roomConflict.lessonName}{' '}
                      at {rescheduleDialog.conflicts.roomConflict.time}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Affected students */}
              {rescheduleDialog.conflicts &&
                rescheduleDialog.conflicts.affectedStudents > 0 && (
                  <Alert severity="info">
                    This will affect {rescheduleDialog.conflicts.affectedStudents} enrolled{' '}
                    {rescheduleDialog.conflicts.affectedStudents === 1 ? 'student' : 'students'}.
                  </Alert>
                )}

              <Divider />

              {/* Options */}
              <FormControlLabel
                control={
                  <Switch
                    checked={notifyParents}
                    onChange={(e) => setNotifyParents(e.target.checked)}
                  />
                }
                label="Notify parents via email"
              />

              <TextField
                label="Reason for rescheduling (optional)"
                multiline
                rows={2}
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g., Teacher unavailable, Room maintenance"
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReschedule} disabled={rescheduleLesson.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReschedule}
            disabled={
              rescheduleDialog.loading ||
              rescheduleDialog.conflicts?.hasConflicts ||
              rescheduleLesson.isPending
            }
          >
            {rescheduleLesson.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
