// ===========================================
// Hybrid Booking API Functions
// ===========================================
// API calls for hybrid lesson booking endpoints

import { apiClient } from '../services/api';
import { Lesson, HybridPattern } from './lessons.api';
import { Student } from './users.api';

// ===========================================
// TYPES
// ===========================================

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  weekNumber: number;
  isAvailable: boolean;
}

export interface HybridBooking {
  id: string;
  lessonId: string;
  studentId: string;
  parentId: string;
  weekNumber: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  bookedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lesson: Lesson;
  student: Student;
  parent: {
    id: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface BookingStats {
  totalStudents: number;
  bookedCount: number;
  unbookedCount: number;
  completionRate: number;
  pendingBookings: number;
  confirmedBookings: number;
}

export interface CreateBookingInput {
  lessonId: string;
  studentId: string;
  weekNumber: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

export interface RescheduleBookingInput {
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

export interface BookingFilters {
  lessonId?: string;
  status?: string;
  weekNumber?: number;
}

export interface LessonBookingFilters {
  weekNumber?: number;
  status?: string;
}

export interface UnbookedStudent {
  student: Student;
  parent: {
    id: string;
    user: { email: string; firstName: string; lastName: string };
  };
}

// Calendar event type for react-big-calendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID_GROUP' | 'HYBRID_INDIVIDUAL' | 'HYBRID_PLACEHOLDER' | 'MEET_AND_GREET';
    lessonId?: string;
    lessonName?: string;
    teacherName?: string;
    roomName?: string;
    locationName?: string;
    enrolledCount?: number;
    maxStudents?: number;
    isBooking?: boolean;
    studentName?: string;
    bookingId?: string;
    weekNumber?: number;
    bookingsOpen?: boolean;
  };
}

export interface CalendarEventsFilters {
  termId?: string;
  teacherId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedCalendarEvents {
  events: CalendarEvent[];
  pagination: PaginationInfo;
}

// ===========================================
// HYBRID BOOKING API
// ===========================================

export const hybridBookingApi = {
  // ===========================================
  // PARENT BOOKING OPERATIONS
  // ===========================================

  // Get available time slots for a specific week
  getAvailableSlots: (lessonId: string, weekNumber: number): Promise<TimeSlot[]> =>
    apiClient
      .get<{ status: string; data: TimeSlot[] }>('/hybrid-bookings/available-slots', {
        params: { lessonId, weekNumber },
      })
      .then((res) => res.data),

  // Create a new booking
  create: (data: CreateBookingInput): Promise<HybridBooking> =>
    apiClient
      .post<{ status: string; data: HybridBooking }>('/hybrid-bookings', data)
      .then((res) => res.data),

  // Get parent's bookings
  getMyBookings: (filters?: BookingFilters): Promise<HybridBooking[]> =>
    apiClient
      .get<{ status: string; data: HybridBooking[] }>('/hybrid-bookings/my-bookings', {
        params: filters,
      })
      .then((res) => res.data),

  // Get a single booking by ID
  getById: (id: string): Promise<HybridBooking> =>
    apiClient
      .get<{ status: string; data: HybridBooking }>(`/hybrid-bookings/${id}`)
      .then((res) => res.data),

  // Reschedule a booking
  reschedule: (id: string, data: RescheduleBookingInput): Promise<HybridBooking> =>
    apiClient
      .patch<{ status: string; data: HybridBooking }>(`/hybrid-bookings/${id}`, data)
      .then((res) => res.data),

  // Cancel a booking
  cancel: (id: string, reason?: string): Promise<void> =>
    apiClient
      .delete(`/hybrid-bookings/${id}`, { data: { reason } })
      .then(() => undefined),

  // ===========================================
  // ADMIN HYBRID MANAGEMENT OPERATIONS
  // ===========================================

  // Open bookings for a lesson
  openBookings: (lessonId: string): Promise<HybridPattern> =>
    apiClient
      .patch<{ status: string; data: HybridPattern }>(
        `/hybrid-bookings/lessons/${lessonId}/open-bookings`
      )
      .then((res) => res.data),

  // Close bookings for a lesson
  closeBookings: (lessonId: string): Promise<HybridPattern> =>
    apiClient
      .patch<{ status: string; data: HybridPattern }>(
        `/hybrid-bookings/lessons/${lessonId}/close-bookings`
      )
      .then((res) => res.data),

  // Get all bookings for a lesson (admin/teacher view)
  getLessonBookings: (
    lessonId: string,
    filters?: LessonBookingFilters
  ): Promise<HybridBooking[]> =>
    apiClient
      .get<{ status: string; data: HybridBooking[] }>(
        `/hybrid-bookings/lessons/${lessonId}/bookings`,
        { params: filters }
      )
      .then((res) => res.data),

  // Get booking statistics for a lesson
  getBookingStats: (lessonId: string, weekNumber?: number): Promise<BookingStats> =>
    apiClient
      .get<{ status: string; data: BookingStats }>(
        `/hybrid-bookings/lessons/${lessonId}/stats`,
        { params: weekNumber ? { weekNumber } : {} }
      )
      .then((res) => res.data),

  // Get students who haven't booked for a specific week
  getUnbookedStudents: (lessonId: string, weekNumber: number): Promise<UnbookedStudent[]> =>
    apiClient
      .get<{ status: string; data: UnbookedStudent[] }>(
        `/hybrid-bookings/lessons/${lessonId}/unbooked`,
        { params: { weekNumber } }
      )
      .then((res) => res.data),

  // Send booking reminders (admin only)
  sendReminders: (
    lessonId: string,
    weekNumber: number
  ): Promise<{ count: number; parents: Array<{ email: string; parentName: string; studentName: string }> }> =>
    apiClient
      .post<{
        status: string;
        message: string;
        data: { count: number; parents: Array<{ email: string; parentName: string; studentName: string }> };
      }>(`/hybrid-bookings/lessons/${lessonId}/send-reminders`, null, {
        params: { weekNumber },
      })
      .then((res) => res.data),
};

// ===========================================
// CALENDAR API
// ===========================================

export const calendarApi = {
  /**
   * Get calendar events (admin/teacher) with pagination
   * @param filters - Optional filters including page and limit
   * @returns Paginated calendar events
   */
  getEvents: (filters?: CalendarEventsFilters): Promise<PaginatedCalendarEvents> =>
    apiClient
      .get<{ status: string; data: CalendarEvent[]; pagination: PaginationInfo }>('/calendar/events', {
        params: filters,
      })
      .then((res) => ({
        events: res.data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        })),
        pagination: res.pagination,
      })),

