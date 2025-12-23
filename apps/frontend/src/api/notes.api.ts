// ===========================================
// Notes API Functions
// ===========================================
// API calls for teacher notes endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export type NoteStatus = 'PENDING' | 'PARTIAL' | 'COMPLETE';

export interface Note {
  id: string;
  schoolId: string;
  authorId: string;
  lessonId: string | null;
  studentId: string | null;
  date: string;
  content: string;
  status: NoteStatus;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lesson?: {
    id: string;
    name: string;
    teacher: {
      user: { id: string; firstName: string; lastName: string };
    };
    room: {
      name: string;
      location: { name: string };
    };
  } | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    ageGroup: string;
  } | null;
}

export interface CreateNoteInput {
  lessonId?: string;
  studentId?: string;
  date: string;
  content: string;
  isPrivate?: boolean;
}

export interface UpdateNoteInput {
  content?: string;
  isPrivate?: boolean;
}

export interface NotesByLessonFilter {
  date?: string;
  authorId?: string;
  isPrivate?: boolean;
}

export interface NotesByStudentFilter {
  lessonId?: string;
  startDate?: string;
  endDate?: string;
  isPrivate?: boolean;
}

export interface NotesByDateFilter {
  lessonId?: string;
  authorId?: string;
}

export interface WeeklySummaryFilter {
  weekStartDate?: string;
}

export interface IncompleteNotesFilter {
  teacherId?: string;
  beforeDate?: string;
}

export interface NoteCompletionStatus {
  lessonId: string;
  date: string;
  classNoteComplete: boolean;
  studentNotesComplete: boolean;
  enrolledStudentCount: number;
  completedStudentNotes: number;
  missingStudentNotes: Array<{ studentId: string; studentName: string }>;
  status: NoteStatus;
}

export interface LessonDateCompletion {
  date: string;
  status: NoteStatus;
  classNoteComplete: boolean;
  completedStudentNotes: number;
  enrolledStudentCount: number;
}

export interface LessonSummary {
  lessonId: string;
  lessonName: string;
  dates: LessonDateCompletion[];
}

export interface WeeklyCompletionSummary {
  teacherId: string;
  teacherName: string;
  weekStartDate: string;
  lessons: LessonSummary[];
  overallCompletionRate: number;
}

export interface TeacherCompletionSummary {
  teacherId: string;
  teacherName: string;
  totalLessons: number;
  completedNotes: number;
  completionRate: number;
}

export interface SchoolCompletionSummary {
  weekStartDate: string;
  teachers: TeacherCompletionSummary[];
  overallCompletionRate: number;
}

export interface IncompleteNoteSummary {
  teacherId: string;
  teacherName: string;
  lessonId: string;
  lessonName: string;
  date: string;
  status: NoteStatus;
  missingClassNote: boolean;
  missingStudentNotes: number;
}

export interface PendingNotesCount {
  totalPending: number;
  pendingClassNotes: number;
  pendingStudentNotes: number;
}

// ===========================================
// NOTES API
// ===========================================

