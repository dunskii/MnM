// ===========================================
// Attendance React Query Hooks
// ===========================================
// Custom hooks for attendance API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  attendanceApi,
  MarkAttendanceInput,
  BatchMarkAttendanceInput,
  UpdateAttendanceInput,
  AttendanceByLessonFilter,
  AttendanceByStudentFilter,
  AttendanceReportFilter,
  TodayAttendanceFilter,
} from '../api/attendance.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const attendanceKeys = {
  all: ['attendance'] as const,
  today: (filters?: TodayAttendanceFilter) =>
    [...attendanceKeys.all, 'today', filters] as const,
  detail: (id: string) =>
    [...attendanceKeys.all, 'detail', id] as const,
  byLesson: (lessonId: string, filters?: AttendanceByLessonFilter) =>
    [...attendanceKeys.all, 'lesson', lessonId, filters] as const,
  enrolledStudents: (lessonId: string, date: string) =>
    [...attendanceKeys.all, 'students', lessonId, date] as const,
  report: (lessonId: string, filters?: AttendanceReportFilter) =>
    [...attendanceKeys.all, 'report', lessonId, filters] as const,
  byStudent: (studentId: string, filters?: AttendanceByStudentFilter) =>
    [...attendanceKeys.all, 'student', studentId, filters] as const,
  studentStats: (studentId: string) =>
    [...attendanceKeys.all, 'stats', studentId] as const,
};

// ===========================================
// QUERIES
// ===========================================

/**
 * Get today's attendance for the school
 */
export function useTodayAttendance(filters?: TodayAttendanceFilter) {
  return useQuery({
    queryKey: attendanceKeys.today(filters),
    queryFn: () => attendanceApi.getToday(filters),
  });
}

/**
 * Get a single attendance record
 */
export function useAttendance(id: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => attendanceApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Get attendance records for a lesson
 */
export function useAttendanceByLesson(lessonId: string, filters?: AttendanceByLessonFilter) {
  return useQuery({
    queryKey: attendanceKeys.byLesson(lessonId, filters),
    queryFn: () => attendanceApi.getByLesson(lessonId, filters),
    enabled: !!lessonId,
  });
}

/**
 * Get enrolled students with attendance for a lesson on a specific date
 */
export function useEnrolledStudentsForAttendance(lessonId: string, date: string) {
  return useQuery({
    queryKey: attendanceKeys.enrolledStudents(lessonId, date),
    queryFn: () => attendanceApi.getEnrolledStudents(lessonId, date),
    enabled: !!lessonId && !!date,
  });
}

/**
 * Get attendance report for a lesson
 */
export function useAttendanceReport(lessonId: string, filters?: AttendanceReportFilter) {
  return useQuery({
    queryKey: attendanceKeys.report(lessonId, filters),
    queryFn: () => attendanceApi.getReport(lessonId, filters),
    enabled: !!lessonId,
  });
}

/**
 * Get attendance history for a student
 */
export function useAttendanceByStudent(studentId: string, filters?: AttendanceByStudentFilter) {
  return useQuery({
    queryKey: attendanceKeys.byStudent(studentId, filters),
    queryFn: () => attendanceApi.getByStudent(studentId, filters),
    enabled: !!studentId,
  });
}

/**
 * Get attendance statistics for a student
 */
export function useStudentAttendanceStats(studentId: string) {
  return useQuery({
    queryKey: attendanceKeys.studentStats(studentId),
    queryFn: () => attendanceApi.getStudentStats(studentId),
    enabled: !!studentId,
  });
}

// ===========================================
// MUTATIONS
// ===========================================

/**
 * Mark attendance for a single student
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: MarkAttendanceInput) => attendanceApi.mark(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byLesson(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byStudent(variables.studentId),
      });
      enqueueSnackbar('Attendance marked successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to mark attendance', { variant: 'error' });
    },
  });
}

/**
 * Mark attendance for multiple students in a lesson
 */
export function useBatchMarkAttendance() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: BatchMarkAttendanceInput) => attendanceApi.batchMark(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byLesson(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.enrolledStudents(variables.lessonId, variables.date),
      });
      enqueueSnackbar('Attendance saved successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to save attendance', { variant: 'error' });
    },
  });
}

/**
 * Update an existing attendance record
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttendanceInput }) =>
      attendanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      enqueueSnackbar('Attendance updated successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update attendance', { variant: 'error' });
    },
  });
}