  /**
   * Get all calendar events (admin/teacher) - fetches all pages
   * Use for calendar views that need all events at once
   * @param filters - Optional filters (excluding pagination)
   * @returns All calendar events
   */
  getAllEvents: async (filters?: Omit<CalendarEventsFilters, 'page' | 'limit'>): Promise<CalendarEvent[]> => {
    const allEvents: CalendarEvent[] = [];
    let page = 1;
    const limit = 500; // Max per page
    let hasMore = true;

    while (hasMore) {
      const result = await calendarApi.getEvents({ ...filters, page, limit });
      allEvents.push(...result.events);
      hasMore = result.pagination.hasMore;
      page++;
    }

    return allEvents;
  },

  /**
   * Get calendar events for parent's children with pagination
   */
  getMyEvents: (filters?: CalendarEventsFilters): Promise<PaginatedCalendarEvents> =>
    apiClient
      .get<{ status: string; data: CalendarEvent[]; pagination: PaginationInfo }>('/calendar/my-events', {
        params: filters,
      })
      .then((res) => ({
        events: res.data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        })),
        pagination: res.pagination,
      })),

  /**
   * Get all calendar events for parent - fetches all pages
   */
  getAllMyEvents: async (filters?: Omit<CalendarEventsFilters, 'page' | 'limit'>): Promise<CalendarEvent[]> => {
    const allEvents: CalendarEvent[] = [];
    let page = 1;
    const limit = 500;
    let hasMore = true;

    while (hasMore) {
      const result = await calendarApi.getMyEvents({ ...filters, page, limit });
      allEvents.push(...result.events);
      hasMore = result.pagination.hasMore;
      page++;
    }

    return allEvents;
  },
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get booking status color for chip
 */
export const getBookingStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    case 'COMPLETED':
      return 'primary';
    case 'NO_SHOW':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get calendar event type color
 * Uses Music 'n Me brand colors:
 * - Primary Blue: #4580E4
 * - Yellow: #FFCE00
 * - Mint: #96DAC9
 * - Coral: #FFAE9E
 * - Cream: #FCF6E6
 */
export const getEventTypeColor = (type: string): string => {
  switch (type) {
    case 'INDIVIDUAL':
      return '#4580E4'; // Primary blue
    case 'GROUP':
      return '#96DAC9'; // Mint
    case 'BAND':
      return '#FFCE00'; // Yellow
    case 'HYBRID_GROUP':
      return '#96DAC9'; // Mint (same as group)
    case 'HYBRID_INDIVIDUAL':
      return '#FFAE9E'; // Coral
    case 'HYBRID_PLACEHOLDER':
      return '#E8DDD0'; // Muted cream (darker shade of #FCF6E6 for visibility)
    case 'MEET_AND_GREET':
      return '#4580E4'; // Primary blue
    default:
      return '#4580E4';
  }
};

/**
 * Format time slot for display
 */
export const formatTimeSlot = (startTime: string, endTime: string): string => {
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Check if booking can be modified (24h notice)
 */
export const canModifyBooking = (scheduledDate: string, startTime: string): boolean => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const bookingTime = new Date(scheduledDate);
  bookingTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilBooking >= 24;
};

/**
 * Get hours until booking
 */
export const getHoursUntilBooking = (scheduledDate: string, startTime: string): number => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const bookingTime = new Date(scheduledDate);
  bookingTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  return Math.max(0, (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60));
};