export const notesApi = {
  // ===========================================
  // CRUD OPERATIONS
  // ===========================================

  /**
   * Create a new note (class note or student note)
   */
  create: (data: CreateNoteInput): Promise<Note> =>
    apiClient
      .post<{ status: string; data: Note }>('/notes', data)
      .then((res) => res.data),

  /**
   * Update an existing note
   */
  update: (id: string, data: UpdateNoteInput): Promise<Note> =>
    apiClient
      .patch<{ status: string; data: Note }>(`/notes/${id}`, data)
      .then((res) => res.data),

  /**
   * Delete a note
   */
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/notes/${id}`).then(() => undefined),

  /**
   * Get a single note
   */
  getById: (id: string): Promise<Note> =>
    apiClient
      .get<{ status: string; data: Note }>(`/notes/${id}`)
      .then((res) => res.data),

  // ===========================================
  // QUERY OPERATIONS
  // ===========================================

  /**
   * Get notes for a lesson
   */
  getByLesson: (lessonId: string, filters?: NotesByLessonFilter): Promise<Note[]> =>
    apiClient
      .get<{ status: string; data: Note[] }>(`/notes/lesson/${lessonId}`, {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get note completion status for a lesson on a date
   */
  getLessonCompletion: (lessonId: string, date: string): Promise<NoteCompletionStatus> =>
    apiClient
      .get<{ status: string; data: NoteCompletionStatus }>(
        `/notes/lesson/${lessonId}/completion`,
        { params: { date } }
      )
      .then((res) => res.data),

  /**
   * Get notes for a student
   */
  getByStudent: (studentId: string, filters?: NotesByStudentFilter): Promise<Note[]> =>
    apiClient
      .get<{ status: string; data: Note[] }>(`/notes/student/${studentId}`, {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get all notes for a specific date
   */
  getByDate: (date: string, filters?: NotesByDateFilter): Promise<Note[]> =>
    apiClient
      .get<{ status: string; data: Note[] }>(`/notes/date/${date}`, {
        params: filters,
      })
      .then((res) => res.data),

  // ===========================================
  // COMPLETION SUMMARY OPERATIONS
  // ===========================================

  /**
   * Get weekly note completion summary for a teacher
   */
  getTeacherWeeklySummary: (
    teacherId: string,
    filters?: WeeklySummaryFilter
  ): Promise<WeeklyCompletionSummary> =>
    apiClient
      .get<{ status: string; data: WeeklyCompletionSummary }>(
        `/notes/teacher/${teacherId}/weekly`,
        { params: filters }
      )
      .then((res) => res.data),

  /**
   * Get pending notes count for a teacher (dashboard widget)
   */
  getTeacherPendingCount: (teacherId: string): Promise<PendingNotesCount> =>
    apiClient
      .get<{ status: string; data: PendingNotesCount }>(
        `/notes/teacher/${teacherId}/pending`
      )
      .then((res) => res.data),

  /**
   * Get school-wide note completion summary for a week (admin only)
   */
  getSchoolWeeklySummary: (filters?: WeeklySummaryFilter): Promise<SchoolCompletionSummary> =>
    apiClient
      .get<{ status: string; data: SchoolCompletionSummary }>('/notes/school/weekly', {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get all incomplete notes (admin only)
   */
  getIncomplete: (filters?: IncompleteNotesFilter): Promise<IncompleteNoteSummary[]> =>
    apiClient
      .get<{ status: string; data: IncompleteNoteSummary[] }>('/notes/incomplete', {
        params: filters,
      })
      .then((res) => res.data),
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get note status color for chip/badge
 * Uses Music 'n Me brand colors
 */
export const getNoteStatusColor = (
  status: NoteStatus
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'COMPLETE':
      return 'success';
    case 'PARTIAL':
      return 'warning';
    case 'PENDING':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get note status label for display
 */
export const getNoteStatusLabel = (status: NoteStatus): string => {
  switch (status) {
    case 'COMPLETE':
      return 'Complete';
    case 'PARTIAL':
      return 'Partial';
    case 'PENDING':
      return 'Pending';
    default:
      return status;
  }
};

/**
 * Format completion rate as percentage string
 */
export const formatCompletionRate = (rate: number): string => {
  return `${rate}%`;
};

/**
 * Check if a note is a class note (has lessonId but no studentId)
 */
export const isClassNote = (note: Note): boolean => {
  return !!note.lessonId && !note.studentId;
};

/**
 * Check if a note is a student note (has studentId)
 */
export const isStudentNote = (note: Note): boolean => {
  return !!note.studentId;
};

/**
 * Get note type label for display
 */
export const getNoteTypeLabel = (note: Note): string => {
  if (isClassNote(note)) {
    return 'Class Note';
  }
  if (isStudentNote(note)) {
    return 'Student Note';
  }
  return 'Note';
};
