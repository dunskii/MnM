# Week 11 Implementation Plan: Polish, Dashboards & Reports

**Date:** 2025-12-26
**Status:** Ready to Implement
**Overall Project Progress:** 83% → 92% after completion

---

## Executive Summary

Week 11 is the polish and enhancement week, focusing on:
- **Days 1-2:** UI Polish + Brand Refinement
- **Days 3-4:** Admin Dashboard Enhancements
- **Day 5:** Teacher & Parent Dashboard Enhancements

**Current State:**
- All three dashboards exist but need enhancements
- Brand theme already implemented with all colors
- All backend services exist (invoice, attendance, googleDrive, meetAndGreet, notification)
- React Query patterns established across 15+ hooks files

---

## Phase 1: Backend Enhancements - Dashboard Statistics Endpoints

### 1.1 Create Dashboard Statistics Service

**File to Create:** `apps/backend/src/services/dashboard.service.ts`

**Functions to Implement:**
```typescript
export async function getAdminDashboardStats(schoolId: string): Promise<AdminDashboardStats>
export async function getTeacherDashboardStats(schoolId: string, teacherId: string): Promise<TeacherDashboardStats>
export async function getParentDashboardStats(schoolId: string, parentId: string): Promise<ParentDashboardStats>
export async function getActivityFeed(schoolId: string, limit?: number): Promise<ActivityItem[]>
export async function getDriveSyncStatus(schoolId: string): Promise<DriveSyncStatus>
export async function getPendingMeetAndGreets(schoolId: string, filters?: { teacherId?: string }): Promise<MeetAndGreet[]>
```

**Admin Dashboard Stats Type:**
```typescript
interface AdminDashboardStats {
  totalActiveStudents: number;
  totalLessonsThisWeek: number;
  attendanceRateThisWeek: number;  // 0-100 percentage
  totalOutstandingPayments: number; // In cents
  pendingMeetAndGreets: number;
  driveSyncStatus: {
    lastSyncAt: string | null;
    errorCount: number;
    status: 'healthy' | 'warning' | 'error';
  };
}
```

**Multi-Tenancy (CRITICAL):**
```typescript
// EVERY query MUST include schoolId filter
const students = await prisma.student.count({
  where: { schoolId, isActive: true }
});
```

**Pattern Reference:** `apps/backend/src/services/invoice.service.ts` lines 1022-1092 (`getInvoiceStatistics`)

### 1.2 Create Dashboard Routes

**File to Create:** `apps/backend/src/routes/dashboard.routes.ts`

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/dashboard/admin/stats` | GET | Admin | Admin dashboard statistics |
| `/dashboard/teacher/stats` | GET | Teacher | Teacher dashboard statistics |
| `/dashboard/parent/stats` | GET | Parent | Parent dashboard statistics |
| `/dashboard/activity-feed` | GET | Admin | Recent school activity (limit param) |
| `/dashboard/drive-sync-status` | GET | Admin | Google Drive sync summary |

**Pattern Reference:** `apps/backend/src/routes/admin.routes.ts`

### 1.3 Register Dashboard Routes

**File to Modify:** `apps/backend/src/index.ts`

Add:
```typescript
import dashboardRoutes from './routes/dashboard.routes';
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
```

### 1.4 Create Dashboard Validators

**File to Create:** `apps/backend/src/validators/dashboard.validators.ts`

```typescript
import { z } from 'zod';

export const activityFeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});
```

### Tasks:
- [ ] Create `dashboard.service.ts` with all aggregation functions
- [ ] Create `dashboard.routes.ts` with 5 endpoints
- [ ] Create `dashboard.validators.ts` with query schemas
- [ ] Register routes in `index.ts`
- [ ] Test endpoints with Postman/curl

**Agent:** `backend-architect`

---

## Phase 2: Reusable Dashboard Components

### 2.1 StatWidget Component

**File to Create:** `apps/frontend/src/components/dashboard/StatWidget.tsx`

```typescript
interface StatWidgetProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  loading?: boolean;
  onClick?: () => void;
  href?: string;
}
```

**Styling:**
- Brand colors from `theme.ts`
- No drop shadows (flat design)
- Subtle border: `1px solid #e0e0e0`
- Border radius: 16px
- Icon background uses `color.light` variant

### 2.2 ActivityFeed Component

**File to Create:** `apps/frontend/src/components/dashboard/ActivityFeed.tsx`

