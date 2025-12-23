// ===========================================
// User Management React Query Hooks
// ===========================================
// Custom hooks for teachers, parents, students, families API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  teachersApi,
  parentsApi,
  studentsApi,
  familiesApi,
  Contact,
} from '../api/users.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const userKeys = {
  all: ['users'] as const,
  teachers: () => [...userKeys.all, 'teachers'] as const,
  teacher: (id: string) => [...userKeys.teachers(), id] as const,
  parents: () => [...userKeys.all, 'parents'] as const,
  parent: (id: string) => [...userKeys.parents(), id] as const,
  students: () => [...userKeys.all, 'students'] as const,
  student: (id: string) => [...userKeys.students(), id] as const,
  families: () => [...userKeys.all, 'families'] as const,
  family: (id: string) => [...userKeys.families(), id] as const,
};

// ===========================================
// TEACHERS HOOKS
// ===========================================

export function useTeachers() {
  return useQuery({
    queryKey: userKeys.teachers(),
    queryFn: teachersApi.getAll,
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: userKeys.teacher(id),
    queryFn: () => teachersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      password?: string;
      bio?: string;
      instrumentIds?: string[];
    }) => teachersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.teachers() });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        firstName: string;
        lastName: string;
        phone: string;
        bio: string;
        isActive: boolean;
      }>;
    }) => teachersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.teachers() });
      queryClient.invalidateQueries({ queryKey: userKeys.teacher(variables.id) });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.teachers() });
    },
  });
}

export function useAssignInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      instrumentId,
      isPrimary,
    }: {
      teacherId: string;
      instrumentId: string;
      isPrimary?: boolean;
    }) => teachersApi.assignInstrument(teacherId, instrumentId, isPrimary),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.teacher(variables.teacherId) });
      queryClient.invalidateQueries({ queryKey: userKeys.teachers() });
    },
  });
}

export function useRemoveInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      instrumentId,
    }: {
      teacherId: string;
      instrumentId: string;
    }) => teachersApi.removeInstrument(teacherId, instrumentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.teacher(variables.teacherId) });
      queryClient.invalidateQueries({ queryKey: userKeys.teachers() });
    },
  });
}

export function useSetPrimaryInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      instrumentId,
    }: {
      teacherId: string;
      instrumentId: string;
    }) => teachersApi.setPrimaryInstrument(teacherId, instrumentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.teacher(variables.teacherId) });
      queryClient.invalidateQueries({ queryKey: userKeys.teachers() });
    },
  });
}

// ===========================================
// PARENTS HOOKS
// ===========================================

export function useParents() {
  return useQuery({
    queryKey: userKeys.parents(),
    queryFn: parentsApi.getAll,
  });
}

export function useParent(id: string) {
  return useQuery({
    queryKey: userKeys.parent(id),
    queryFn: () => parentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      password?: string;
      familyName?: string;
      contact1: Contact;
      contact2?: Contact;
      emergencyContact: Contact;
    }) => parentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.parents() });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
    },
  });
}

export function useUpdateParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        firstName: string;
        lastName: string;
        phone: string;
        contact1: Contact;
        contact2: Contact | null;
        emergencyContact: Contact;
        isActive: boolean;
      }>;
    }) => parentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.parents() });
      queryClient.invalidateQueries({ queryKey: userKeys.parent(variables.id) });
    },
  });
}

export function useDeleteParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => parentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.parents() });
    },
  });
}

// ===========================================
// STUDENTS HOOKS
// ===========================================

/**
 * Get all students
 * Note: studentsApi already extracts .data from ApiResponse wrapper
 */
export function useStudents() {
  return useQuery({
    queryKey: userKeys.students(),
    queryFn: studentsApi.getAll,
  });
}

/**
 * Get a single student by ID
 * Note: studentsApi already extracts .data from ApiResponse wrapper
 */
export function useStudent(id: string) {
  return useQuery({
    queryKey: userKeys.student(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      birthDate?: string;
      familyId?: string;
      notes?: string;
    }) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        firstName: string;
        lastName: string;
        birthDate: string | null;
        notes: string | null;
        isActive: boolean;
      }>;
    }) => studentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
      queryClient.invalidateQueries({ queryKey: userKeys.student(variables.id) });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
    },
  });
}

export function useAssignStudentToFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, familyId }: { studentId: string; familyId: string }) =>
      studentsApi.assignToFamily(studentId, familyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.student(variables.studentId) });
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
    },
  });
}

export function useRemoveStudentFromFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => studentsApi.removeFromFamily(studentId),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.student(studentId) });
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
    },
  });
}

// ===========================================
// FAMILIES HOOKS
// ===========================================

export function useFamilies() {
  return useQuery({
    queryKey: userKeys.families(),
    queryFn: familiesApi.getAll,
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: userKeys.family(id),
    queryFn: () => familiesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) => familiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ name: string; isActive: boolean }>;
    }) => familiesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
      queryClient.invalidateQueries({ queryKey: userKeys.family(variables.id) });
    },
  });
}

export function useDeleteFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
    },
  });
}

export function useAddStudentToFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, studentId }: { familyId: string; studentId: string }) =>
      familiesApi.addStudent(familyId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.family(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
    },
  });
}

export function useRemoveStudentFromFamilyById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, studentId }: { familyId: string; studentId: string }) =>
      familiesApi.removeStudent(familyId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.family(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
      queryClient.invalidateQueries({ queryKey: userKeys.students() });
    },
  });
}

export function useAddParentToFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, parentId }: { familyId: string; parentId: string }) =>
      familiesApi.addParent(familyId, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.family(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
      queryClient.invalidateQueries({ queryKey: userKeys.parents() });
    },
  });
}

export function useRemoveParentFromFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, parentId }: { familyId: string; parentId: string }) =>
      familiesApi.removeParent(familyId, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.family(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: userKeys.families() });
      queryClient.invalidateQueries({ queryKey: userKeys.parents() });
    },
  });
}
