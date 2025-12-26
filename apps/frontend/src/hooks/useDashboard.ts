// ===========================================
// Dashboard React Query Hooks
// ===========================================
// Custom hooks for dashboard statistics and activity feeds

import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  AdminDashboardStats,
  TeacherDashboardStats,
  ParentDashboardStats,
  ActivityItem,
  DriveSyncStatus,
  RecentFile,
  PendingMeetAndGreet,
} from '../api/dashboard.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: {
    all: ['dashboard', 'admin'] as const,
    stats: () => [...dashboardKeys.admin.all, 'stats'] as const,
    activity: (limit?: number) => [...dashboardKeys.admin.all, 'activity', limit] as const,
    driveSync: () => [...dashboardKeys.admin.all, 'drive-sync'] as const,
    meetAndGreets: (limit?: number) => [...dashboardKeys.admin.all, 'meet-and-greets', limit] as const,
  },
  teacher: {
    all: ['dashboard', 'teacher'] as const,
    stats: () => [...dashboardKeys.teacher.all, 'stats'] as const,
    files: (limit?: number) => [...dashboardKeys.teacher.all, 'files', limit] as const,
    meetAndGreets: (limit?: number) => [...dashboardKeys.teacher.all, 'meet-and-greets', limit] as const,
  },
  parent: {
    all: ['dashboard', 'parent'] as const,
    stats: () => [...dashboardKeys.parent.all, 'stats'] as const,
    files: (limit?: number) => [...dashboardKeys.parent.all, 'files', limit] as const,
  },
};

// ===========================================
// ADMIN HOOKS
// ===========================================

/**
 * Get admin dashboard statistics
 */
export function useAdminDashboardStats() {
  return useQuery<AdminDashboardStats>({
    queryKey: dashboardKeys.admin.stats(),
    queryFn: () => dashboardApi.getAdminStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Get activity feed for admin dashboard
 */
export function useActivityFeed(limit = 10) {
  return useQuery<ActivityItem[]>({
    queryKey: dashboardKeys.admin.activity(limit),
    queryFn: () => dashboardApi.getActivityFeed(limit),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Get Google Drive sync status
 */
export function useDriveSyncStatus() {
  return useQuery<DriveSyncStatus>({
    queryKey: dashboardKeys.admin.driveSync(),
    queryFn: () => dashboardApi.getDriveSyncStatus(),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}

/**
 * Get pending meet & greets for admin
 */
export function usePendingMeetAndGreets(limit = 10) {
  return useQuery<PendingMeetAndGreet[]>({
    queryKey: dashboardKeys.admin.meetAndGreets(limit),
    queryFn: () => dashboardApi.getPendingMeetAndGreets(limit),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// ===========================================
// TEACHER HOOKS
// ===========================================

/**
 * Get teacher dashboard statistics
 */
export function useTeacherDashboardStats() {
  return useQuery<TeacherDashboardStats>({
    queryKey: dashboardKeys.teacher.stats(),
    queryFn: () => dashboardApi.getTeacherStats(),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Get recently uploaded files by teacher
 */
export function useTeacherRecentFiles(limit = 5) {
  return useQuery<RecentFile[]>({
    queryKey: dashboardKeys.teacher.files(limit),
    queryFn: () => dashboardApi.getTeacherRecentFiles(limit),
    staleTime: 60000,
  });
}

/**
 * Get meet & greets assigned to teacher
 */
export function useAssignedMeetAndGreets(limit = 10) {
  return useQuery<PendingMeetAndGreet[]>({
    queryKey: dashboardKeys.teacher.meetAndGreets(limit),
    queryFn: () => dashboardApi.getAssignedMeetAndGreets(limit),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// ===========================================
// PARENT HOOKS
// ===========================================

/**
 * Get parent dashboard statistics
 */
export function useParentDashboardStats() {
  return useQuery<ParentDashboardStats>({
    queryKey: dashboardKeys.parent.stats(),
    queryFn: () => dashboardApi.getParentStats(),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Get files shared with parent's family
 */
export function useParentSharedFiles(limit = 5) {
  return useQuery<RecentFile[]>({
    queryKey: dashboardKeys.parent.files(limit),
    queryFn: () => dashboardApi.getParentSharedFiles(limit),
    staleTime: 60000,
  });
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Format currency from cents to display string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}