```typescript
interface ActivityItem {
  id: string;
  type: 'enrollment' | 'payment' | 'booking' | 'attendance' | 'file_upload' | 'meet_and_greet';
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
  actionUrl?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}
```

### 2.3 QuickActions Component

**File to Create:** `apps/frontend/src/components/dashboard/QuickActions.tsx`

```typescript
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color?: 'primary' | 'secondary';
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
}
```

### 2.4 CharacterIllustration Component

**File to Create:** `apps/frontend/src/components/brand/CharacterIllustration.tsx`

```typescript
interface CharacterIllustrationProps {
  ageGroup: 'PRESCHOOL' | 'KIDS' | 'TEENS' | 'ADULT';
  size?: 'small' | 'medium' | 'large';
  withName?: boolean;
}
```

**Character Mapping (from theme.ts):**
| Character | Age Group | Color |
|-----------|-----------|-------|
| Alice | PRESCHOOL | #FFB6C1 (pink) |
| Steve | KIDS | #FFCE00 (yellow) |
| Liam | TEENS | #4580E4 (blue) |
| Floyd | ADULT | #96DAC9 (mint) |

### 2.5 SyncStatusCard Component

**File to Create:** `apps/frontend/src/components/dashboard/SyncStatusCard.tsx`

Reuse pattern from existing `SyncStatusBadge.tsx` but as full card with:
- Last sync timestamp
- Error count
- Quick sync button
- Link to Drive settings

### 2.6 Create Index Export

**File to Create:** `apps/frontend/src/components/dashboard/index.ts`

```typescript
export { StatWidget } from './StatWidget';
export { ActivityFeed } from './ActivityFeed';
export { QuickActions } from './QuickActions';
export { SyncStatusCard } from './SyncStatusCard';
```

### Tasks:
- [ ] Create `StatWidget.tsx` with brand styling
- [ ] Create `ActivityFeed.tsx` with activity type icons
- [ ] Create `QuickActions.tsx` with grid layout
- [ ] Create `CharacterIllustration.tsx` with age mapping
- [ ] Create `SyncStatusCard.tsx` for Drive status
- [ ] Create `index.ts` for exports

**Agent:** `frontend-developer`

---

## Phase 3: Admin Dashboard Enhancement

### 3.1 Create Dashboard API Client

**File to Create:** `apps/frontend/src/api/dashboard.api.ts`

```typescript
export const dashboardApi = {
  getAdminStats: () => apiClient.get<AdminDashboardStats>('/dashboard/admin/stats'),
  getTeacherStats: () => apiClient.get<TeacherDashboardStats>('/dashboard/teacher/stats'),
  getParentStats: () => apiClient.get<ParentDashboardStats>('/dashboard/parent/stats'),
  getActivityFeed: (limit?: number) => apiClient.get<ActivityItem[]>('/dashboard/activity-feed', { params: { limit } }),
  getDriveSyncStatus: () => apiClient.get<DriveSyncStatus>('/dashboard/drive-sync-status'),
};
```

### 3.2 Create Dashboard Hooks

**File to Create:** `apps/frontend/src/hooks/useDashboard.ts`

```typescript
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'stats'],
    queryFn: () => dashboardApi.getAdminStats(),
    staleTime: 30000, // 30 seconds
  });
}

export function useActivityFeed(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: () => dashboardApi.getActivityFeed(limit),
    staleTime: 60000, // 1 minute
  });
}

// ... more hooks
```

### 3.3 Enhance AdminDashboardPage

**File to Modify:** `apps/frontend/src/pages/admin/AdminDashboardPage.tsx`

**Current:** 257 lines, 4 basic stat cards

**Enhanced Structure:**

