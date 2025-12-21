# Account Deletion Specification

## Overview

This document defines the account deletion process for Music 'n Me, ensuring compliance with:
- **Australian Privacy Act** (APP 13 - right to correction/deletion)
- **GDPR** (Article 17 - right to erasure / "right to be forgotten")
- **COPPA** (Children's Online Privacy Protection Act - US, children under 13)

**Last Updated:** 2025-12-21

---

## Table of Contents

1. [Deletion Hierarchy](#1-deletion-hierarchy)
2. [Deletion Types](#2-deletion-types)
3. [Parent/Guardian Deletion](#3-parentguardian-deletion)
4. [Student (Child) Deletion](#4-student-child-deletion)
5. [Family Deletion](#5-family-deletion)
6. [Teacher Deletion](#6-teacher-deletion)
7. [School Deletion](#7-school-deletion)
8. [Data Retention Policy](#8-data-retention-policy)
9. [What Gets Deleted vs Retained](#9-what-gets-deleted-vs-retained)
10. [Deletion Workflow](#10-deletion-workflow)
11. [Technical Implementation](#11-technical-implementation)
12. [Audit & Compliance](#12-audit--compliance)

---

## 1. Deletion Hierarchy

Understanding the relationship hierarchy is critical for proper deletion:

```
School (tenant)
├── Teachers (users with TEACHER role)
├── Families
│   ├── Primary Parent/Guardian (required, account owner)
│   ├── Secondary Parent/Guardian (optional)
│   ├── Emergency Contact (not a user, just contact info)
│   └── Students (children)
│       ├── Enrollments → Lessons
│       ├── Attendance records
│       ├── Notes (from teachers)
│       └── Resources (files)
├── Lessons
├── Invoices & Payments
└── Meet & Greet records
```

### Key Relationships

| Entity | Can Delete Self? | Who Can Delete? | Cascade Behavior |
|--------|------------------|-----------------|------------------|
| School | No (admin only) | Super Admin | Deletes ALL data |
| Teacher | Yes (request) | Admin | Reassign lessons first |
| Primary Parent | Yes (request) | Admin, Self | Complex - see section 3 |
| Secondary Parent | Yes (request) | Admin, Primary Parent | Unlinks from family |
| Student | No | Primary Parent, Admin | Removes enrollments |
| Family | No (implicit) | Primary Parent, Admin | Deletes when no members |

---

## 2. Deletion Types

### 2.1 Soft Delete (Grace Period)

- Record marked as `deletedAt = timestamp`
- Data hidden from UI but remains in database
- **30-day grace period** for recovery
- User cannot log in during soft-delete period
- Automated job runs daily to identify records past grace period

### 2.2 Hard Delete (Permanent)

- Occurs automatically 30 days after soft delete
- Personal data permanently removed
- Financial records anonymized (not deleted)
- Audit log retained
- **Irreversible**

### 2.3 Anonymization (for retained records)

Some records must be retained for legal/financial reasons but personal data removed:

```
Before: { name: "John Smith", email: "john@example.com", amount: 500 }
After:  { name: "DELETED_USER_abc123", email: null, amount: 500 }
```

---

## 3. Parent/Guardian Deletion

### 3.1 Scenarios

#### Scenario A: Primary Parent Requests Deletion (Single Parent Family)

**Situation:** Only one parent on the account, with 1+ children.

**Process:**
1. Parent submits deletion request (authenticated)
2. System checks for:
   - Outstanding invoices (must be $0 balance)
   - Active term enrollments (warn about forfeit)
3. Admin receives notification for review
4. If approved:
   - All children soft-deleted
   - Parent account soft-deleted
   - Family record soft-deleted
   - 30-day grace period begins
5. Confirmation email sent with recovery instructions

#### Scenario B: Primary Parent Requests Deletion (Two-Parent Family)

**Situation:** Two parents on account. Primary parent wants to leave.

**Options:**
1. **Transfer Primary Role:** Secondary parent becomes primary
   - Primary parent unlinked from family
   - Primary parent account deleted
   - Children and family remain with new primary

2. **Full Family Deletion:** Both parents agree
   - Requires confirmation from secondary parent (email verification)
   - All family members deleted

**Process:**
1. Primary parent submits deletion request
2. System detects secondary parent exists
3. Primary parent chooses: "Delete only me" or "Delete entire family"
4. If "Delete only me":
   - Secondary parent notified and must accept primary role
   - 7-day window for secondary to respond
   - If no response: Admin manually intervenes
5. If "Delete entire family":
   - Secondary parent receives verification email
   - Must confirm within 7 days
   - Both confirmations required for family deletion

#### Scenario C: Secondary Parent Requests Deletion

**Situation:** Secondary parent wants to leave, primary remains.

**Process:**
1. Secondary parent submits deletion request
2. No approval needed from primary parent
3. Secondary parent unlinked from family
4. Secondary parent account soft-deleted
5. Children and primary parent unaffected
6. Primary parent notified of change

### 3.2 Blockers (Cannot Delete Until Resolved)

| Blocker | Resolution Required |
|---------|---------------------|
| Outstanding balance > $0 | Pay invoices or admin writes off |
| Pending hybrid bookings | Cancel bookings or wait until completed |
| Active dispute/complaint | Resolve dispute first |
| Ongoing legal matter | Admin override with documentation |

---

## 4. Student (Child) Deletion

### 4.1 Who Can Delete a Student?

- **Primary Parent/Guardian** - full authority
- **Admin** - with parent consent (documented)
- **Student themselves** - NO (minors cannot consent to deletion)

### 4.2 COPPA Compliance (Children Under 13)

For students under 13 years old:
- Deletion requests from parents must be honored within **reasonable time** (typically 48 hours)
- No additional verification barriers for parents
- School cannot deny parental deletion request for children under 13

### 4.3 Student Deletion Process

1. Parent requests student deletion via portal
2. System checks:
   - No outstanding balance attributable to this student
   - Confirms parent is authorized (primary parent of family)
3. If other siblings exist: Only this student deleted
4. If only child: Warn that family may be deleted if no students remain
5. Student soft-deleted:
   - Removed from all lesson enrollments
   - Attendance records anonymized (kept for teacher records)
   - Notes anonymized
   - Resources unlinked
6. 30-day grace period
7. Hard delete after 30 days

### 4.4 What Happens to Teacher Notes?

Teacher notes about students are work product but contain personal data.

**Approach:**
- Notes anonymized but retained for 90 days (teacher reference)
- After 90 days, notes deleted entirely
- Teacher notified that notes will be removed

---

## 5. Family Deletion

### 5.1 Implicit Deletion

A family record is automatically deleted when:
- All students removed AND
- All parents removed or unlinked

### 5.2 Explicit Family Deletion

Primary parent can request family deletion:
1. All members (parents + students) deleted together
2. Secondary parent must confirm (if exists)
3. Single deletion request covers entire family

### 5.3 Family Deletion Cascade

```
Family Deletion
├── Primary Parent → Soft Delete
├── Secondary Parent → Soft Delete (or unlink if they choose to keep account)
├── All Students → Soft Delete
├── All Enrollments → Hard Delete (no PII)
├── All Attendance → Anonymize (keep statistics)
├── All Notes → Anonymize then delete after 90 days
├── All Invoices → Anonymize (keep financial records)
├── All Payments → Anonymize (keep financial records)
└── Resources → Delete student-specific, keep class-wide
```

---

## 6. Teacher Deletion

### 6.1 Teacher-Initiated Deletion

Teachers can request their own account deletion:

1. Teacher submits deletion request
2. Admin notified
3. Admin must:
   - Reassign all active lessons to another teacher
   - Reassign any pending notes to admin
   - Transfer resource ownership to school
4. Once lessons reassigned:
   - Teacher account soft-deleted
   - 30-day grace period
   - Hard delete after 30 days

### 6.2 Admin-Initiated Teacher Deletion

Admin can delete teacher accounts:

1. Same reassignment requirements
2. Teacher notified of deletion
3. Optional: Allow teacher to download their data first (GDPR right)
4. Soft delete with 30-day grace

### 6.3 Teacher Notes Handling

When teacher is deleted:
- Notes attributed to "Former Teacher" (anonymized author)
- Notes content retained (valuable for student history)
- After configurable period, notes deleted entirely

---

## 7. School Deletion

### 7.1 When School Deletion Occurs

- School subscription cancelled (SaaS model)
- School requests full data deletion
- School merged with another school

### 7.2 School Deletion Process

**This is the nuclear option - all school data is removed.**

1. Super Admin initiates school deletion (not regular admin)
2. 30-day notice period to all users:
   - Email to all parents, teachers, admins
   - "Your school account will be deleted on [date]"
   - Instructions to download personal data
3. During 30-day notice:
   - Users can export their data
   - School becomes read-only
   - No new enrollments or payments
4. After 30 days:
   - All users soft-deleted
   - All data marked for deletion
5. After additional 30 days (60 total):
   - All data hard-deleted
   - Financial records anonymized and archived
   - Audit log retained for 7 years

### 7.3 School Data Export (Pre-Deletion)

Before deletion, school admin can export:
- All student records (CSV)
- All family contact info (CSV)
- All attendance records (CSV)
- All invoices and payments (CSV)
- All resources (ZIP)

### 7.4 Financial Record Retention

Even after school deletion:
- Anonymized financial records retained per school's configured retention period
- Default: 7 years (Australian tax law)
- Stored in cold storage (archived database)

---

## 8. Data Retention Policy

### 8.1 Configurable Per School

Each school can configure:

```typescript
interface DataRetentionPolicy {
  // How long financial records are kept after deletion (years)
  financialRetentionYears: number; // Default: 7, Min: 5, Max: 10

  // How long to keep anonymized attendance data (years)
  attendanceRetentionYears: number; // Default: 3, Min: 1, Max: 7

  // How long teacher notes are kept after student deletion (days)
  teacherNotesRetentionDays: number; // Default: 90, Min: 30, Max: 365

  // Grace period before hard delete (days)
  softDeleteGracePeriodDays: number; // Default: 30, Min: 14, Max: 90

  // How long to keep audit logs (years)
  auditLogRetentionYears: number; // Default: 7, Min: 5, Max: 10
}
```

### 8.2 Default Retention Settings

| Data Type | Default Retention | Reason |
|-----------|-------------------|--------|
| Financial records | 7 years | Tax law compliance |
| Audit logs | 7 years | Legal protection |
| Anonymized attendance | 3 years | School statistics |
| Teacher notes (after student delete) | 90 days | Teacher reference |
| Soft-deleted accounts | 30 days | Accidental deletion recovery |
| Meet & Greet records | 2 years | Marketing analytics |

### 8.3 Minimum Retention (Cannot Override)

Some data must be retained regardless of school settings:
- Financial records: **Minimum 5 years** (regulatory requirement)
- Audit logs: **Minimum 5 years** (legal protection)

---

## 9. What Gets Deleted vs Retained

### 9.1 Personal Data (DELETED)

| Data | Soft Delete | Hard Delete |
|------|-------------|-------------|
| Name | Hidden | Removed |
| Email | Hidden | Removed |
| Phone | Hidden | Removed |
| Address | Hidden | Removed |
| Emergency contacts | Hidden | Removed |
| Profile photo | Hidden | Removed |
| Password hash | Invalidated | Removed |
| Birth date | Hidden | Removed |
| Student notes content | Hidden | Anonymized/Removed |

### 9.2 Non-Personal Data (RETAINED)

| Data | Retention | Reason |
|------|-----------|--------|
| Invoice amounts | 7 years | Tax/accounting |
| Payment amounts | 7 years | Tax/accounting |
| Attendance statistics | 3 years | School reporting |
| Enrollment counts | Indefinite | School statistics |
| Lesson occurrence records | 1 year | Scheduling history |

### 9.3 Anonymization Examples

```javascript
// Before deletion
{
  parentName: "Sarah Johnson",
  parentEmail: "sarah.johnson@email.com",
  studentName: "Emma Johnson",
  invoiceAmount: 450.00,
  paidDate: "2025-03-15"
}

// After hard deletion (financial record retained)
{
  parentName: "DELETED_abc123",
  parentEmail: null,
  studentName: "DELETED_def456",
  invoiceAmount: 450.00,
  paidDate: "2025-03-15"
}
```

---

## 10. Deletion Workflow

### 10.1 User-Initiated Deletion Request

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER DELETION REQUEST FLOW                    │
└─────────────────────────────────────────────────────────────────┘

User clicks "Delete My Account"
        │
        ▼
┌───────────────────┐
│ Confirm identity  │ ← Re-enter password
│ (authentication)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌──────────────────┐
│ Check blockers    │────▶│ Show blockers    │
│ (balance, etc.)   │ NO  │ (cannot proceed) │
└─────────┬─────────┘     └──────────────────┘
          │ YES (no blockers)
          ▼
┌───────────────────┐
│ Show what will    │ ← List all data to be deleted
│ be deleted        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Require reason    │ ← Optional but encouraged
│ (feedback)        │   (helps improve service)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Final confirmation│ ← Type "DELETE" to confirm
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Submit request    │
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Admin review      │ ← Admin can approve/reject
│ (if required)     │   or auto-approve
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ SOFT DELETE       │ ← Account disabled
│ (30-day grace)    │   Data hidden but recoverable
└─────────┬─────────┘
          │
          │ 30 days pass
          ▼
┌───────────────────┐
│ HARD DELETE       │ ← Personal data removed
│ (permanent)       │   Financial data anonymized
└───────────────────┘
```

### 10.2 Admin-Initiated Deletion

1. Admin navigates to user management
2. Selects user(s) to delete
3. Provides reason (required)
4. System checks blockers
5. User notified via email
6. Soft delete immediate (no user confirmation needed)
7. 30-day grace period
8. Hard delete

### 10.3 Recovery (During Grace Period)

1. User contacts school admin
2. Admin verifies identity
3. Admin clicks "Restore Account"
4. Account reactivated immediately
5. User receives email with new login link
6. Deletion cancelled

---

## 11. Technical Implementation

### 11.1 Database Schema Additions

```prisma
// Add to existing User model
model User {
  // ... existing fields

  deletedAt         DateTime?    // Soft delete timestamp
  deletionRequestedAt DateTime?  // When deletion was requested
  deletionRequestedBy String?    // Who requested (self or admin ID)
  deletionReason    String?      // Why (for feedback)
  deletionApprovedAt DateTime?   // When admin approved
  deletionApprovedBy String?     // Admin who approved
  anonymizedAt      DateTime?    // When personal data was removed
}

// Add to existing Student model
model Student {
  // ... existing fields

  deletedAt         DateTime?
  deletionRequestedAt DateTime?
  deletionRequestedBy String?    // Parent ID who requested
  anonymizedAt      DateTime?
}

// Add to existing Family model
model Family {
  // ... existing fields

  deletedAt         DateTime?
}

// New model for deletion audit trail
model DeletionAuditLog {
  id              String   @id @default(cuid())
  schoolId        String
  entityType      String   // USER, STUDENT, FAMILY, SCHOOL
  entityId        String
  action          String   // SOFT_DELETE, HARD_DELETE, RESTORE, ANONYMIZE
  requestedBy     String   // User ID or "SYSTEM" for automated
  approvedBy      String?  // Admin ID if approval required
  reason          String?
  affectedRecords Json     // Summary of what was affected
  createdAt       DateTime @default(now())

  school          School   @relation(fields: [schoolId], references: [id])

  @@index([schoolId])
  @@index([entityType, entityId])
  @@index([createdAt])
}

// School-level retention policy configuration
model SchoolRetentionPolicy {
  id                        String @id @default(cuid())
  schoolId                  String @unique

  financialRetentionYears   Int    @default(7)
  attendanceRetentionYears  Int    @default(3)
  teacherNotesRetentionDays Int    @default(90)
  softDeleteGracePeriodDays Int    @default(30)
  auditLogRetentionYears    Int    @default(7)

  updatedAt                 DateTime @updatedAt

  school                    School @relation(fields: [schoolId], references: [id])
}
```

### 11.2 API Endpoints

```typescript
// User self-deletion
POST /api/users/me/request-deletion
Body: { reason?: string, confirmPassword: string }
Response: { requestId: string, gracePeriodEnds: Date }

// Check deletion blockers
GET /api/users/me/deletion-blockers
Response: { canDelete: boolean, blockers: Blocker[] }

// Cancel deletion request (during grace period)
POST /api/users/me/cancel-deletion
Response: { success: boolean }

// Admin: List deletion requests
GET /api/admin/deletion-requests
Response: { requests: DeletionRequest[] }

// Admin: Approve deletion
POST /api/admin/deletion-requests/:id/approve
Response: { success: boolean }

// Admin: Reject deletion
POST /api/admin/deletion-requests/:id/reject
Body: { reason: string }
Response: { success: boolean }

// Admin: Restore soft-deleted account
POST /api/admin/users/:id/restore
Response: { success: boolean }

// Admin: Delete user (initiate)
DELETE /api/admin/users/:id
Body: { reason: string }
Response: { success: boolean, gracePeriodEnds: Date }

// Parent: Delete child
DELETE /api/parent/students/:id
Body: { confirmPassword: string }
Response: { success: boolean, gracePeriodEnds: Date }

// Admin: Export user data (GDPR right)
GET /api/admin/users/:id/export
Response: { downloadUrl: string }

// User: Export own data (GDPR right)
GET /api/users/me/export
Response: { downloadUrl: string }

// School: Configure retention policy
PATCH /api/admin/school/retention-policy
Body: SchoolRetentionPolicy
Response: { success: boolean }
```

### 11.3 Background Jobs

```typescript
// Daily job: Process hard deletes
// Runs at 2 AM school timezone
Job: processHardDeletes
- Find all soft-deleted records past grace period
- For each record:
  - Anonymize personal data
  - Remove from search indexes
  - Delete files from storage
  - Create audit log entry
  - Mark as anonymizedAt = now()

// Daily job: Send deletion reminders
// Runs at 9 AM school timezone
Job: sendDeletionReminders
- Find soft-deleted accounts at 7 days, 3 days, 1 day before hard delete
- Send reminder email with recovery instructions

// Weekly job: Clean up anonymized data
// Runs Sunday at 3 AM
Job: cleanupAnonymizedData
- Find teacher notes past retention period → delete
- Find attendance records past retention period → delete
- Find meet & greet records past retention period → delete

// Yearly job: Archive old financial records
// Runs January 1st
Job: archiveFinancialRecords
- Move financial records older than retention period to cold storage
```

### 11.4 Email Templates Required

| Template | Recipient | Trigger |
|----------|-----------|---------|
| deletion_request_submitted | User | User requests deletion |
| deletion_request_approved | User | Admin approves |
| deletion_request_rejected | User | Admin rejects (with reason) |
| deletion_reminder_7_days | User | 7 days before hard delete |
| deletion_reminder_3_days | User | 3 days before hard delete |
| deletion_reminder_1_day | User | 1 day before hard delete |
| account_deleted_confirmation | User | Hard delete completed |
| deletion_cancelled | User | User or admin cancelled |
| secondary_parent_confirmation | Secondary parent | Primary requests family deletion |
| child_deleted_notification | Parents | Child record deleted |
| school_deletion_notice | All users | School being deleted |
| data_export_ready | User | Export ready for download |

---

## 12. Audit & Compliance

### 12.1 What Gets Logged

Every deletion action creates an audit log entry:

```typescript
{
  id: "del_abc123",
  schoolId: "sch_xyz789",
  entityType: "USER",
  entityId: "usr_def456",
  action: "SOFT_DELETE",
  requestedBy: "usr_def456", // Self-deletion
  approvedBy: "usr_admin123",
  reason: "No longer attending this school",
  affectedRecords: {
    students: ["stu_111", "stu_222"],
    enrollments: 5,
    attendanceRecords: 48,
    invoices: 3,
    payments: 2,
    notes: 12
  },
  createdAt: "2025-03-15T10:30:00Z"
}
```

### 12.2 Audit Log Retention

- Audit logs retained for **minimum 7 years** (configurable up to 10)
- Cannot be deleted even if school is deleted
- Stored in separate audit database
- Immutable (append-only)

### 12.3 Compliance Checklist

| Requirement | GDPR | Australian Privacy | COPPA | Implementation |
|-------------|------|-------------------|-------|----------------|
| Right to erasure | Art 17 | APP 13 | Yes | Deletion workflow |
| Right to data portability | Art 20 | - | Yes | Data export |
| Parental consent for children | - | - | Required | Parent-only deletion |
| Response time | 30 days | Reasonable | Reasonable | 48h processing, 30d grace |
| Notification of deletion | Required | - | - | Email confirmations |
| Record of processing | Art 30 | - | - | Audit logs |

### 12.4 Annual Compliance Review

Schools should review annually:
- [ ] Retention policies still appropriate
- [ ] All deletion requests processed
- [ ] Audit logs intact
- [ ] No orphaned personal data
- [ ] Staff trained on deletion procedures

---

## Appendix A: User Interface Mockups

### Delete Account Page (Parent)

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Delete Your Account                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  We're sorry to see you go. Before you delete your account, │
│  please understand what will happen:                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📋 Data that will be deleted:                          │ │
│  │                                                        │ │
│  │ • Your personal information (name, email, phone)       │ │
│  │ • Your children's records:                             │ │
│  │   - Emma Johnson (Piano, Grade 3)                      │ │
│  │   - Liam Johnson (Guitar, Grade 1)                     │ │
│  │ • Attendance history                                   │ │
│  │ • Teacher notes                                        │ │
│  │ • Uploaded files and resources                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📁 Data that will be retained (anonymized):            │ │
│  │                                                        │ │
│  │ • Invoice and payment records (required by law)        │ │
│  │ • Attendance statistics (no personal info)             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⏱️ 30-Day Grace Period                                  │ │
│  │                                                        │ │
│  │ Your account will be disabled immediately but you      │ │
│  │ have 30 days to change your mind. Contact us to        │ │
│  │ restore your account during this period.               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📥 Export Your Data                                    │ │
│  │                                                        │ │
│  │ Before deleting, you can download a copy of your data. │ │
│  │                                                        │ │
│  │ [Download My Data]                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Why are you leaving? (optional)                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ○ Moving to a different school                         │ │
│  │ ○ Child no longer interested in music                  │ │
│  │ ○ Financial reasons                                    │ │
│  │ ○ Unhappy with service                                 │ │
│  │ ○ Other: ________________________________              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  To confirm deletion, enter your password:                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Type DELETE to confirm:                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Cancel]                              [Delete My Account]   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Decision Tree

```
START: User wants to delete account
│
├─ Is user a PARENT?
│  │
│  ├─ Is user PRIMARY parent?
│  │  │
│  │  ├─ Does SECONDARY parent exist?
│  │  │  │
│  │  │  ├─ YES: Ask "Delete just you or entire family?"
│  │  │  │       │
│  │  │  │       ├─ Just me: Transfer primary to secondary
│  │  │  │       │           Secondary must accept (7 days)
│  │  │  │       │           Delete just primary parent
│  │  │  │       │
│  │  │  │       └─ Entire family: Require secondary confirmation
│  │  │  │                        Both confirm → delete all
│  │  │  │
│  │  │  └─ NO: Deleting primary deletes entire family
│  │  │         (all children included)
│  │  │
│  │  └─ Check blockers (balance, bookings, disputes)
│  │     │
│  │     ├─ Blockers exist: Show blockers, cannot proceed
│  │     │
│  │     └─ No blockers: Proceed with deletion
│  │
│  └─ Is user SECONDARY parent?
│     │
│     └─ Unlink from family (children stay with primary)
│        Delete just secondary parent account
│
├─ Is user a TEACHER?
│  │
│  └─ Admin must reassign lessons first
│     Then teacher can be deleted
│
└─ Is user an ADMIN?
   │
   └─ Cannot delete own account if only admin
      Must transfer admin role first
```

---

## Appendix C: SaaS Multi-School Considerations

When selling to multiple schools:

### C.1 School Isolation

- Each school's deletion policy is independent
- Deleting from School A does not affect School B
- Users can belong to multiple schools (edge case: handle per-school)

### C.2 Super Admin Controls

Super Admin (platform owner) can:
- View all deletion requests across schools
- Override school retention policies (for legal reasons)
- Initiate school-level deletion
- Access audit logs across all schools

### C.3 Cross-School Users (Edge Case)

If a user (e.g., parent) has children at multiple schools:
- Deletion request applies to ONE school only
- Must submit separate requests per school
- Or request "Delete from all schools" (global deletion)

---

## Summary

This specification ensures Music 'n Me handles account deletion in a way that:

1. **Respects user rights** - Users can delete their data
2. **Protects children** - Parents control child data deletion
3. **Maintains compliance** - GDPR, Australian Privacy Act, COPPA
4. **Preserves business needs** - Financial records retained for legal periods
5. **Allows recovery** - 30-day grace period prevents accidents
6. **Supports multi-tenancy** - Each school has independent policies
7. **Creates audit trail** - All deletions logged for compliance

**Implementation Priority:** Phase 1 MVP (core deletion flow)
**Estimated Effort:** 2-3 weeks
