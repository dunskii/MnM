// ===========================================
// Admin Dashboard Page
// ===========================================
// Enhanced dashboard with stats, activity feed, and quick actions

import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Divider,
  Skeleton,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Event as LessonIcon,
  CheckCircle as AttendanceIcon,
  AttachMoney as PaymentIcon,
  Handshake as MeetAndGreetIcon,
  Add as AddIcon,
  Receipt as InvoiceIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { differenceInDays, format } from 'date-fns';

import { useTerms } from '../../hooks/useAdmin';
import {
  useAdminDashboardStats,
  useActivityFeed,
  formatCurrency,
} from '../../hooks/useDashboard';
import PageHeader from '../../components/common/PageHeader';
import { StatWidget } from '../../components/dashboard/StatWidget';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { SyncStatusCard } from '../../components/dashboard/SyncStatusCard';
import { Term } from '../../api/admin.api';

// ===========================================
// COMPONENT
// ===========================================

export default function AdminDashboardPage() {
  // Fetch dashboard stats from new endpoint
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: activityItems, isLoading: activityLoading } = useActivityFeed(10);
  const { data: terms, isLoading: termsLoading } = useTerms();

  // Get current term
  const currentTerm = terms?.find((t: Term) => t.isActive);

  // Calculate term progress
  const getTermProgress = () => {
    if (!currentTerm) return { progress: 0, daysRemaining: 0, totalDays: 0 };

    const start = new Date(currentTerm.startDate);
    const end = new Date(currentTerm.endDate);
    const now = new Date();

    const totalDays = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    const daysRemaining = differenceInDays(end, now);
    const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

    return { progress, daysRemaining, totalDays };
  };

  const termProgress = getTermProgress();

  // Quick actions for admin
  const quickActions = [
    { label: 'New Lesson', icon: <AddIcon />, href: '/admin/lessons', color: 'primary' as const },
    { label: 'New Invoice', icon: <InvoiceIcon />, href: '/admin/invoices', color: 'primary' as const },
    { label: 'Meet & Greet', icon: <MeetAndGreetIcon />, href: '/admin/meet-and-greet', color: 'secondary' as const },
    { label: 'Calendar', icon: <CalendarIcon />, href: '/admin/calendar', color: 'secondary' as const },
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to the Music 'n Me admin dashboard"
      />

      {/* Primary Stats Row - 6 widgets */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Active Students */}
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Students"
            value={stats?.totalActiveStudents ?? 0}
            icon={<SchoolIcon />}
            color="primary"
            loading={statsLoading}
            href="/admin/students"
          />
        </Grid>

        {/* Lessons This Week */}
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Lessons/Week"
            value={stats?.totalLessonsThisWeek ?? 0}
            icon={<LessonIcon />}
            color="secondary"
            loading={statsLoading}
            href="/admin/lessons"
          />
        </Grid>

        {/* Attendance Rate */}
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Attendance"
            value={`${stats?.attendanceRateThisWeek ?? 0}%`}
            icon={<AttendanceIcon />}
            color={(stats?.attendanceRateThisWeek ?? 0) >= 80 ? 'success' : 'warning'}
            subtitle="This week"
            loading={statsLoading}
          />
        </Grid>

        {/* Outstanding Payments */}
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Outstanding"
            value={formatCurrency(stats?.totalOutstandingPayments ?? 0)}
            icon={<PaymentIcon />}
            color={(stats?.totalOutstandingPayments ?? 0) > 0 ? 'warning' : 'success'}
            loading={statsLoading}
            href="/admin/invoices?status=OVERDUE"
          />
        </Grid>

        {/* Pending Meet & Greets */}
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Pending M&G"
            value={stats?.pendingMeetAndGreets ?? 0}
            icon={<MeetAndGreetIcon />}
            color={(stats?.pendingMeetAndGreets ?? 0) > 0 ? 'info' : 'success'}
            subtitle={stats?.upcomingMeetAndGreets ? `${stats.upcomingMeetAndGreets} scheduled` : undefined}
            loading={statsLoading}
            href="/admin/meet-and-greet"
          />
        </Grid>

        {/* Teachers & Families */}
        <Grid item xs={6} sm={4} md={2}>
          <StatWidget
            title="Teachers"
            value={stats?.totalActiveTeachers ?? 0}
            icon={<PeopleIcon />}
            color="primary"
            subtitle={`${stats?.totalActiveFamilies ?? 0} families`}
            loading={statsLoading}
            href="/admin/teachers"
          />
        </Grid>
      </Grid>

      {/* Secondary Row - Quick Actions, Activity Feed, Drive Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Quick Actions */}
        <Grid item xs={12} md={3}>
          <QuickActions actions={quickActions} columns={2} />
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12} md={6}>
          <ActivityFeed
            items={activityItems ?? []}
            loading={activityLoading}
            maxItems={5}
            title="Recent Activity"
          />
        </Grid>

        {/* Google Drive Sync Status */}
        <Grid item xs={12} md={3}>
          <SyncStatusCard
            status={stats?.driveSyncStatus ?? null}
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Third Row - Current Term */}
      <Grid container spacing={3}>
        {/* Current Term Card with Progress */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="primary" />
                  <Typography variant="h6">Current Term</Typography>
                </Box>
              }
              action={
                currentTerm && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      bgcolor: '#c5ebe2',
                      color: '#5cb399',
                      fontWeight: 600,
                    }}
                  />
                )
              }
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mx: 2, mt: 2 }} />
            <CardContent>
              {termsLoading ? (
                <Box>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2, borderRadius: 1 }} />
                </Box>
              ) : currentTerm ? (
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {currentTerm.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {format(new Date(currentTerm.startDate), 'MMM d, yyyy')} -{' '}
                    {format(new Date(currentTerm.endDate), 'MMM d, yyyy')}
                  </Typography>

                  {/* Progress Bar */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Term Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {Math.round(termProgress.progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={termProgress.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: termProgress.progress > 80 ? '#FFAE9E' : '#4580E4',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {termProgress.daysRemaining > 0
                        ? `${termProgress.daysRemaining} days remaining`
                        : 'Term has ended'}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">No active term</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure a term in Settings &gt; Terms
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Stats Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttendanceIcon color="primary" />
                  <Typography variant="h6">Monthly Overview</Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mx: 2, mt: 2 }} />
            <CardContent>
              {statsLoading ? (
                <Box>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="70%" />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats?.attendanceRateThisMonth ?? 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Attendance
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="secondary.main" fontWeight="bold">
                        {stats?.totalLessonsThisWeek ?? 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lessons This Week
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats?.totalActiveFamilies ?? 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Families
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{
                          color: (stats?.pendingMeetAndGreets ?? 0) > 0 ? '#e67761' : '#5cb399',
                        }}
                      >
                        {(stats?.pendingMeetAndGreets ?? 0) + (stats?.upcomingMeetAndGreets ?? 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Meet & Greets
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