```tsx
<Grid container spacing={3}>
  {/* Row 1: Primary Stats */}
  <Grid item xs={12} sm={6} md={4} lg={2}>
    <StatWidget title="Active Students" value={stats.totalActiveStudents} icon={<PeopleIcon />} color="primary" />
  </Grid>
  <Grid item xs={12} sm={6} md={4} lg={2}>
    <StatWidget title="Lessons This Week" value={stats.totalLessonsThisWeek} icon={<EventIcon />} color="secondary" />
  </Grid>
  <Grid item xs={12} sm={6} md={4} lg={2}>
    <StatWidget
      title="Attendance Rate"
      value={`${stats.attendanceRateThisWeek}%`}
      icon={<CheckCircleIcon />}
      color={stats.attendanceRateThisWeek >= 80 ? 'success' : 'warning'}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={4} lg={2}>
    <StatWidget
      title="Outstanding Payments"
      value={formatCurrency(stats.totalOutstandingPayments)}
      icon={<AttachMoneyIcon />}
      color="warning"
      href="/admin/invoices?status=OVERDUE"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={4} lg={2}>
    <StatWidget
      title="Pending M&G"
      value={stats.pendingMeetAndGreets}
      icon={<HandshakeIcon />}
      color="info"
      href="/admin/meet-and-greet"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={4} lg={2}>
    <SyncStatusCard status={stats.driveSyncStatus} />
  </Grid>

  {/* Row 2: Quick Actions */}
  <Grid item xs={12} md={4}>
    <QuickActions
      actions={[
        { label: 'Create Lesson', icon: <AddIcon />, href: '/admin/lessons/new' },
        { label: 'Create Invoice', icon: <ReceiptIcon />, href: '/admin/invoices/new' },
        { label: 'View M&G', icon: <HandshakeIcon />, href: '/admin/meet-and-greet' },
        { label: 'Calendar', icon: <CalendarIcon />, href: '/admin/calendar' },
      ]}
    />
  </Grid>

  {/* Row 2: Activity Feed */}
  <Grid item xs={12} md={8}>
    <ActivityFeed items={activityItems} loading={activityLoading} />
  </Grid>

  {/* Row 3: Current Term */}
  <Grid item xs={12}>
    <CurrentTermCard term={currentTerm} />
  </Grid>
</Grid>
```

### Tasks:
- [ ] Create `dashboard.api.ts`
- [ ] Create `useDashboard.ts` hooks
- [ ] Replace stat cards with StatWidget components
- [ ] Add 6 stat widgets (students, lessons, attendance, payments, M&G, Drive)
- [ ] Add QuickActions card
- [ ] Add ActivityFeed card
- [ ] Test responsive layout

**Agent:** `full-stack-developer`

---

## Phase 4: Teacher Dashboard Enhancement

### 4.1 Enhance TeacherDashboardPage

**File to Modify:** `apps/frontend/src/pages/teacher/TeacherDashboardPage.tsx`

**Current:** 583 lines with stats, pending notes, today's lessons, weekly progress

**Additions:**

**New Section: Recently Uploaded Files**
```tsx
<Card>
  <CardHeader title="Recently Uploaded Files" />
  <CardContent>
    <List>
      {recentFiles.map(file => (
        <ListItem key={file.id}>
          <ListItemIcon><FileIcon /></ListItemIcon>
          <ListItemText
            primary={file.name}
            secondary={`Uploaded ${formatRelative(file.uploadedAt)}`}
          />
        </ListItem>
      ))}
    </List>
    <Button href="/admin/google-drive">Manage Files</Button>
  </CardContent>
</Card>
```

**New Section: Pending Meet & Greets**
```tsx
<Card>
  <CardHeader title="Assigned Meet & Greets" />
  <CardContent>
    {pendingMeetAndGreets.map(mg => (
      <MeetAndGreetCard key={mg.id} meetAndGreet={mg} />
    ))}
  </CardContent>
</Card>
```

### 4.2 Add Hooks for Teacher Dashboard

**File to Modify:** `apps/frontend/src/hooks/useGoogleDrive.ts`

Add:
```typescript
export function useTeacherRecentFiles(teacherId: string, limit = 5) {
  return useQuery({
    queryKey: ['teacher', 'files', teacherId, limit],
    queryFn: () => googleDriveApi.getRecentFiles({ uploadedBy: teacherId, limit }),
  });
}
```

### Tasks:
- [ ] Add "Recently Uploaded Files" section
- [ ] Add "Assigned Meet & Greets" section
- [ ] Create `useTeacherRecentFiles` hook
- [ ] Add M&G filtering by assigned teacher
- [ ] Test with teacher account

**Agent:** `frontend-developer`

---

## Phase 5: Parent Dashboard Enhancement

### 5.1 Enhance ParentDashboardPage

**File to Modify:** `apps/frontend/src/pages/parent/ParentDashboardPage.tsx`

**Current:** 761 lines with student selector, stats, schedule, invoices, notes, resources

**Additions:**

**New Section: Hybrid Booking Status**
```tsx
<Card sx={{ mb: 3, bgcolor: openBookingPeriod ? '#FFCE00' : 'background.paper' }}>
  <CardContent>
    {openBookingPeriod ? (
      <>
        <Typography variant="h6">Book Your Individual Session!</Typography>
        <Typography>Booking closes in {daysUntilClose} days</Typography>
        <Button variant="contained" href="/parent/hybrid-booking">Book Now</Button>
      </>
    ) : (
      <Typography>No open booking periods. Check back later!</Typography>
    )}
  </CardContent>
</Card>
```

