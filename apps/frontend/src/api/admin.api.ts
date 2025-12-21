// ===========================================
// Admin API Functions
// ===========================================
// API calls for admin configuration endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: { lessons: number };
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  rooms: Room[];
  _count?: { rooms: number };
}

export interface Room {
  id: string;
  locationId: string;
  name: string;
  capacity: number;
  isActive: boolean;
  location?: Location;
}

export interface Instrument {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LessonType {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID';
  defaultDuration: number;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface LessonDuration {
  id: string;
  minutes: number;
  isActive: boolean;
}

export interface SchoolSettings {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  branding: Record<string, unknown>;
  isActive: boolean;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

// ===========================================
// SCHOOL SETTINGS
// ===========================================

export const schoolApi = {
  getSettings: () =>
    apiClient.get<ApiResponse<SchoolSettings>>('/admin/school/settings')
      .then((res) => res.data),

  updateSettings: (data: Partial<SchoolSettings>) =>
    apiClient.patch<ApiResponse<SchoolSettings>>('/admin/school/settings', data)
      .then((res) => res.data),
};

// ===========================================
// TERMS
// ===========================================

export const termsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Term[]>>('/admin/terms')
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Term>>(`/admin/terms/${id}`)
      .then((res) => res.data),

  create: (data: { name: string; startDate: string; endDate: string }) =>
    apiClient.post<ApiResponse<Term>>('/admin/terms', data)
      .then((res) => res.data),

  update: (id: string, data: Partial<Term>) =>
    apiClient.patch<ApiResponse<Term>>(`/admin/terms/${id}`, data)
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/terms/${id}`),
};

// ===========================================
// LOCATIONS
// ===========================================

export const locationsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Location[]>>('/admin/locations')
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Location>>(`/admin/locations/${id}`)
      .then((res) => res.data),

  create: (data: { name: string; address?: string; phone?: string }) =>
    apiClient.post<ApiResponse<Location>>('/admin/locations', data)
      .then((res) => res.data),

  update: (id: string, data: Partial<Location>) =>
    apiClient.patch<ApiResponse<Location>>(`/admin/locations/${id}`, data)
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/locations/${id}`),
};

// ===========================================
// ROOMS
// ===========================================

export const roomsApi = {
  getAll: (locationId?: string) =>
    apiClient.get<ApiResponse<Room[]>>('/admin/rooms', {
      params: locationId ? { locationId } : undefined,
    }).then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Room>>(`/admin/rooms/${id}`)
      .then((res) => res.data),

  create: (data: { locationId: string; name: string; capacity?: number }) =>
    apiClient.post<ApiResponse<Room>>('/admin/rooms', data)
      .then((res) => res.data),

  update: (id: string, data: Partial<Room>) =>
    apiClient.patch<ApiResponse<Room>>(`/admin/rooms/${id}`, data)
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/rooms/${id}`),
};

// ===========================================
// INSTRUMENTS
// ===========================================

export const instrumentsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Instrument[]>>('/admin/instruments')
      .then((res) => res.data),

  create: (data: { name: string; sortOrder?: number }) =>
    apiClient.post<ApiResponse<Instrument>>('/admin/instruments', data)
      .then((res) => res.data),

  update: (id: string, data: Partial<Instrument>) =>
    apiClient.patch<ApiResponse<Instrument>>(`/admin/instruments/${id}`, data)
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/instruments/${id}`),
};

// ===========================================
// LESSON TYPES
// ===========================================

export const lessonTypesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<LessonType[]>>('/admin/lesson-types')
      .then((res) => res.data),

  create: (data: {
    name: string;
    type: 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID';
    defaultDuration: number;
    description?: string;
  }) =>
    apiClient.post<ApiResponse<LessonType>>('/admin/lesson-types', data)
      .then((res) => res.data),

  update: (id: string, data: Partial<LessonType>) =>
    apiClient.patch<ApiResponse<LessonType>>(`/admin/lesson-types/${id}`, data)
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/lesson-types/${id}`),
};

// ===========================================
// LESSON DURATIONS
// ===========================================

export const lessonDurationsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<LessonDuration[]>>('/admin/lesson-durations')
      .then((res) => res.data),

  create: (data: { minutes: number }) =>
    apiClient.post<ApiResponse<LessonDuration>>('/admin/lesson-durations', data)
      .then((res) => res.data),

  update: (id: string, data: Partial<LessonDuration>) =>
    apiClient.patch<ApiResponse<LessonDuration>>(`/admin/lesson-durations/${id}`, data)
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/lesson-durations/${id}`),
};
