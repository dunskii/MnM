// ===========================================
// Users API Functions
// ===========================================
// API calls for user management endpoints (teachers, parents, students, families)

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
  isActive: boolean;
}

export interface Instrument {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface TeacherInstrument {
  id: string;
  instrument: Instrument;
  isPrimary: boolean;
}

export interface Teacher {
  id: string;
  userId: string;
  bio: string | null;
  isActive: boolean;
  user: User;
  instruments: TeacherInstrument[];
}

export interface Contact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isEmergency?: boolean;
}

export interface Parent {
  id: string;
  userId: string;
  familyId: string;
  contact1: Contact;
  contact2: Contact | null;
  emergencyContact: Contact;
  isActive: boolean;
  user: User;
  family?: Family;
}

export interface Student {
  id: string;
  familyId: string | null;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  ageGroup: 'PRESCHOOL' | 'KIDS' | 'TEENS' | 'ADULT';
  notes: string | null;
  isActive: boolean;
  family?: Family;
}

export interface Family {
  id: string;
  name: string;
  isActive: boolean;
  parents?: Parent[];
  students?: Student[];
  _count?: { parents: number; students: number };
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

// ===========================================
// TEACHERS
// ===========================================

export const teachersApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Teacher[]>>('/teachers').then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Teacher>>(`/teachers/${id}`).then((res) => res.data),

  create: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password?: string;
    bio?: string;
    instrumentIds?: string[];
  }) => apiClient.post<ApiResponse<Teacher>>('/teachers', data).then((res) => res.data),

  update: (id: string, data: Partial<{ firstName: string; lastName: string; phone: string; bio: string; isActive: boolean }>) =>
    apiClient.patch<ApiResponse<Teacher>>(`/teachers/${id}`, data).then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/teachers/${id}`),

  // Instrument management
  assignInstrument: (teacherId: string, instrumentId: string, isPrimary?: boolean) =>
    apiClient.post<ApiResponse<void>>(`/teachers/${teacherId}/instruments`, {
      instrumentId,
      isPrimary,
    }),

  removeInstrument: (teacherId: string, instrumentId: string) =>
    apiClient.delete<ApiResponse<void>>(`/teachers/${teacherId}/instruments/${instrumentId}`),

  setPrimaryInstrument: (teacherId: string, instrumentId: string) =>
    apiClient.patch<ApiResponse<void>>(`/teachers/${teacherId}/instruments/${instrumentId}/primary`, {}),
};

// ===========================================
// PARENTS
// ===========================================

export const parentsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Parent[]>>('/parents').then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Parent>>(`/parents/${id}`).then((res) => res.data),

  create: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password?: string;
    familyName?: string;
    contact1: Contact;
    contact2?: Contact;
    emergencyContact: Contact;
  }) => apiClient.post<ApiResponse<Parent>>('/parents', data).then((res) => res.data),

  update: (
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      contact1: Contact;
      contact2: Contact | null;
      emergencyContact: Contact;
      isActive: boolean;
    }>
  ) => apiClient.patch<ApiResponse<Parent>>(`/parents/${id}`, data).then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/parents/${id}`),
};

// ===========================================
// STUDENTS
// ===========================================

export const studentsApi = {
  getAll: (): Promise<Student[]> =>
    apiClient.get<{ status: string; data: Student[] }>('/students').then((res) => res.data),

  getById: (id: string): Promise<Student> =>
    apiClient.get<{ status: string; data: Student }>(`/students/${id}`).then((res) => res.data),

  create: (data: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    familyId?: string;
    notes?: string;
  }): Promise<Student> => apiClient.post<{ status: string; data: Student }>('/students', data).then((res) => res.data),

  update: (
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      birthDate: string | null;
      notes: string | null;
      isActive: boolean;
    }>
  ): Promise<Student> => apiClient.patch<{ status: string; data: Student }>(`/students/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<{ status: string }> =>
    apiClient.delete<{ status: string }>(`/students/${id}`),

  // Family management
  assignToFamily: (studentId: string, familyId: string): Promise<Student> =>
    apiClient.post<{ status: string; data: Student }>(`/students/${studentId}/family`, { familyId }).then((res) => res.data),

  removeFromFamily: (studentId: string): Promise<Student> =>
    apiClient.delete<{ status: string; data: Student }>(`/students/${studentId}/family`).then((res) => res.data),
};

// ===========================================
// FAMILIES
// ===========================================

export const familiesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Family[]>>('/families').then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Family>>(`/families/${id}`).then((res) => res.data),

  create: (data: { name: string }) =>
    apiClient.post<ApiResponse<Family>>('/families', data).then((res) => res.data),

  update: (id: string, data: Partial<{ name: string; isActive: boolean }>) =>
    apiClient.patch<ApiResponse<Family>>(`/families/${id}`, data).then((res) => res.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/families/${id}`),

  // Member management
  addStudent: (familyId: string, studentId: string) =>
    apiClient.post<ApiResponse<void>>(`/families/${familyId}/students`, { studentId }),

  removeStudent: (familyId: string, studentId: string) =>
    apiClient.delete<ApiResponse<void>>(`/families/${familyId}/students/${studentId}`),

  addParent: (familyId: string, parentId: string) =>
    apiClient.post<ApiResponse<void>>(`/families/${familyId}/parents`, { parentId }),

  removeParent: (familyId: string, parentId: string) =>
    apiClient.delete<ApiResponse<void>>(`/families/${familyId}/parents/${parentId}`),
};