**Enhancement: Invoices Widget**
```tsx
// Add prominent "Pay Now" button for overdue invoices
{overdueInvoices.length > 0 && (
  <Alert severity="error" sx={{ mb: 2 }}>
    You have {overdueInvoices.length} overdue invoice(s) totaling {formatCurrency(overdueTotal)}
    <Button variant="contained" color="error" onClick={handleQuickPay}>
      Pay Now
    </Button>
  </Alert>
)}
```

**Enhancement: Student Cards**
```tsx
// Add character illustration based on age group
<Card>
  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
    <CharacterIllustration ageGroup={student.ageGroup} size="medium" />
    <Box sx={{ ml: 2 }}>
      <Typography variant="h6">{student.firstName}</Typography>
      <Typography variant="body2">{getAgeGroupLabel(student.ageGroup)}</Typography>
    </Box>
  </CardContent>
</Card>
```

### 5.2 Add Hybrid Booking Period Hook

**File to Modify:** `apps/frontend/src/hooks/useHybridBooking.ts`

Add:
```typescript
export function useOpenBookingPeriods(studentId: string) {
  return useQuery({
    queryKey: ['hybrid', 'open-periods', studentId],
    queryFn: () => hybridBookingApi.getOpenPeriods(studentId),
    staleTime: 300000, // 5 minutes
  });
}
```

### Tasks:
- [ ] Add "Hybrid Booking Status" section with prominent CTA
- [ ] Add "Pay Now" button for overdue invoices
- [ ] Add character illustrations to student cards
- [ ] Create `useOpenBookingPeriods` hook
- [ ] Test with parent account

**Agent:** `frontend-developer`

---

## Phase 6: Brand Audit & UI Polish

### 6.1 Pages to Audit (30 total)

**Admin Pages (15):**
1. AdminDashboardPage
2. TermsPage
3. LocationsPage
4. InstrumentsPage
5. DurationsPage
6. ParentsPage
7. FamiliesPage
8. LessonTypesPage
9. RoomsPage
10. StudentsPage
11. TeachersPage
12. MeetAndGreetPage
13. LessonsPage
14. InvoicesPage
15. GoogleDrivePage

**Teacher Pages (1):**
16. TeacherDashboardPage

**Parent Pages (4):**
17. ParentDashboardPage
18. HybridBookingPage
19. InvoicesPage (Parent)
20. ResourcesPage

**Public Pages (2):**
21. MeetAndGreetBookingPage
22. MeetAndGreetVerifyPage

**Shared Components (8):**
23. LoginPage
24. DashboardPage (router)
25. PageHeader
26. DataTable
27. FormModal
28. ConfirmDialog
29. AttendanceMarker
30. NoteEditor

### 6.2 Brand Audit Criteria

