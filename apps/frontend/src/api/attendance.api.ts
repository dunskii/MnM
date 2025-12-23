// ===========================================
// Attendance API Functions
// ===========================================
// API calls for attendance tracking endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'CANCELLED';

export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  absenceReason: string | null;
  createdAt: string;
  updatedAt: string;
  lesson: {
    id: string;
    name: string;
    teacher: {
      user: { id: string; firstName: string; lastName: string };
    };
    room: {
      name: string;
      location: { name: string };
    };
    instrument: { name: string } | null;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    ageGroup: string;
  };
}

export interface MarkAttendanceInput {
  lessonId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  absenceReason?: string;
}

export interface SingleAttendanceInput {
  studentId: string;
  status: AttendanceStatus;
  absenceReason?: string;
}

export interface BatchMarkAttendanceInput {
  lessonId: string;
  date: string;
  attendances: SingleAttendanceInput[];
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  absenceReason?: string | null;
}

export interface AttendanceByLessonFilter {
  date?: string;
  status?: AttendanceStatus;
}

export interface AttendanceByStudentFilter {
  lessonId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface AttendanceReportFilter {
  startDate?: string;
  endDate?: string;
}

export interface TodayAttendanceFilter {
  locationId?: string;
  teacherId?: string;
}

export interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  cancelled: number;
  attendanceRate: number;
}

export interface AttendanceReport {
  lessonId: string;
  lessonName: string;
  totalSessions: number;
  studentStats: StudentAttendanceStats[];
}

export interface EnrolledStudentForAttendance {
  id: string;
  firstName: string;
  lastName: string;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    absenceReason: string | null;
  };
}

// ===========================================
// ATTENDANCE API
// ===========================================

export const attendanceApi = {
  // ===========================================
  // MARK ATTENDANCE
  // ===========================================

  /**
   * Mark attendance for a single student
   */
  mark: (data: MarkAttendanceInput): Promise<Attendance> =>
    apiClient
      .post<{ status: string; data: Attendance }>('/attendance', data)
      .then((res) => res.data),

  /**
   * Mark attendance for multiple students in a lesson
   */
  batchMark: (data: BatchMarkAttendanceInput): Promise<Attendance[]> =>
    apiClient
      .post<{ status: string; data: Attendance[] }>('/attendance/batch', data)
      .then((res) => res.data),

  /**
   * Update an existing attendance record
   */
  update: (id: string, data: UpdateAttendanceInput): Promise<Attendance> =>
    apiClient
      .patch<{ status: string; data: Attendance }>(`/attendance/${id}`, data)
      .then((res) => res.data),

  // ===========================================
  // GET ATTENDANCE
  // ===========================================

  /**
   * Get a single attendance record
   */
  getById: (id: string): Promise<Attendance> =>
    apiClient
      .get<{ status: string; data: Attendance }>(`/attendance/${id}`)
      .then((res) => res.data),

  /**
   * Get today's attendance for the school
   */
  getToday: (filters?: TodayAttendanceFilter): Promise<Attendance[]> =>
    apiClient
      .get<{ status: string; data: Attendance[] }>('/attendance/today', {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get attendance records for a lesson
   */
  getByLesson: (lessonId: string, filters?: AttendanceByLessonFilter): Promise<Attendance[]> =>
    apiClient
      .get<{ status: string; data: Attendance[] }>(`/attendance/lesson/${lessonId}`, {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get enrolled students for a lesson with their attendance for a date
   */
  getEnrolledStudents: (
    lessonId: string,
    date: string
  ): Promise<{ students: EnrolledStudentForAttendance[] }> =>
    apiClient
      .get<{ status: string; data: { students: EnrolledStudentForAttendance[] } }>(
        `/attendance/lesson/${lessonId}/students`,
        { params: { date } }
      )
      .then((res) => res.data),

  /**
   * Get attendance report for a lesson
   */
  getReport: (lessonId: string, filters?: AttendanceReportFilter): Promise<AttendanceReport> =>
    apiClient
      .get<{ status: string; data: AttendanceReport }>(
        `/attendance/lesson/${lessonId}/report`,
        { params: filters }
      )
      .then((res) => res.data),

  /**
   * Get attendance history for a student
   */
  getByStudent: (studentId: string, filters?: AttendanceByStudentFilter): Promise<Attendance[]> =>
    apiClient
      .get<{ status: string; data: Attendance[] }>(`/attendance/student/${studentId}`, {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get attendance statistics for a student
   */
  getStudentStats: (studentId: string): Promise<StudentAttendanceStats> =>
    apiClient
      .get<{ status: string; data: StudentAttendanceStats }>(
        `/attendance/student/${studentId}/stats`
      )
      .then((res) => res.data),
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get attendance status color for chip/badge
 * Uses Music 'n Me brand colors
 */
export const getAttendanceStatusColor = (
  status: AttendanceStatus
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'PRESENT':
      return 'success';
    case 'ABSENT':
      return 'error';
    case 'LATE':
      return 'warning';
    case 'EXCUSED':
      return 'info';
    case 'CANCELLED':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get attendance status label for display
 */
export const getAttendanceStatusLabel = (status: AttendanceStatus): string => {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'ABSENT':
      return 'Absent';
    case 'LATE':
      return 'Late';
    case 'EXCUSED':
      return 'Excused';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

/**
 * Check if status requires absence reason
 */
export const requiresAbsenceReason = (status: AttendanceStatus): boolean => {
  return status === 'ABSENT' || status === 'EXCUSED';
};

/**
 * Format attendance rate as percentage string
 */
export const formatAttendanceRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};
