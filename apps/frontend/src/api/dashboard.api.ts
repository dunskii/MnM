// ===========================================
// Dashboard API Functions
// ===========================================
// API calls for dashboard statistics endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export interface DriveSyncStatus {
  isConnected: boolean;
  lastSyncAt: string | null;
  syncedFoldersCount: number;
  errorCount: number;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
}

export interface AdminDashboardStats {
  totalActiveStudents: number;
  totalActiveFamilies: number;
  totalActiveTeachers: number;
  totalLessonsThisWeek: number;
  attendanceRateThisWeek: number;
  attendanceRateThisMonth: number;
  totalOutstandingPayments: number; // In cents
  pendingMeetAndGreets: number;
  upcomingMeetAndGreets: number;
  driveSyncStatus: DriveSyncStatus;
}

export interface TeacherDashboardStats {
  totalLessonsThisWeek: number;
  totalStudents: number;
  attendanceRateThisWeek: number;
  pendingNotesCount: number;
  recentlyUploadedFiles: number;
  assignedMeetAndGreets: number;
}

export interface ParentDashboardStats {
  childrenCount: number;
  upcomingLessons: number;
  outstandingInvoices: number;
  outstandingAmount: number; // In cents
  sharedFilesCount: number;
  openBookingPeriods: number;
}

export type ActivityType =
  | 'enrollment'
  | 'payment'
  | 'booking'
  | 'attendance'
  | 'file_upload'
  | 'meet_and_greet';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RecentFile {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
  lessonName?: string;
  studentName?: string;
}

export interface PendingMeetAndGreet {
  id: string;
  studentName: string;
  contact1Email: string;
  status: 'PENDING_APPROVAL' | 'APPROVED';
  scheduledDateTime: string | null;
  createdAt: string;
}

// ===========================================
// RESPONSE WRAPPER TYPE
// ===========================================

interface ApiResponse<T> {
  status: string;
  data: T;
}

// ===========================================
// API FUNCTIONS
// ===========================================

export const dashboardApi = {
  // Admin endpoints
  getAdminStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<ApiResponse<AdminDashboardStats>>(
      '/dashboard/admin/stats'
    );
    return response.data;
  },

  getActivityFeed: async (limit = 10): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ApiResponse<ActivityItem[]>>(
      '/dashboard/admin/activity-feed',
      { params: { limit } }
    );
    return response.data;
  },

  getDriveSyncStatus: async (): Promise<DriveSyncStatus> => {
    const response = await apiClient.get<ApiResponse<DriveSyncStatus>>(
      '/dashboard/admin/drive-sync-status'
    );
    return response.data;
  },

  getPendingMeetAndGreets: async (limit = 10): Promise<PendingMeetAndGreet[]> => {
    const response = await apiClient.get<ApiResponse<PendingMeetAndGreet[]>>(
      '/dashboard/admin/pending-meet-and-greets',
      { params: { limit } }
    );
    return response.data;
  },

  // Teacher endpoints
  getTeacherStats: async (): Promise<TeacherDashboardStats> => {
    const response = await apiClient.get<ApiResponse<TeacherDashboardStats>>(
      '/dashboard/teacher/stats'
    );
    return response.data;
  },

  getTeacherRecentFiles: async (limit = 5): Promise<RecentFile[]> => {
    const response = await apiClient.get<ApiResponse<RecentFile[]>>(
      '/dashboard/teacher/recent-files',
      { params: { limit } }
    );
    return response.data;
  },

  getAssignedMeetAndGreets: async (limit = 10): Promise<PendingMeetAndGreet[]> => {
    const response = await apiClient.get<ApiResponse<PendingMeetAndGreet[]>>(
      '/dashboard/teacher/assigned-meet-and-greets',
      { params: { limit } }
    );
    return response.data;
  },

  // Parent endpoints
  getParentStats: async (): Promise<ParentDashboardStats> => {
    const response = await apiClient.get<ApiResponse<ParentDashboardStats>>(
      '/dashboard/parent/stats'
    );
    return response.data;
  },

  getParentSharedFiles: async (limit = 5): Promise<RecentFile[]> => {
    const response = await apiClient.get<ApiResponse<RecentFile[]>>(
      '/dashboard/parent/shared-files',
      { params: { limit } }
    );
    return response.data;
  },
};
