# Week 11 Study: Polish, Dashboards & Reports

**Date:** 2025-12-26
**Status:** Ready to Implement
**Overall Project Progress:** 83% (10/12 weeks complete)

---

## Overview

Week 11 is the second-to-last week of the 12-week MVP plan, focused on:
1. **UI Polish & Brand Refinement** (Days 1-2)
2. **Admin Dashboard Enhancements** (Days 3-4)
3. **Teacher & Parent Dashboard Enhancements** (Day 5)

This week brings the platform from 83% to ~92% completion, setting up Week 12 for final testing and deployment.

---

## Week 11 Scope (from 12_Week_MVP_Plan.md)

### Days 1-2: UI Polish + Brand Refinement

**Brand Consistency Audit:**
- Verify official brand colors across all pages:
  - Primary: `#4580E4` (blue)
  - Secondary: `#FFCE00` (yellow)
  - Accent: `#96DAC9` (mint), `#FFAE9E` (coral), `#FCF6E6` (cream)
- Ensure Monkey Mayhem font used for all headings
- Ensure Avenir font used for body text
- Confirm flat design (no gradients/drop shadows)
- Logo clear space validation
- Age-appropriate character illustrations (Alice, Steve, Liam, Floyd)
- Sub-brand icons for lesson types (Mini, Master, Mezzo, Molto, Maestro, Voice)

**Technical Improvements:**
- Responsive design for tablets and mobile
- Loading states with brand styling
- Error handling with brand styling
- Accessibility improvements (ARIA labels, keyboard navigation, color contrast)

### Days 3-4: Admin Dashboard Enhancements

**Statistics Widgets:**
- Total students (active)
- Total lessons this week
- Attendance rate (weekly/monthly)
- Pending payments
- Upcoming meet & greets
- Google Drive sync status

**Quick Actions:**
- Create lesson
- Create invoice
- View pending meet & greets

**Activity Feed:**
- Recent enrollments
- Recent payments
- Recent bookings

### Day 5: Teacher & Parent Dashboard Enhancements

**Teacher Dashboard:**
- This week's lessons (all school lessons)
- Attendance summary
- Recently uploaded files
- Pending meet & greets assigned to them

**Parent Dashboard:**
- Children's upcoming lessons
- Outstanding invoices
- Recently shared files
- Quick payment button

---

## Current Implementation Status

### What's Already Built

**AdminDashboardPage.tsx:**
- Basic stat cards (Terms, Locations, Instruments, Teachers, Students, Families)
- Loading skeletons
- Current term identification
- React Query data fetching
- **Needs:** Attendance rate, payments, M&G, Drive sync, activity feed

**TeacherDashboardPage.tsx (687 lines):**
- Stats: Lessons this week, Present students, Attendance rate, Notes pending
- Tabs: My Schedule, Attendance, Notes, Pending Notes
- Full school access for viewing all lessons
- Attendance interface, Note editor
- **Needs:** Recently uploaded files, Pending M&G section

**ParentDashboardPage.tsx (534 lines):**
- Stats: Children, Upcoming lessons, Invoices outstanding, Shared files
- Tabs: My Family, Schedule, Notes, Files
- Student selector for multi-child families
- Weekly schedule view
- **Needs:** Hybrid bookings status, Quick payment button, Activity feed

### Backend Services Available

| Service | Lines | Status |
|---------|-------|--------|
| attendance.service.ts | 352 | ✅ Complete |
| hybridBooking.service.ts | 1,214 | ✅ Complete |
| invoice.service.ts | 1,108 | ✅ Complete |
| lesson.service.ts | 955 | ✅ Complete |
| notification.service.ts | 327 | ✅ Complete (Week 10) |
| notes.service.ts | 512 | ✅ Complete |
| googleDriveFile.service.ts | 350 | ✅ Complete |

### Frontend Pages (30 total)

All major pages implemented:
- Admin: Dashboard, Calendar, Lessons, Students, Families, Invoices, Meet & Greet, Google Drive
- Teacher: Dashboard
- Parent: Dashboard, Hybrid Booking, Invoices, Resources, Notifications
- Public: Meet & Greet Booking, Verification
- Auth: Login, Role-based Dashboard

---

## Brand Implementation

### Colors (Already in Theme)
```typescript
primary: { main: '#4580E4', light: '#a3d9f6', dark: '#3899ec' }
secondary: { main: '#FFCE00' }
accent: { mint: '#96DAC9', coral: '#FFAE9E', cream: '#FCF6E6' }
background: { default: '#ffffff', paper: '#FCF6E6' }
text: { primary: '#080808', secondary: '#9DA5AF' }
```

### Typography
- **Monkey Mayhem**: Page titles, hero text, playful headings
- **Avenir**: Body text, forms, tables, UI elements
- Fallback: System fonts (Roboto, SF Pro, Segoe UI)

