// ===========================================
// Calendar Page
// ===========================================
// Displays all lessons with hybrid placeholders using react-big-calendar

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import PageHeader from '../../components/common/PageHeader';
import { useCalendarEvents } from '../../hooks/useHybridBooking';
import { useTerms } from '../../hooks/useAdmin';
import { useTeachers } from '../../hooks/useUsers';
import {
  CalendarEvent,
  CalendarEventsFilters,
  getEventTypeColor,
} from '../../api/hybridBooking.api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

// ===========================================
// COMPONENT
// ===========================================

export default function CalendarPage() {
  // State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState<CalendarEventsFilters>({});

  // Queries
  const { data: termsData, isLoading: termsLoading } = useTerms();
  const { data: teachersData, isLoading: teachersLoading } = useTeachers();

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

    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: isPlaceholder ? 0.7 : 1,
        color: isYellow ? '#080808' : '#ffffff',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px',
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

  // Loading state
  const isLoading = termsLoading || teachersLoading || eventsLoading;

  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="View all lessons, hybrid bookings, and meet & greets"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Calendar' },
        ]}
      />

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
        <Calendar
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
    </Box>
  );
}
