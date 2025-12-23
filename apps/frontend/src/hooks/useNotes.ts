// ===========================================
// Notes React Query Hooks
// ===========================================
// Custom hooks for teacher notes API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  notesApi,
  CreateNoteInput,
  UpdateNoteInput,
  NotesByLessonFilter,
  NotesByStudentFilter,
  NotesByDateFilter,
  WeeklySummaryFilter,
  IncompleteNotesFilter,
} from '../api/notes.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const notesKeys = {
  all: ['notes'] as const,
  detail: (id: string) =>
    [...notesKeys.all, 'detail', id] as const,
  byLesson: (lessonId: string, filters?: NotesByLessonFilter) =>
    [...notesKeys.all, 'lesson', lessonId, filters] as const,
  lessonCompletion: (lessonId: string, date: string) =>
    [...notesKeys.all, 'completion', lessonId, date] as const,
  byStudent: (studentId: string, filters?: NotesByStudentFilter) =>
    [...notesKeys.all, 'student', studentId, filters] as const,
  byDate: (date: string, filters?: NotesByDateFilter) =>
    [...notesKeys.all, 'date', date, filters] as const,
  teacherWeekly: (teacherId: string, filters?: WeeklySummaryFilter) =>
    [...notesKeys.all, 'teacher', teacherId, 'weekly', filters] as const,
  teacherPending: (teacherId: string) =>
    [...notesKeys.all, 'teacher', teacherId, 'pending'] as const,
  schoolWeekly: (filters?: WeeklySummaryFilter) =>
    [...notesKeys.all, 'school', 'weekly', filters] as const,
  incomplete: (filters?: IncompleteNotesFilter) =>
    [...notesKeys.all, 'incomplete', filters] as const,
};

// ===========================================
// QUERIES
// ===========================================

/**
 * Get a single note by ID
 */
export function useNote(id: string) {
  return useQuery({
    queryKey: notesKeys.detail(id),
    queryFn: () => notesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Get notes for a lesson
 */
export function useNotesByLesson(lessonId: string, filters?: NotesByLessonFilter) {
  return useQuery({
    queryKey: notesKeys.byLesson(lessonId, filters),
    queryFn: () => notesApi.getByLesson(lessonId, filters),
    enabled: !!lessonId,
  });
}

/**
 * Get note completion status for a lesson on a specific date
 */
export function useLessonNoteCompletion(lessonId: string, date: string) {
  return useQuery({
    queryKey: notesKeys.lessonCompletion(lessonId, date),
    queryFn: () => notesApi.getLessonCompletion(lessonId, date),
    enabled: !!lessonId && !!date,
  });
}

/**
 * Get notes for a student
 */
export function useNotesByStudent(studentId: string, filters?: NotesByStudentFilter) {
  return useQuery({
    queryKey: notesKeys.byStudent(studentId, filters),
    queryFn: () => notesApi.getByStudent(studentId, filters),
    enabled: !!studentId,
  });
}

/**
 * Get all notes for a specific date
 */
export function useNotesByDate(date: string, filters?: NotesByDateFilter) {
  return useQuery({
    queryKey: notesKeys.byDate(date, filters),
    queryFn: () => notesApi.getByDate(date, filters),
    enabled: !!date,
  });
}

/**
 * Get weekly note completion summary for a teacher
 */
export function useTeacherWeeklySummary(teacherId: string, filters?: WeeklySummaryFilter) {
  return useQuery({
    queryKey: notesKeys.teacherWeekly(teacherId, filters),
    queryFn: () => notesApi.getTeacherWeeklySummary(teacherId, filters),
    enabled: !!teacherId,
  });
}

/**
 * Get pending notes count for a teacher (dashboard widget)
 */
export function useTeacherPendingNotes(teacherId: string) {
  return useQuery({
    queryKey: notesKeys.teacherPending(teacherId),
    queryFn: () => notesApi.getTeacherPendingCount(teacherId),
    enabled: !!teacherId,
  });
}

/**
 * Get school-wide note completion summary for a week (admin only)
 */
export function useSchoolWeeklySummary(filters?: WeeklySummaryFilter) {
  return useQuery({
    queryKey: notesKeys.schoolWeekly(filters),
    queryFn: () => notesApi.getSchoolWeeklySummary(filters),
  });
}

/**
 * Get all incomplete notes (admin only)
 */
export function useIncompleteNotes(filters?: IncompleteNotesFilter) {
  return useQuery({
    queryKey: notesKeys.incomplete(filters),
    queryFn: () => notesApi.getIncomplete(filters),
  });
}

// ===========================================
// MUTATIONS
// ===========================================

/**
 * Create a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: CreateNoteInput) => notesApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      if (variables.lessonId) {
        queryClient.invalidateQueries({
          queryKey: notesKeys.byLesson(variables.lessonId),
        });
        queryClient.invalidateQueries({
          queryKey: notesKeys.lessonCompletion(variables.lessonId, variables.date),
        });
      }
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: notesKeys.byStudent(variables.studentId),
        });
      }
      enqueueSnackbar('Note saved successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to save note', { variant: 'error' });
    },
  });
}

/**
 * Update an existing note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteInput }) =>
      notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      enqueueSnackbar('Note updated successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update note', { variant: 'error' });
    },
  });
}

/**
 * Delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      enqueueSnackbar('Note deleted successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to delete note', { variant: 'error' });
    },
  });
}