For each page, verify:
| Criteria | Requirement |
|----------|-------------|
| Colors | Only brand palette (#4580E4, #FFCE00, #96DAC9, #FFAE9E, #FCF6E6) |
| Typography | h1-h4 use Monkey Mayhem, body uses Avenir/Inter |
| Shadows | No drop shadows (`boxShadow: 'none'`) |
| Borders | Subtle borders instead of shadows |
| Buttons | Flat design, no gradients |
| Cards | Border radius 16px, subtle border |
| Icons | Consistent sizing, brand colors |

### 6.3 Mobile Responsiveness

**Breakpoints:**
- xs: 0
- sm: 600px
- md: 900px
- lg: 1200px
- xl: 1536px

**Key Areas:**
- Dashboard stat widgets stack vertically on mobile
- Data tables have horizontal scroll on mobile
- Modal dialogs are full screen on mobile
- Forms have full width inputs on mobile

### 6.4 Loading States

```tsx
// Use Skeleton with brand background
<Skeleton
  variant="rectangular"
  height={100}
  sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
/>
```

### 6.5 Error States

```tsx
// Use Alert with brand coral color
<Alert
  severity="error"
  sx={{
    bgcolor: '#FFAE9E',
    color: '#080808',
    border: 'none'
  }}
>
  Error message
</Alert>
```

### 6.6 Accessibility

- [ ] Add ARIA labels to icon-only buttons
- [ ] Ensure color contrast ratio >= 4.5:1
- [ ] Add keyboard navigation for modals
- [ ] Add focus indicators
- [ ] Add skip-to-content link

### Tasks:
- [ ] Audit all 30 pages against brand criteria
- [ ] Fix any color/typography violations
- [ ] Remove any drop shadows
- [ ] Verify mobile responsiveness
- [ ] Update loading states with brand styling
- [ ] Update error states with brand styling
- [ ] Add accessibility improvements

**Agent:** `ui-designer`

---

## Phase 7: Testing

### 7.1 Component Tests

**Files to Create:**
- `apps/frontend/src/components/dashboard/__tests__/StatWidget.test.tsx`
- `apps/frontend/src/components/dashboard/__tests__/ActivityFeed.test.tsx`
- `apps/frontend/src/components/dashboard/__tests__/QuickActions.test.tsx`
- `apps/frontend/src/components/dashboard/__tests__/SyncStatusCard.test.tsx`
- `apps/frontend/src/components/brand/__tests__/CharacterIllustration.test.tsx`

**Test Coverage:**
- Rendering with all prop variations
- Loading states
- Click handlers
- Empty states
- Error states

### 7.2 Integration Tests

**File to Create:** `apps/backend/tests/integration/dashboard.routes.test.ts`

**Test Cases:**
1. Admin stats endpoint returns all metrics
2. Teacher stats filtered by teacherId
3. Parent stats filtered by familyId
4. Activity feed pagination works
5. Multi-tenancy isolation (schoolId filtering)
6. Unauthorized access denied

### 7.3 Mobile Responsiveness Tests

**Approach:** Manual testing on multiple viewport sizes
- 320px (iPhone SE)
- 375px (iPhone)
- 768px (iPad)
- 1024px (Desktop)
- 1440px (Large desktop)

### Tasks:
- [ ] Create component tests for StatWidget
- [ ] Create component tests for ActivityFeed
- [ ] Create component tests for QuickActions
- [ ] Create component tests for CharacterIllustration
- [ ] Create integration tests for dashboard endpoints
- [ ] Run mobile responsiveness tests
- [ ] Fix any test failures

**Agent:** `testing-qa-specialist`

---

## Implementation Order

### Day 1: Backend + Components
1. Phase 1: Create dashboard service and routes
2. Phase 2: Create reusable dashboard components

### Day 2: Admin Dashboard
3. Phase 3: Enhance AdminDashboardPage

### Day 3: Teacher + Parent Dashboards
4. Phase 4: Enhance TeacherDashboardPage
5. Phase 5: Enhance ParentDashboardPage

### Day 4: Brand Audit
6. Phase 6: Audit all 30 pages, fix issues

### Day 5: Testing + Polish
7. Phase 7: Write tests, fix bugs
8. Final polish and review

---

## Success Criteria

| Phase | Criteria |
|-------|----------|
| Phase 1 | Dashboard service returns stats in <100ms, all endpoints have schoolId filtering |
| Phase 2 | StatWidget matches brand styling, components are accessible |
| Phase 3 | Admin dashboard shows 6 stat widgets, quick actions work, activity feed shows data |
| Phase 4 | Teacher sees recent files and assigned M&Gs |
| Phase 5 | Parent sees hybrid booking status and quick payment button |
| Phase 6 | 30 pages audited, zero brand violations, mobile responsive |
| Phase 7 | 100% component test coverage for new widgets, all integration tests pass |

---

## Critical Files

| File | Purpose |
|------|---------|
| `apps/frontend/src/pages/admin/AdminDashboardPage.tsx` | Primary target for enhancement |
| `apps/frontend/src/styles/theme.ts` | Brand colors and character colors |
| `apps/backend/src/services/invoice.service.ts` | Aggregation pattern reference |
| `apps/frontend/src/hooks/useInvoices.ts` | React Query hook pattern |
| `apps/backend/src/services/meetAndGreet.service.ts` | M&G data aggregation |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Performance of aggregation queries | Add database indexes, use caching |
| Multi-tenancy violation | Code review for schoolId filtering |
| Brand inconsistency | Create checklist, systematic audit |
| Mobile responsiveness gaps | Test on multiple devices |
| Test coverage gaps | Write tests alongside components |

---

## Dependencies

**From Previous Weeks:**
- Week 10: Notification system (complete)
- Week 9: Google Drive frontend (complete)
- Week 8: Google Drive backend (complete)
- Week 7: Invoicing & payments (complete)
- Week 6: Attendance & notes (complete)

**For Week 12:**
- Polished dashboards for final testing
- Brand-compliant UI for launch readiness
- Mobile responsive for user acceptance testing