### Characters (Age Group Mascots)
| Character | Age Group | Color |
|-----------|-----------|-------|
| Alice | Pre-school | Pink (#FFAE9E) |
| Steve | Kids | Yellow (#FFCE00) |
| Liam | Teens | Blue (#4580E4) |
| Floyd | Adult/Senior | Mint (#96DAC9) |

### Sub-Brands (Program Levels)
| Sub-Brand | Target | Icon |
|-----------|--------|------|
| Music N Me Mini | Pre-school | Rainbow |
| Music N Me Master | Kids | Purple/Yellow piano |
| Music N Me Mezzo | Kids/Teens | Blue/Yellow piano |
| Music N Me Molto | Advanced | Black/Yellow piano |
| Music N Me Maestro | Intermediate | Teal/Yellow Pac-Man |
| Music N Me Voice | Singing | Pink microphone |

---

## Key Files to Modify

### Frontend Pages
```
apps/frontend/src/pages/admin/AdminDashboardPage.tsx
apps/frontend/src/pages/teacher/TeacherDashboardPage.tsx
apps/frontend/src/pages/parent/ParentDashboardPage.tsx
```

### Theme & Styling
```
apps/frontend/src/styles/theme.ts
apps/frontend/src/components/layout/
```

### New Components Needed
```
apps/frontend/src/components/dashboard/
  - StatWidget.tsx
  - ActivityFeed.tsx
  - QuickActions.tsx
  - SyncStatusWidget.tsx
apps/frontend/src/components/brand/
  - CharacterIllustration.tsx
  - SubBrandIcon.tsx
```

### Backend Endpoints (May Need)
```
GET /api/admin/dashboard/stats
GET /api/admin/dashboard/activity
GET /api/teacher/dashboard/stats
GET /api/parent/dashboard/stats
```

---

## Database Models for Dashboard Queries

### Key Aggregations Needed

**Admin Dashboard:**
```sql
-- Attendance rate
SELECT COUNT(*) FILTER (WHERE status = 'PRESENT') * 100.0 / COUNT(*)
FROM attendances WHERE schoolId = ? AND date >= ?;

-- Pending payments
SELECT SUM(amountDue - amountPaid)
FROM invoices WHERE schoolId = ? AND status IN ('SENT', 'OVERDUE');

-- Upcoming meet & greets
SELECT COUNT(*)
FROM meet_and_greets WHERE schoolId = ? AND status = 'SCHEDULED' AND scheduledAt > NOW();
```

**Teacher Dashboard:**
```sql
-- Lessons this week
SELECT * FROM lessons
WHERE schoolId = ? AND instructorId = ?
AND startTime BETWEEN ? AND ?;

-- Pending notes
SELECT COUNT(*) FROM lesson_enrollments le
JOIN lessons l ON le.lessonId = l.id
WHERE l.schoolId = ? AND l.instructorId = ?
AND NOT EXISTS (SELECT 1 FROM notes WHERE lessonEnrollmentId = le.id);
```

---

## Expected Deliverables

By end of Week 11:
- [ ] Admin dashboard with key metrics (6 widgets)
- [ ] Admin dashboard quick actions (3 buttons)
- [ ] Admin dashboard activity feed
- [ ] Teacher dashboard enhancements
- [ ] Parent dashboard enhancements
- [ ] Brand consistency across all 30 pages
- [ ] Mobile-responsive design verified
- [ ] Loading states with brand styling
- [ ] Character illustrations on dashboards

---

## Success Criteria

From 12_Week_MVP_Plan.md:
- ✓ Admin dashboard with key metrics
- ✓ Teacher dashboard (full school view)
- ✓ Parent dashboard (family view)
- ✓ Mobile-responsive design

---

## Related Features & Dependencies

### Dependencies FROM Previous Weeks
- Week 10: Notification system (complete)
- Week 9: Google Drive frontend (complete)
- Week 8: Google Drive backend (complete)
- Week 7: Invoicing & payments (complete)
- Week 6: Attendance & notes (complete)
- Week 5: Hybrid booking (complete)

### Dependencies FOR Week 12
- Polished dashboards for final testing
- Brand-compliant UI for launch readiness
- Mobile responsive for user acceptance testing

---

## Security Considerations

**Multi-Tenancy (CRITICAL):**
All dashboard queries MUST include `schoolId` filtering:
```typescript
// ✅ CORRECT
const stats = await prisma.student.count({
  where: { schoolId: req.user.schoolId, status: 'ACTIVE' }
});

// ❌ WRONG - Data leakage risk
const stats = await prisma.student.count({
  where: { status: 'ACTIVE' }
});
```

---

## Effort Estimation

| Task | Effort | Lines (est.) |
|------|--------|--------------|
| Brand audit (30 pages) | Medium | 400-600 |
| Admin dashboard widgets | High | 300-400 |
| Activity feed component | Medium | 150-200 |
| Teacher dashboard updates | Low | 100-150 |
| Parent dashboard updates | Low | 100-150 |
| Backend stat endpoints | Medium | 100-200 |
| **Total** | **3-5 days** | **~1,200 lines** |

---

## Next Steps

1. Start with brand audit across all pages
2. Create reusable dashboard widget components
3. Implement admin dashboard stats endpoints
4. Build activity feed component
5. Enhance teacher and parent dashboards
6. Test mobile responsiveness
7. Write/update tests for new components

---

## References

- `Planning/roadmaps/12_Week_MVP_Plan.md` (lines 511-558)
- `CLAUDE.md` (brand guidelines, security rules)
- `PROGRESS.md` (overall status)
- `md/report/week-10.md` (previous week details)
