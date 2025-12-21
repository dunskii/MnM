// ===========================================
// Admin React Query Hooks
// ===========================================
// Custom hooks for admin API operations with React Query

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  termsApi,
  locationsApi,
  roomsApi,
  instrumentsApi,
  lessonTypesApi,
  lessonDurationsApi,
  schoolApi,
  Term,
  Location,
  Room,
  Instrument,
  LessonType,
  LessonDuration,
  SchoolSettings,
} from '../api/admin.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const adminKeys = {
  all: ['admin'] as const,
  school: () => [...adminKeys.all, 'school'] as const,
  terms: () => [...adminKeys.all, 'terms'] as const,
  term: (id: string) => [...adminKeys.terms(), id] as const,
  locations: () => [...adminKeys.all, 'locations'] as const,
  location: (id: string) => [...adminKeys.locations(), id] as const,
  rooms: (locationId?: string) => [...adminKeys.all, 'rooms', locationId] as const,
  room: (id: string) => [...adminKeys.all, 'rooms', 'detail', id] as const,
  instruments: () => [...adminKeys.all, 'instruments'] as const,
  lessonTypes: () => [...adminKeys.all, 'lessonTypes'] as const,
  lessonDurations: () => [...adminKeys.all, 'lessonDurations'] as const,
};

// ===========================================
// SCHOOL SETTINGS HOOKS
// ===========================================

export function useSchoolSettings() {
  return useQuery({
    queryKey: adminKeys.school(),
    queryFn: schoolApi.getSettings,
  });
}

export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SchoolSettings>) => schoolApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.school() });
    },
  });
}

// ===========================================
// TERMS HOOKS
// ===========================================

export function useTerms() {
  return useQuery({
    queryKey: adminKeys.terms(),
    queryFn: termsApi.getAll,
  });
}

export function useTerm(id: string) {
  return useQuery({
    queryKey: adminKeys.term(id),
    queryFn: () => termsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
      termsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.terms() });
    },
  });
}

export function useUpdateTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Term> }) =>
      termsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.terms() });
    },
  });
}

export function useDeleteTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => termsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.terms() });
    },
  });
}

// ===========================================
// LOCATIONS HOOKS
// ===========================================

export function useLocations() {
  return useQuery({
    queryKey: adminKeys.locations(),
    queryFn: locationsApi.getAll,
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: adminKeys.location(id),
    queryFn: () => locationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; address?: string; phone?: string }) =>
      locationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Location> }) =>
      locationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
    },
  });
}

// ===========================================
// ROOMS HOOKS
// ===========================================

export function useRooms(locationId?: string) {
  return useQuery({
    queryKey: adminKeys.rooms(locationId),
    queryFn: () => roomsApi.getAll(locationId),
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: adminKeys.room(id),
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { locationId: string; name: string; capacity?: number }) =>
      roomsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) =>
      roomsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rooms() });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
    },
  });
}

// ===========================================
// INSTRUMENTS HOOKS
// ===========================================

export function useInstruments() {
  return useQuery({
    queryKey: adminKeys.instruments(),
    queryFn: instrumentsApi.getAll,
  });
}

export function useCreateInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; sortOrder?: number }) =>
      instrumentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.instruments() });
    },
  });
}

export function useUpdateInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Instrument> }) =>
      instrumentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.instruments() });
    },
  });
}

export function useDeleteInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => instrumentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.instruments() });
    },
  });
}

// ===========================================
// LESSON TYPES HOOKS
// ===========================================

export function useLessonTypes() {
  return useQuery({
    queryKey: adminKeys.lessonTypes(),
    queryFn: lessonTypesApi.getAll,
  });
}

export function useCreateLessonType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      type: 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID';
      defaultDuration: number;
      description?: string;
    }) => lessonTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lessonTypes() });
    },
  });
}

export function useUpdateLessonType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LessonType> }) =>
      lessonTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lessonTypes() });
    },
  });
}

export function useDeleteLessonType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lessonTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lessonTypes() });
    },
  });
}

// ===========================================
// LESSON DURATIONS HOOKS
// ===========================================

export function useLessonDurations() {
  return useQuery({
    queryKey: adminKeys.lessonDurations(),
    queryFn: lessonDurationsApi.getAll,
  });
}

export function useCreateLessonDuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { minutes: number }) => lessonDurationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lessonDurations() });
    },
  });
}

export function useUpdateLessonDuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LessonDuration> }) =>
      lessonDurationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lessonDurations() });
    },
  });
}

export function useDeleteLessonDuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lessonDurationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lessonDurations() });
    },
  });
}
