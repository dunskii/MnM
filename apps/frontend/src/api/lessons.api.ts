// ===========================================
// Lessons API Functions
// ===========================================
// API calls for lesson management endpoints

import { apiClient } from '../services/api';
import { Teacher, Student } from './users.api';
import { Term, Location, Room, Instrument, LessonType } from './admin.api';

// ===========================================
// TYPES
// ===========================================

export interface HybridPattern {
  id: string;
  lessonId: string;
  termId: string;
  patternType: 'ALTERNATING' | 'CUSTOM';
  groupWeeks: number[];
  individualWeeks: number[];
  individualSlotDuration: number;
  bookingDeadlineHours: number;
  bookingsOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonEnrollment {
  id: string;
  lessonId: string;
  studentId: string;
  enrolledAt: string;
  isActive: boolean;
  student: Student;
}

export interface Lesson {
  id: string;
  schoolId: string;
  lessonTypeId: string;
  termId: string;
  teacherId: string;
  roomId: string;
  instrumentId: string | null;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMins: number;
  maxStudents: number;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lessonType: LessonType;
  term: Term;
  teacher: Teacher & {
    user: { id: string; firstName: string; lastName: string };
  };
  room: Room & {
    location: Pick<Location, 'id' | 'name'>;
  };
  instrument: Instrument | null;
  hybridPattern: HybridPattern | null;
  enrollments: LessonEnrollment[];
  _count: { enrollments: number };
}

export interface LessonFilters {
  termId?: string;
  teacherId?: string;
  roomId?: string;
  instrumentId?: string;
  lessonTypeId?: string;
  dayOfWeek?: number;
  isActive?: boolean;
}

export interface CreateLessonInput {
  lessonTypeId: string;
  termId: string;
  teacherId: string;
  roomId: string;
  instrumentId?: string;
  name: string;
  description?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMins: number;
  maxStudents: number;
  isRecurring?: boolean;
  hybridPattern?: {
    patternType: 'ALTERNATING' | 'CUSTOM';
    groupWeeks: number[];
    individualWeeks: number[];
    individualSlotDuration: number;
    bookingDeadlineHours: number;
  };
}

export interface UpdateLessonInput {
  lessonTypeId?: string;
  termId?: string;
  teacherId?: string;
  roomId?: string;
  instrumentId?: string | null;
  name?: string;
  description?: string | null;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  durationMins?: number;
  maxStudents?: number;
  isRecurring?: boolean;
  isActive?: boolean;
  hybridPattern?: {
    patternType: 'ALTERNATING' | 'CUSTOM';
    groupWeeks: number[];
    individualWeeks: number[];
    individualSlotDuration: number;
    bookingDeadlineHours: number;
  } | null;
}

export interface AvailabilityResult {
  available: boolean;
  conflictingLesson?: Lesson;
}

export interface CapacityResult {
  current: number;
  max: number;
  available: number;
}

// ===========================================
// RESCHEDULE TYPES
// ===========================================

export interface ConflictCheckInput {
  newDayOfWeek: number;
  newStartTime: string;
  newEndTime: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  teacherConflict: {
    lessonId: string;
    lessonName: string;
    time: string;
  } | null;
  roomConflict: {
    lessonId: string;
    lessonName: string;
    time: string;
  } | null;
  affectedStudents: number;
  affectedEnrollments: {
    studentId: string;
    studentName: string;
    hasOtherLessons: boolean;
  }[];
}

export interface RescheduleInput {
  newDayOfWeek: number;
  newStartTime: string;
  newEndTime: string;
  notifyParents?: boolean;
  reason?: string;
}

// API Response wrapper type (internal use)
// ===========================================
// LESSONS API
// ===========================================
// Note: apiClient already extracts axios response.data, so the return type
// is the ApiResponse wrapper. We then extract .data to get the actual payload.

export const lessonsApi = {
  // Get all lessons with optional filters
  getAll: (filters?: LessonFilters): Promise<Lesson[]> =>
    apiClient
      .get<{ status: string; data: Lesson[] }>('/lessons', { params: filters })
      .then((res) => res.data),

  // Get a single lesson by ID
  getById: (id: string): Promise<Lesson> =>
    apiClient
      .get<{ status: string; data: Lesson }>(`/lessons/${id}`)
      .then((res) => res.data),

  // Create a new lesson
  create: (data: CreateLessonInput): Promise<Lesson> =>
    apiClient
      .post<{ status: string; data: Lesson }>('/lessons', data)
      .then((res) => res.data),

  // Update a lesson
  update: (id: string, data: UpdateLessonInput): Promise<Lesson> =>
    apiClient
      .patch<{ status: string; data: Lesson }>(`/lessons/${id}`, data)
      .then((res) => res.data),

  // Delete a lesson (soft delete)
  delete: (id: string): Promise<{ status: string }> =>
    apiClient.delete<{ status: string }>(`/lessons/${id}`),

  // ===========================================
  // ENROLLMENT OPERATIONS
  // ===========================================

  // Get enrollments for a lesson
  getEnrollments: (lessonId: string): Promise<LessonEnrollment[]> =>
    apiClient
      .get<{ status: string; data: LessonEnrollment[] }>(`/lessons/${lessonId}/enrollments`)
      .then((res) => res.data),

  // Enroll a single student
  enrollStudent: (lessonId: string, studentId: string): Promise<LessonEnrollment> =>
    apiClient
      .post<{ status: string; data: LessonEnrollment }>(`/lessons/${lessonId}/enrollments`, {
        studentId,
      })
      .then((res) => res.data),

  // Bulk enroll students
  bulkEnroll: (lessonId: string, studentIds: string[]): Promise<LessonEnrollment[]> =>
    apiClient
      .post<{ status: string; data: LessonEnrollment[] }>(
        `/lessons/${lessonId}/enrollments/bulk`,
        { studentIds }
      )
      .then((res) => res.data),

  // Unenroll a student
  unenrollStudent: (lessonId: string, studentId: string): Promise<{ status: string }> =>
    apiClient.delete<{ status: string }>(
      `/lessons/${lessonId}/enrollments/${studentId}`
    ),

  // ===========================================
  // AVAILABILITY CHECKS
  // ===========================================

  // Check room availability
  checkRoomAvailability: (
    roomId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeLessonId?: string
  ): Promise<AvailabilityResult> =>
    apiClient
      .get<{ status: string; data: AvailabilityResult }>('/lessons/check/room-availability', {
        params: { roomId, dayOfWeek, startTime, endTime, excludeLessonId },
      })
      .then((res) => res.data),

  // Check teacher availability
  checkTeacherAvailability: (
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeLessonId?: string
  ): Promise<AvailabilityResult> =>
    apiClient
      .get<{ status: string; data: AvailabilityResult }>(
        '/lessons/check/teacher-availability',
        {
          params: { teacherId, dayOfWeek, startTime, endTime, excludeLessonId },
        }
      )
      .then((res) => res.data),

  // Check enrollment capacity
  checkCapacity: (lessonId: string): Promise<CapacityResult> =>
    apiClient
      .get<{ status: string; data: CapacityResult }>(`/lessons/${lessonId}/capacity`)
      .then((res) => res.data),

  // ===========================================
  // RESCHEDULE OPERATIONS
  // ===========================================

  // Check for conflicts before rescheduling
  checkRescheduleConflicts: (
    lessonId: string,
    input: ConflictCheckInput
  ): Promise<ConflictCheckResult> =>
    apiClient
      .get<{ status: string; data: ConflictCheckResult }>(
        `/lessons/${lessonId}/check-conflicts`,
        { params: input }
      )
      .then((res) => res.data),

  // Reschedule a lesson
  reschedule: (lessonId: string, input: RescheduleInput): Promise<Lesson> =>
    apiClient
      .post<{ status: string; data: Lesson }>(`/lessons/${lessonId}/reschedule`, input)
      .then((res) => res.data),
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get day of week name from number
 */
export const getDayName = (dayOfWeek: number): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dayOfWeek] || '';
};

/**
 * Get short day name from number
 */
export const getShortDayName = (dayOfWeek: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] || '';
};

/**
 * Format time for display (e.g., "09:00" -> "9:00 AM")
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get lesson type color for chip
 */
export const getLessonTypeColor = (
  type: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (type) {
    case 'INDIVIDUAL':
      return 'primary';
    case 'GROUP':
      return 'success';
    case 'BAND':
      return 'warning';
    case 'HYBRID':
      return 'info';
    default:
      return 'primary';
  }
};

/**
 * Calculate end time from start time and duration
 */
export const calculateEndTime = (
  startTime: string,
  durationMins: number
): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMins;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes
    .toString()
    .padStart(2, '0')}`;
};
