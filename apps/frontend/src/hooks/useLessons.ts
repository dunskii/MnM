// ===========================================
// Lessons React Query Hooks
// ===========================================
// Custom hooks for lesson management API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  lessonsApi,
  LessonFilters,
  CreateLessonInput,
  UpdateLessonInput,
} from '../api/lessons.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  list: (filters?: LessonFilters) => [...lessonKeys.lists(), filters] as const,
  details: () => [...lessonKeys.all, 'detail'] as const,
  detail: (id: string) => [...lessonKeys.details(), id] as const,
  enrollments: (lessonId: string) =>
    [...lessonKeys.all, 'enrollments', lessonId] as const,
  capacity: (lessonId: string) =>
    [...lessonKeys.all, 'capacity', lessonId] as const,
};

// ===========================================
// LESSON QUERIES
// ===========================================

/**
 * Get all lessons with optional filters
 * Note: lessonsApi already extracts .data from ApiResponse wrapper
 */
export function useLessons(filters?: LessonFilters) {
  return useQuery({
    queryKey: lessonKeys.list(filters),
    queryFn: () => lessonsApi.getAll(filters),
  });
}

/**
 * Get a single lesson by ID
 * Note: lessonsApi already extracts .data from ApiResponse wrapper
 */
export function useLesson(id: string) {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => lessonsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Get enrollments for a lesson
 * Note: lessonsApi already extracts .data from ApiResponse wrapper
 */
export function useLessonEnrollments(lessonId: string) {
  return useQuery({
    queryKey: lessonKeys.enrollments(lessonId),
    queryFn: () => lessonsApi.getEnrollments(lessonId),
    enabled: !!lessonId,
  });
}

/**
 * Get enrollment capacity for a lesson
 * Note: lessonsApi already extracts .data from ApiResponse wrapper
 */
export function useLessonCapacity(lessonId: string) {
  return useQuery({
    queryKey: lessonKeys.capacity(lessonId),
    queryFn: () => lessonsApi.checkCapacity(lessonId),
    enabled: !!lessonId,
  });
}

// ===========================================
// LESSON MUTATIONS
// ===========================================

/**
 * Create a new lesson
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: CreateLessonInput) => lessonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar('Lesson created successfully', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to create lesson';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Update a lesson
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonInput }) =>
      lessonsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.id),
      });
      enqueueSnackbar('Lesson updated successfully', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to update lesson';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Delete a lesson (soft delete)
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => lessonsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar('Lesson deleted successfully', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to delete lesson';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// ===========================================
// ENROLLMENT MUTATIONS
// ===========================================

/**
 * Enroll a student in a lesson
 */
export function useEnrollStudent() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      lessonId,
      studentId,
    }: {
      lessonId: string;
      studentId: string;
    }) => lessonsApi.enrollStudent(lessonId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: lessonKeys.enrollments(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.capacity(variables.lessonId),
      });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar('Student enrolled successfully', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to enroll student';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Bulk enroll students in a lesson
 */
export function useBulkEnrollStudents() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      lessonId,
      studentIds,
    }: {
      lessonId: string;
      studentIds: string[];
    }) => lessonsApi.bulkEnroll(lessonId, studentIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: lessonKeys.enrollments(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.capacity(variables.lessonId),
      });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar(`${variables.studentIds.length} students enrolled successfully`, { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to enroll students';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Unenroll a student from a lesson
 */
export function useUnenrollStudent() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      lessonId,
      studentId,
    }: {
      lessonId: string;
      studentId: string;
    }) => lessonsApi.unenrollStudent(lessonId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: lessonKeys.enrollments(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonKeys.capacity(variables.lessonId),
      });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      enqueueSnackbar('Student removed from lesson', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to remove student';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// ===========================================
// AVAILABILITY CHECK HOOKS
// ===========================================

/**
 * Check room availability
 */
export function useCheckRoomAvailability() {
  return useMutation({
    mutationFn: ({
      roomId,
      dayOfWeek,
      startTime,
      endTime,
      excludeLessonId,
    }: {
      roomId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      excludeLessonId?: string;
    }) =>
      lessonsApi.checkRoomAvailability(
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        excludeLessonId
      ),
  });
}

/**
 * Check teacher availability
 */
export function useCheckTeacherAvailability() {
  return useMutation({
    mutationFn: ({
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      excludeLessonId,
    }: {
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      excludeLessonId?: string;
    }) =>
      lessonsApi.checkTeacherAvailability(
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        excludeLessonId
      ),
  });
}
