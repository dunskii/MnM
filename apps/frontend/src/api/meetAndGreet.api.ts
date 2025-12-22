// ===========================================
// Meet & Greet API Functions
// ===========================================
// API calls for meet & greet booking and management

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export type MeetAndGreetStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'CANCELLED';

export interface MeetAndGreetFormData {
  schoolId: string;
  studentFirstName: string;
  studentLastName: string;
  studentAge: number;
  contact1Name: string;
  contact1Email: string;
  contact1Phone: string;
  contact1Relationship: string;
  contact2Name?: string;
  contact2Email?: string;
  contact2Phone?: string;
  contact2Relationship?: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  instrumentId?: string;
  preferredDateTime?: string;
  additionalNotes?: string;
}

export interface MeetAndGreet {
  id: string;
  schoolId: string;
  studentFirstName: string;
  studentLastName: string;
  studentAge: number;
  contact1Name: string;
  contact1Email: string;
  contact1Phone: string;
  contact1Relationship: string;
  contact2Name: string | null;
  contact2Email: string | null;
  contact2Phone: string | null;
  contact2Relationship: string | null;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  instrumentId: string | null;
  instrument: { id: string; name: string } | null;
  preferredDateTime: string | null;
  scheduledDateTime: string | null;
  additionalNotes: string | null;
  status: MeetAndGreetStatus;
  assignedTeacherId: string | null;
  assignedTeacher: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  } | null;
  followUpNotes: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetAndGreetCounts {
  PENDING_VERIFICATION: number;
  PENDING_APPROVAL: number;
  APPROVED: number;
  REJECTED: number;
  CONVERTED: number;
  CANCELLED: number;
}

export interface SchoolInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InstrumentOption {
  id: string;
  name: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

// ===========================================
// PUBLIC API (No Auth)
// ===========================================

export const meetAndGreetPublicApi = {
  /**
   * Get school info by slug (for booking form)
   */
  getSchoolInfo: (schoolSlug: string) =>
    apiClient
      .get<ApiResponse<SchoolInfo>>(`/public/schools/${schoolSlug}/info`)
      .then((res) => res.data),

  /**
   * Get available instruments for a school
   */
  getSchoolInstruments: (schoolSlug: string) =>
    apiClient
      .get<ApiResponse<InstrumentOption[]>>(
        `/public/schools/${schoolSlug}/instruments`
      )
      .then((res) => res.data),

  /**
   * Create a new meet & greet booking
   */
  create: (data: MeetAndGreetFormData) =>
    apiClient
      .post<ApiResponse<{ id: string; message: string }>>(
        '/public/meet-and-greet',
        data
      )
      .then((res) => res.data),

  /**
   * Verify email address
   */
  verify: (token: string) =>
    apiClient
      .get<
        ApiResponse<{
          message: string;
          meetAndGreet: {
            id: string;
            parentName: string;
            childName: string;
            status: MeetAndGreetStatus;
          };
        }>
      >(`/public/meet-and-greet/verify/${token}`)
      .then((res) => res.data),
};

// ===========================================
// ADMIN API (Auth Required)
// ===========================================

export interface MeetAndGreetFilters {
  status?: MeetAndGreetStatus;
  startDate?: string;
  endDate?: string;
  teacherId?: string;
}

export const meetAndGreetApi = {
  /**
   * Get all meet & greets for school
   */
  getAll: (filters?: MeetAndGreetFilters) =>
    apiClient
      .get<ApiResponse<MeetAndGreet[]>>('/admin/meet-and-greet', {
        params: filters,
      })
      .then((res) => res.data),

  /**
   * Get meet & greet counts by status
   */
  getCounts: () =>
    apiClient
      .get<ApiResponse<MeetAndGreetCounts>>('/admin/meet-and-greet/counts')
      .then((res) => res.data),

  /**
   * Get single meet & greet by ID
   */
  getById: (id: string) =>
    apiClient
      .get<ApiResponse<MeetAndGreet>>(`/admin/meet-and-greet/${id}`)
      .then((res) => res.data),

  /**
   * Update a meet & greet
   */
  update: (id: string, data: Partial<MeetAndGreet>) =>
    apiClient
      .patch<ApiResponse<MeetAndGreet>>(`/admin/meet-and-greet/${id}`, data)
      .then((res) => res.data),

  /**
   * Approve a meet & greet and send registration link
   */
  approve: (id: string) =>
    apiClient
      .post<ApiResponse<{ message: string; registrationUrl: string }>>(
        `/admin/meet-and-greet/${id}/approve`
      )
      .then((res) => res.data),

  /**
   * Reject a meet & greet with reason
   */
  reject: (id: string, reason: string) =>
    apiClient
      .post<ApiResponse<MeetAndGreet>>(`/admin/meet-and-greet/${id}/reject`, {
        reason,
      })
      .then((res) => res.data),

  /**
   * Cancel a meet & greet
   */
  cancel: (id: string) =>
    apiClient
      .delete<ApiResponse<{ message: string }>>(`/admin/meet-and-greet/${id}`)
      .then((res) => res.data),
};
