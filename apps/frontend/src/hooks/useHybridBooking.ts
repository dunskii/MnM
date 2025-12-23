// ===========================================
// Hybrid Booking React Query Hooks
// ===========================================
// Custom hooks for hybrid booking API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  hybridBookingApi,
  calendarApi,
  BookingFilters,
  CreateBookingInput,
  RescheduleBookingInput,
  LessonBookingFilters,
  CalendarEventsFilters,
} from '../api/hybridBooking.api';
import { lessonKeys } from './useLessons';

// ===========================================
// QUERY KEYS
// ===========================================

export const hybridBookingKeys = {
  all: ['hybrid-bookings'] as const,
  availableSlots: (lessonId: string, weekNumber: number) =>
    [...hybridBookingKeys.all, 'slots', lessonId, weekNumber] as const,
  myBookings: (filters?: BookingFilters) =>
    [...hybridBookingKeys.all, 'my', filters] as const,
  booking: (id: string) => [...hybridBookingKeys.all, 'detail', id] as const,
  lessonBookings: (lessonId: string, filters?: LessonBookingFilters) =>
    [...hybridBookingKeys.all, 'lesson', lessonId, filters] as const,
  stats: (lessonId: string, weekNumber?: number) =>
    [...hybridBookingKeys.all, 'stats', lessonId, weekNumber] as const,
  unbookedStudents: (lessonId: string, weekNumber: number) =>
    [...hybridBookingKeys.all, 'unbooked', lessonId, weekNumber] as const,
};

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (filters?: CalendarEventsFilters) =>
    [...calendarKeys.all, 'events', filters] as const,
  myEvents: (filters?: CalendarEventsFilters) =>
    [...calendarKeys.all, 'my-events', filters] as const,
};

// ===========================================
// PARENT BOOKING QUERIES
// ===========================================

/**
 * Get available time slots for a specific week
 */
export function useAvailableSlots(lessonId: string, weekNumber: number) {
  return useQuery({
    queryKey: hybridBookingKeys.availableSlots(lessonId, weekNumber),
    queryFn: () => hybridBookingApi.getAvailableSlots(lessonId, weekNumber),
    enabled: !!lessonId && weekNumber > 0,
  });
}

/**
 * Get parent's own bookings
 */
export function useMyBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: hybridBookingKeys.myBookings(filters),
    queryFn: () => hybridBookingApi.getMyBookings(filters),
  });
}

/**
 * Get a single booking by ID
 */
export function useBooking(id: string) {
  return useQuery({
    queryKey: hybridBookingKeys.booking(id),
    queryFn: () => hybridBookingApi.getById(id),
    enabled: !!id,
  });
}

// ===========================================
// PARENT BOOKING MUTATIONS
// ===========================================

/**
 * Create a new hybrid booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: CreateBookingInput) => hybridBookingApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      queryClient.invalidateQueries({
        queryKey: hybridBookingKeys.availableSlots(
          variables.lessonId,
          variables.weekNumber
        ),
      });
      enqueueSnackbar('Booking confirmed successfully!', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to create booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Reschedule a booking
 */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RescheduleBookingInput;
    }) => hybridBookingApi.reschedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      enqueueSnackbar('Booking rescheduled successfully!', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to reschedule booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      hybridBookingApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      enqueueSnackbar('Booking cancelled', { variant: 'info' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to cancel booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// ===========================================
// ADMIN HYBRID MANAGEMENT QUERIES
// ===========================================

/**
 * Get all bookings for a lesson (admin/teacher)
 */
export function useLessonBookings(
  lessonId: string,
  filters?: LessonBookingFilters
) {
  return useQuery({
    queryKey: hybridBookingKeys.lessonBookings(lessonId, filters),
    queryFn: () => hybridBookingApi.getLessonBookings(lessonId, filters),
    enabled: !!lessonId,
  });
}

/**
 * Get booking statistics for a lesson
 */
export function useBookingStats(lessonId: string, weekNumber?: number) {
  return useQuery({
    queryKey: hybridBookingKeys.stats(lessonId, weekNumber),
    queryFn: () => hybridBookingApi.getBookingStats(lessonId, weekNumber),
    enabled: !!lessonId,
  });
}

/**
 * Get students who haven't booked for a specific week
 */
export function useUnbookedStudents(lessonId: string, weekNumber: number) {
  return useQuery({
    queryKey: hybridBookingKeys.unbookedStudents(lessonId, weekNumber),
    queryFn: () => hybridBookingApi.getUnbookedStudents(lessonId, weekNumber),
    enabled: !!lessonId && weekNumber > 0,
  });
}

// ===========================================
// ADMIN HYBRID MANAGEMENT MUTATIONS
// ===========================================

/**
 * Open bookings for a lesson
 */
export function useOpenBookings() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (lessonId: string) => hybridBookingApi.openBookings(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar('Bookings opened successfully', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to open bookings';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Close bookings for a lesson
 */
export function useCloseBookings() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (lessonId: string) => hybridBookingApi.closeBookings(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar('Bookings closed', { variant: 'info' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to close bookings';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Toggle bookings open/close
 */
export function useToggleBookings() {
  const openBookings = useOpenBookings();
  const closeBookings = useCloseBookings();

  return {
    mutate: ({ lessonId, open }: { lessonId: string; open: boolean }) => {
      if (open) {
        openBookings.mutate(lessonId);
      } else {
        closeBookings.mutate(lessonId);
      }
    },
    isPending: openBookings.isPending || closeBookings.isPending,
  };
}

/**
 * Send booking reminders
 */
export function useSendReminders() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      lessonId,
      weekNumber,
    }: {
      lessonId: string;
      weekNumber: number;
    }) => hybridBookingApi.sendReminders(lessonId, weekNumber),
    onSuccess: (data) => {
      enqueueSnackbar(
        `Reminders would be sent to ${data.count} parents (email not yet implemented)`,
        { variant: 'info' }
      );
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || 'Failed to send reminders';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// ===========================================
// CALENDAR QUERIES
// ===========================================

/**
 * Get calendar events (admin/teacher) with pagination
 * @param filters - Optional filters including pagination
 */
export function useCalendarEventsPaginated(filters?: CalendarEventsFilters) {
  return useQuery({
    queryKey: calendarKeys.events(filters),
    queryFn: () => calendarApi.getEvents(filters),
  });
}

/**
 * Get all calendar events (admin/teacher) - fetches all pages
 * Use for calendar views that need all events rendered at once
 * @param filters - Optional filters (excluding pagination)
 */
export function useCalendarEvents(filters?: Omit<CalendarEventsFilters, 'page' | 'limit'>) {
  return useQuery({
    queryKey: [...calendarKeys.events(filters), 'all'],
    queryFn: () => calendarApi.getAllEvents(filters),
  });
}

/**
 * Get calendar events for parent's children with pagination
 */
export function useMyCalendarEventsPaginated(filters?: CalendarEventsFilters) {
  return useQuery({
    queryKey: calendarKeys.myEvents(filters),
    queryFn: () => calendarApi.getMyEvents(filters),
  });
}

/**
 * Get all calendar events for parent's children - fetches all pages
 * Use for calendar views that need all events rendered at once
 */
export function useMyCalendarEvents(filters?: Omit<CalendarEventsFilters, 'page' | 'limit'>) {
  return useQuery({
    queryKey: [...calendarKeys.myEvents(filters), 'all'],
    queryFn: () => calendarApi.getAllMyEvents(filters),
  });
}
