// ===========================================
// Resources React Query Hooks
// ===========================================
// Custom hooks for resource upload and management API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  resourcesApi,
  UploadResourceInput,
  UpdateResourceInput,
  ResourcesByLessonFilter,
  ResourcesByStudentFilter,
  triggerDownload,
} from '../api/resources.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const resourcesKeys = {
  all: ['resources'] as const,
  detail: (id: string) =>
    [...resourcesKeys.all, 'detail', id] as const,
  byLesson: (lessonId: string, filters?: ResourcesByLessonFilter) =>
    [...resourcesKeys.all, 'lesson', lessonId, filters] as const,
  byStudent: (studentId: string, filters?: ResourcesByStudentFilter) =>
    [...resourcesKeys.all, 'student', studentId, filters] as const,
  stats: () =>
    [...resourcesKeys.all, 'stats'] as const,
};

// ===========================================
// QUERIES
// ===========================================

/**
 * Get a single resource by ID
 */
export function useResource(id: string) {
  return useQuery({
    queryKey: resourcesKeys.detail(id),
    queryFn: () => resourcesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Get resources for a lesson
 */
export function useResourcesByLesson(lessonId: string, filters?: ResourcesByLessonFilter) {
  return useQuery({
    queryKey: resourcesKeys.byLesson(lessonId, filters),
    queryFn: () => resourcesApi.getByLesson(lessonId, filters),
    enabled: !!lessonId,
  });
}

/**
 * Get resources for a student
 */
export function useResourcesByStudent(studentId: string, filters?: ResourcesByStudentFilter) {
  return useQuery({
    queryKey: resourcesKeys.byStudent(studentId, filters),
    queryFn: () => resourcesApi.getByStudent(studentId, filters),
    enabled: !!studentId,
  });
}

/**
 * Get resource statistics for the school (admin only)
 */
export function useResourceStats() {
  return useQuery({
    queryKey: resourcesKeys.stats(),
    queryFn: () => resourcesApi.getStats(),
  });
}

// ===========================================
// MUTATIONS
// ===========================================

/**
 * Upload a new resource
 */
export function useUploadResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (input: UploadResourceInput) => resourcesApi.upload(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      if (variables.lessonId) {
        queryClient.invalidateQueries({
          queryKey: resourcesKeys.byLesson(variables.lessonId),
        });
      }
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: resourcesKeys.byStudent(variables.studentId),
        });
      }
      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to upload file', { variant: 'error' });
    },
  });
}

/**
 * Update resource metadata
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceInput }) =>
      resourcesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      enqueueSnackbar('Resource updated successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update resource', { variant: 'error' });
    },
  });
}

/**
 * Delete a resource
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      enqueueSnackbar('Resource deleted successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to delete resource', { variant: 'error' });
    },
  });
}

/**
 * Download a resource file
 */
export function useDownloadResource() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => resourcesApi.download(id),
    onSuccess: ({ blob, fileName }) => {
      triggerDownload(blob, fileName);
      enqueueSnackbar('Download started', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to download file', { variant: 'error' });
    },
  });
}
