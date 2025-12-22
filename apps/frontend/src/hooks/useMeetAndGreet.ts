// ===========================================
// Meet & Greet React Query Hooks
// ===========================================
// Custom hooks for meet & greet operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  meetAndGreetApi,
  meetAndGreetPublicApi,
  MeetAndGreetFormData,
  MeetAndGreetFilters,
} from '../api/meetAndGreet.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const meetAndGreetKeys = {
  all: ['meetAndGreets'] as const,
  lists: () => [...meetAndGreetKeys.all, 'list'] as const,
  list: (filters?: MeetAndGreetFilters) =>
    [...meetAndGreetKeys.lists(), filters] as const,
  details: () => [...meetAndGreetKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetAndGreetKeys.details(), id] as const,
  counts: () => [...meetAndGreetKeys.all, 'counts'] as const,
  // Public queries
  schoolInfo: (slug: string) => ['schoolInfo', slug] as const,
  schoolInstruments: (slug: string) => ['schoolInstruments', slug] as const,
};

// ===========================================
// PUBLIC HOOKS (No Auth)
// ===========================================

/**
 * Get school info by slug (for booking form)
 */
export function useSchoolInfo(schoolSlug: string) {
  return useQuery({
    queryKey: meetAndGreetKeys.schoolInfo(schoolSlug),
    queryFn: () => meetAndGreetPublicApi.getSchoolInfo(schoolSlug),
    enabled: !!schoolSlug,
    retry: false,
  });
}

/**
 * Get instruments for a school (for booking form dropdown)
 */
export function useSchoolInstruments(schoolSlug: string) {
  return useQuery({
    queryKey: meetAndGreetKeys.schoolInstruments(schoolSlug),
    queryFn: () => meetAndGreetPublicApi.getSchoolInstruments(schoolSlug),
    enabled: !!schoolSlug,
  });
}

/**
 * Create a new meet & greet booking
 */
export function useCreateMeetAndGreet() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: MeetAndGreetFormData) =>
      meetAndGreetPublicApi.create(data),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to create booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Verify email address
 */
export function useVerifyMeetAndGreet() {
  return useMutation({
    mutationFn: (token: string) => meetAndGreetPublicApi.verify(token),
  });
}

// ===========================================
// ADMIN HOOKS (Auth Required)
// ===========================================

/**
 * Get all meet & greets for school with optional filters
 */
export function useMeetAndGreets(filters?: MeetAndGreetFilters) {
  return useQuery({
    queryKey: meetAndGreetKeys.list(filters),
    queryFn: () => meetAndGreetApi.getAll(filters),
  });
}

/**
 * Get meet & greet counts by status (for dashboard)
 */
export function useMeetAndGreetCounts() {
  return useQuery({
    queryKey: meetAndGreetKeys.counts(),
    queryFn: () => meetAndGreetApi.getCounts(),
  });
}

/**
 * Get single meet & greet by ID
 */
export function useMeetAndGreet(id: string) {
  return useQuery({
    queryKey: meetAndGreetKeys.detail(id),
    queryFn: () => meetAndGreetApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Update a meet & greet
 */
export function useUpdateMeetAndGreet() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        assignedTeacherId?: string | null;
        scheduledDateTime?: string | null;
        followUpNotes?: string | null;
      };
    }) => meetAndGreetApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetAndGreetKeys.all });
      enqueueSnackbar('Meet & greet updated', { variant: 'success' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Approve a meet & greet and send registration link
 */
export function useApproveMeetAndGreet() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => meetAndGreetApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetAndGreetKeys.all });
      enqueueSnackbar('Registration email sent to parent', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to approve';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Reject a meet & greet with reason
 */
export function useRejectMeetAndGreet() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      meetAndGreetApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetAndGreetKeys.all });
      enqueueSnackbar('Meet & greet rejected', { variant: 'info' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

/**
 * Cancel a meet & greet
 */
export function useCancelMeetAndGreet() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => meetAndGreetApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetAndGreetKeys.all });
      enqueueSnackbar('Meet & greet cancelled', { variant: 'info' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to cancel';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}
