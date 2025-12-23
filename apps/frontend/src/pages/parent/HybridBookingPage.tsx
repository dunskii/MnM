// ===========================================
// Parent Hybrid Booking Page
// ===========================================
// Interface for parents to book individual sessions for their children

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Stack,
  TextField,
} from '@mui/material';
import {
  Event as EventIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SlotPicker from '../../components/booking/SlotPicker';
import {
  useMyBookings,
  useAvailableSlots,
  useCreateBooking,
  useRescheduleBooking,
  useCancelBooking,
} from '../../hooks/useHybridBooking';
import {
  HybridBooking,
  TimeSlot,
  getBookingStatusColor,
  formatTimeSlot,
  canModifyBooking,
  getHoursUntilBooking,
} from '../../api/hybridBooking.api';
import { useLessons } from '../../hooks/useLessons';
import { Lesson } from '../../api/lessons.api';

// ===========================================
// TYPES
// ===========================================

interface BookingModalState {
  open: boolean;
  lesson: Lesson | null;
  weekNumber: number | null;
  studentId: string | null;
}

interface RescheduleModalState {
  open: boolean;
  booking: HybridBooking | null;
}

interface CancelModalState {
  open: boolean;
  booking: HybridBooking | null;
  reason: string;
}

// ===========================================
// COMPONENT
// ===========================================

export default function HybridBookingPage() {
  // State
  const [bookingModal, setBookingModal] = useState<BookingModalState>({
    open: false,
    lesson: null,
    weekNumber: null,
    studentId: null,
  });
  const [rescheduleModal, setRescheduleModal] = useState<RescheduleModalState>({
    open: false,
    booking: null,
  });
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    open: false,
    booking: null,
    reason: '',
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Queries
  const { data: myBookings, isLoading: bookingsLoading } = useMyBookings();
  const { data: lessonsData, isLoading: lessonsLoading } = useLessons({ isActive: true });

  // Filter to only hybrid lessons
  const hybridLessons = useMemo(() => {
    return (lessonsData ?? []).filter(
      (lesson) => lesson.lessonType?.type === 'HYBRID' && lesson.hybridPattern
    );
  }, [lessonsData]);

  // Available slots query (when booking or reschedule modal is open)
  const activeLesson = bookingModal.lesson || rescheduleModal.booking?.lesson;
  const activeWeek = bookingModal.weekNumber || rescheduleModal.booking?.weekNumber;
  const { data: availableSlots, isLoading: slotsLoading } = useAvailableSlots(
    activeLesson?.id || '',
    activeWeek || 0
  );

  // Mutations
  const createBooking = useCreateBooking();
  const rescheduleBooking = useRescheduleBooking();
  const cancelBooking = useCancelBooking();

  // Group bookings by lesson
  const bookingsByLesson = useMemo(() => {
    const grouped: Record<string, HybridBooking[]> = {};
    (myBookings ?? []).forEach((booking) => {
      if (!grouped[booking.lessonId]) {
        grouped[booking.lessonId] = [];
      }
      grouped[booking.lessonId].push(booking);
    });
    return grouped;
  }, [myBookings]);

  // Handlers
  const handleOpenBookingModal = (
    lesson: Lesson,
    weekNumber: number,
    studentId: string
  ) => {
    setBookingModal({
      open: true,
      lesson,
      weekNumber,
      studentId,
    });
    setSelectedSlot(null);
  };

  const handleCloseBookingModal = () => {
    setBookingModal({
      open: false,
      lesson: null,
      weekNumber: null,
      studentId: null,
    });
    setSelectedSlot(null);
  };

  const handleConfirmBooking = () => {
    if (!bookingModal.lesson || !bookingModal.weekNumber || !bookingModal.studentId || !selectedSlot) {
      return;
    }

    createBooking.mutate(
      {
        lessonId: bookingModal.lesson.id,
        studentId: bookingModal.studentId,
        weekNumber: bookingModal.weekNumber,
        scheduledDate: new Date(selectedSlot.date).toISOString(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      },
      {
        onSuccess: () => {
          handleCloseBookingModal();
        },
      }
    );
  };

  const handleOpenRescheduleModal = (booking: HybridBooking) => {
    setRescheduleModal({ open: true, booking });
    setSelectedSlot(null);
  };

  const handleCloseRescheduleModal = () => {
    setRescheduleModal({ open: false, booking: null });
    setSelectedSlot(null);
  };

  const handleOpenCancelModal = (booking: HybridBooking) => {
    setCancelModal({ open: true, booking, reason: '' });
  };

  const handleCloseCancelModal = () => {
    setCancelModal({ open: false, booking: null, reason: '' });
  };

  const handleConfirmCancel = () => {
    if (!cancelModal.booking) return;

    cancelBooking.mutate(
      {
        id: cancelModal.booking.id,
        reason: cancelModal.reason || undefined,
      },
      {
        onSuccess: () => {
          handleCloseCancelModal();
        },
      }
    );
  };

  // Loading state
  const isLoading = bookingsLoading || lessonsLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Book Individual Sessions"
        subtitle="Select time slots for your child's individual lessons"
      />

      {hybridLessons.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hybrid lessons available for booking. Your child must be enrolled in a
          hybrid lesson to book individual sessions.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Hybrid Lessons Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Hybrid Lessons
          </Typography>

          {hybridLessons.map((lesson) => {
            const pattern = lesson.hybridPattern;
            if (!pattern) return null;

            const individualWeeks = pattern.individualWeeks as number[];
            const groupWeeks = pattern.groupWeeks as number[];
            const lessonBookings = bookingsByLesson[lesson.id] || [];

            return (
              <Card key={lesson.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{lesson.name}</Typography>
                    <Chip
                      label={pattern.bookingsOpen ? 'Bookings Open' : 'Bookings Closed'}
                      color={pattern.bookingsOpen ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {lesson.teacher?.user?.firstName} {lesson.teacher?.user?.lastName} |{' '}
                    {lesson.room?.location?.name} - {lesson.room?.name}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Week Schedule
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((week) => {
                      const isIndividual = individualWeeks.includes(week);
                      const isGroup = groupWeeks.includes(week);
                      const hasBooking = lessonBookings.some(
                        (b) => b.weekNumber === week && b.status !== 'CANCELLED'
                      );

                      return (
                        <Chip
                          key={week}
                          label={`W${week}`}
                          size="small"
                          variant={isIndividual ? 'filled' : 'outlined'}
                          color={
                            hasBooking
                              ? 'success'
                              : isIndividual
                              ? 'warning'
                              : isGroup
                              ? 'primary'
                              : 'default'
                          }
                          icon={hasBooking ? <CheckCircleIcon /> : undefined}
                          sx={{ minWidth: 60 }}
                        />
                      );
                    })}
                  </Stack>

                  <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip size="small" color="primary" variant="outlined" label="" sx={{ width: 16, height: 16 }} />
                      <Typography variant="caption">Group</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip size="small" color="warning" label="" sx={{ width: 16, height: 16 }} />
                      <Typography variant="caption">Individual (Book)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip size="small" color="success" label="" sx={{ width: 16, height: 16 }} />
                      <Typography variant="caption">Booked</Typography>
                    </Box>
                  </Box>
                </CardContent>

                {pattern.bookingsOpen && (
                  <CardActions>
                    {individualWeeks.map((week) => {
                      const hasBooking = lessonBookings.some(
                        (b) => b.weekNumber === week && b.status !== 'CANCELLED'
                      );
                      if (hasBooking) return null;

                      // Get first enrolled student (simplified - in real app, allow selection)
                      const studentId = lesson.enrollments?.[0]?.studentId;
                      if (!studentId) return null;

                      return (
                        <Button
                          key={week}
                          size="small"
                          variant="outlined"
                          startIcon={<EventIcon />}
                          onClick={() => handleOpenBookingModal(lesson, week, studentId)}
                        >
                          Book Week {week}
                        </Button>
                      );
                    })}
                  </CardActions>
                )}
              </Card>
            );
          })}
        </Grid>

        {/* My Bookings Section */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            My Bookings
          </Typography>

          {(!myBookings || myBookings.length === 0) && (
            <Alert severity="info">No bookings yet.</Alert>
          )}

          <List>
            {(myBookings ?? [])
              .filter((b) => b.status !== 'CANCELLED')
              .sort(
                (a, b) =>
                  new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
              )
              .map((booking) => {
                const canModify = canModifyBooking(booking.scheduledDate, booking.startTime);
                const hoursUntil = getHoursUntilBooking(booking.scheduledDate, booking.startTime);

                return (
                  <Paper key={booking.id} sx={{ mb: 1 }}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {booking.lesson?.name || 'Lesson'}
                            <Chip
                              label={booking.status}
                              size="small"
                              color={getBookingStatusColor(booking.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2">
                              {format(new Date(booking.scheduledDate), 'EEE, MMM d')} |{' '}
                              {formatTimeSlot(booking.startTime, booking.endTime)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Week {booking.weekNumber} |{' '}
                              {booking.student?.firstName} {booking.student?.lastName}
                            </Typography>
                            {!canModify && hoursUntil > 0 && (
                              <Typography variant="caption" color="warning.main" display="block">
                                <WarningIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                {Math.floor(hoursUntil)}h until session - cannot modify
                              </Typography>
                            )}
                          </>
                        }
                      />
                      {canModify && booking.status !== 'COMPLETED' && (
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenRescheduleModal(booking)}
                            title="Reschedule"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCancelModal(booking)}
                            color="error"
                            title="Cancel"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  </Paper>
                );
              })}
          </List>
        </Grid>
      </Grid>

      {/* Booking Modal */}
      <Dialog
        open={bookingModal.open}
        onClose={handleCloseBookingModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Book Individual Session - Week {bookingModal.weekNumber}
        </DialogTitle>
        <DialogContent>
          {bookingModal.lesson && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{bookingModal.lesson.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {bookingModal.lesson.teacher?.user?.firstName}{' '}
                {bookingModal.lesson.teacher?.user?.lastName}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Available Time Slots
          </Typography>

          <SlotPicker
            slots={availableSlots}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
            isLoading={slotsLoading}
            emptyMessage="No available slots for this week."
            confirmationPrefix="You are booking for"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmBooking}
            disabled={!selectedSlot || createBooking.isPending}
          >
            {createBooking.isPending ? <CircularProgress size={20} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog
        open={rescheduleModal.open}
        onClose={handleCloseRescheduleModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reschedule Booking - Week {rescheduleModal.booking?.weekNumber}
        </DialogTitle>
        <DialogContent>
          {rescheduleModal.booking && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {rescheduleModal.booking.lesson?.name || 'Lesson'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current: {format(new Date(rescheduleModal.booking.scheduledDate), 'EEE, MMM d')} |{' '}
                {formatTimeSlot(rescheduleModal.booking.startTime, rescheduleModal.booking.endTime)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Select New Time Slot
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            You can only reschedule within the same week. Select a new time slot below.
          </Alert>

          <SlotPicker
            slots={availableSlots}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
            isLoading={slotsLoading}
            emptyMessage="No other available slots for this week."
            confirmationPrefix="New time:"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRescheduleModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!rescheduleModal.booking || !selectedSlot) return;
              rescheduleBooking.mutate(
                {
                  id: rescheduleModal.booking.id,
                  data: {
                    scheduledDate: new Date(selectedSlot.date).toISOString(),
                    startTime: selectedSlot.startTime,
                    endTime: selectedSlot.endTime,
                  },
                },
                {
                  onSuccess: () => {
                    handleCloseRescheduleModal();
                  },
                }
              );
            }}
            disabled={!selectedSlot || rescheduleBooking.isPending}
          >
            {rescheduleBooking.isPending ? <CircularProgress size={20} /> : 'Confirm Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelModal.open} onClose={handleCloseCancelModal}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel this booking?
          </Typography>
          {cancelModal.booking && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {cancelModal.booking.lesson?.name} - Week {cancelModal.booking.weekNumber}
              <br />
              {format(new Date(cancelModal.booking.scheduledDate), 'EEE, MMM d')} |{' '}
              {formatTimeSlot(cancelModal.booking.startTime, cancelModal.booking.endTime)}
            </Typography>
          )}
          <TextField
            fullWidth
            label="Reason (optional)"
            value={cancelModal.reason}
            onChange={(e) =>
              setCancelModal((prev) => ({ ...prev, reason: e.target.value }))
            }
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelModal}>Keep Booking</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelBooking.isPending}
          >
            {cancelBooking.isPending ? <CircularProgress size={20} /> : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
