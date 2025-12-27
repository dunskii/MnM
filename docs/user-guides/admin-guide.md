# Music 'n Me - Admin User Guide

**Version:** 1.0
**Last Updated:** December 2025

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [School Configuration](#school-configuration)
4. [User Management](#user-management)
5. [Lesson Management](#lesson-management)
6. [Hybrid Lessons](#hybrid-lessons)
7. [Meet & Greet Management](#meet--greet-management)
8. [Invoicing & Payments](#invoicing--payments)
9. [Google Drive Integration](#google-drive-integration)
10. [Reports & Analytics](#reports--analytics)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Navigate to `https://app.musicnme.com.au`
2. Enter your email address
3. Enter your password
4. Select your school from the dropdown (if applicable)
5. Click **Login**

### First-Time Setup Checklist

Before inviting teachers and parents, complete these setup tasks:

- [ ] Configure school terms
- [ ] Set up locations and rooms
- [ ] Add instruments
- [ ] Configure lesson types and durations
- [ ] Create teacher accounts
- [ ] Connect Google Drive (optional)
- [ ] Set up Stripe for payments

---

## Dashboard Overview

The Admin Dashboard provides a quick overview of your school's activity.

### Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Total Students** | Active enrolled students |
| **Active Lessons** | Currently running lessons this term |
| **Pending Invoices** | Unpaid invoices requiring attention |
| **Upcoming Meet & Greets** | Scheduled trial sessions |
| **Recent Activity** | Latest enrollments, payments, bookings |
| **Google Drive Status** | Sync status for file sharing |

### Quick Actions

- **+ New Lesson** - Create a new lesson
- **+ New Student** - Add a student
- **Generate Invoices** - Create term invoices
- **View Calendar** - Open the schedule

---

## School Configuration

### Managing Terms

Terms define your teaching periods (e.g., Term 1, Term 2).

**To create a term:**
1. Go to **Settings** > **Terms**
2. Click **+ Add Term**
3. Enter:
   - Term name (e.g., "Term 1 2025")
   - Start date
   - End date
   - Number of weeks
4. Click **Save**

**To set the active term:**
1. Find the term in the list
2. Click the **Set Active** button
3. Only one term can be active at a time

### Managing Locations

Locations are your teaching venues (e.g., "Main Campus", "North Shore Studio").

**To add a location:**
1. Go to **Settings** > **Locations**
2. Click **+ Add Location**
3. Enter:
   - Location name
   - Address
   - Contact phone (optional)
4. Click **Save**

### Managing Rooms

Rooms are teaching spaces within locations.

**To add a room:**
1. Go to **Settings** > **Rooms**
2. Click **+ Add Room**
3. Select the location
4. Enter:
   - Room name (e.g., "Piano Room 1")
   - Capacity (maximum students)
5. Click **Save**

### Managing Instruments

**Default instruments:** Piano, Guitar, Drums, Singing, Bass, Preschool

**To add a custom instrument:**
1. Go to **Settings** > **Instruments**
2. Click **+ Add Instrument**
3. Enter the instrument name
4. Click **Save**

### Managing Lesson Types

**Default types:**
- **Individual** - One-on-one lessons (45 min default)
- **Group** - Multiple students (60 min default)
- **Band** - Ensemble sessions (60 min default)
- **Hybrid** - Alternating group/individual (variable)

**To customize:**
1. Go to **Settings** > **Lesson Types**
2. Edit default durations or add custom types

### Managing Durations

**Default durations:** 30 min, 45 min, 60 min

**To add custom duration:**
1. Go to **Settings** > **Durations**
2. Click **+ Add Duration**
3. Enter minutes
4. Click **Save**

---

## User Management

### Managing Teachers

**To add a teacher:**
1. Go to **Users** > **Teachers**
2. Click **+ Add Teacher**
3. Enter:
   - First name, Last name
   - Email address
   - Phone number
   - Instruments they teach (select multiple)
4. Click **Save**
5. Teacher receives welcome email with login credentials

**Teacher Permissions:**
- View ALL lessons and students (for coverage)
- Mark attendance for any lesson
- Add notes for students and classes
- Upload resources to lessons

### Managing Parents

**To add a parent:**
1. Go to **Users** > **Parents**
2. Click **+ Add Parent**
3. Enter:
   - **Primary Contact:** Name, email, phone
   - **Secondary Contact:** Name, email, phone (optional)
   - **Emergency Contact:** Name, phone, relationship
4. Click **Save**

**Note:** Parents are typically created through the Meet & Greet registration flow.

### Managing Students

**To add a student:**
1. Go to **Users** > **Students**
2. Click **+ Add Student**
3. Enter:
   - First name, Last name
   - Date of birth
   - Select parent/family
   - Select instrument(s)
4. Click **Save**

**Age Groups (Auto-calculated):**
- **Pre-school:** Under 5 years
- **Kids:** 5-12 years
- **Teens:** 13-17 years
- **Adults:** 18+ years

### Managing Families

Families group parents and their children together.

**To create a family:**
1. Go to **Users** > **Families**
2. Click **+ Add Family**
3. Enter family name
4. Add parents and students
5. Click **Save**

---

## Lesson Management

### Creating a Lesson

1. Go to **Lessons** > **All Lessons**
2. Click **+ New Lesson**
3. Fill in:
   - **Lesson name** (e.g., "Piano - Beginner Group")
   - **Type:** Individual, Group, Band, or Hybrid
   - **Instrument**
   - **Teacher**
   - **Location & Room**
   - **Day of week**
   - **Start time**
   - **Duration**
   - **Term**
   - **Maximum capacity** (for group lessons)
4. Click **Create Lesson**

### Enrolling Students

**Single enrollment:**
1. Open the lesson detail page
2. Click **Enroll Student**
3. Select student from dropdown
4. Click **Enroll**

**Bulk enrollment:**
1. Open the lesson detail page
2. Click **Bulk Enroll**
3. Select multiple students
4. Click **Enroll All**

### Viewing the Calendar

1. Go to **Calendar**
2. Use filters:
   - **Term** - Select which term to view
   - **Teacher** - Filter by teacher
   - **Location** - Filter by location
3. Click on any event to view details
4. **Drag and drop** to reschedule (conflicts are automatically detected)

### Color Coding

| Color | Lesson Type |
|-------|-------------|
| Blue (#4580E4) | Individual lessons |
| Yellow (#FFCE00) | Group lessons |
| Mint (#96DAC9) | Band lessons |
| Coral (#FFAE9E) | Hybrid lessons |

---

## Hybrid Lessons

Hybrid lessons are Music 'n Me's **core differentiator** - they alternate between group and individual sessions.

### Creating a Hybrid Lesson

1. Create a new lesson with type **Hybrid**
2. Configure the pattern:
   - **Alternating:** Group, Individual, Group, Individual...
   - **Custom:** Define your own pattern (e.g., 2 group, 1 individual)
3. Set group week duration (typically 60 min)
4. Set individual week duration (typically 45 min)
5. Save the lesson

### Opening Booking for Parents

1. Go to the hybrid lesson detail page
2. Click **Open Bookings**
3. Set the booking window:
   - **Start date** - When parents can start booking
   - **End date** - Deadline for booking
4. Click **Open**
5. Parents receive notification to book their individual sessions

### Managing Bookings

1. View **Booking Statistics** on the lesson page:
   - Total slots available
   - Slots booked
   - Students who haven't booked
2. Click **Send Reminder** to notify parents who haven't booked
3. View individual bookings in the **Bookings** tab

### 24-Hour Rule

Parents cannot book or reschedule within 24 hours of the session. This is automatically enforced by the system.

---

## Meet & Greet Management

Meet & Greet sessions are trial lessons for prospective families.

### Viewing Bookings

1. Go to **Meet & Greets**
2. View bookings by status:
   - **Pending** - Awaiting your review
   - **Approved** - Ready for registration
   - **Completed** - Fully registered
   - **Rejected** - Declined bookings

### Approving a Meet & Greet

1. Click on a pending booking
2. Review the details:
   - Student name and age
   - Preferred instrument
   - Contact information
   - Requested date/time
   - Notes from parent
3. Click **Approve**
4. Parent receives registration link with payment instructions

### Rejecting a Meet & Greet

1. Click on a pending booking
2. Click **Reject**
3. Enter reason (sent to parent)
4. Click **Confirm Rejection**

### After Registration

Once a parent completes registration and payment:
1. Family account is automatically created
2. Parent account is created
3. Student account is created
4. Welcome email is sent with login credentials
5. You can then enroll the student in lessons

---

## Invoicing & Payments

### Creating Invoices

**Single invoice:**
1. Go to **Invoices** > **Create Invoice**
2. Select family
3. Select term
4. Add line items:
   - **Packages** - Pre-defined lesson bundles
   - **Individual items** - Custom charges
5. Review total
6. Click **Create Invoice**

**Bulk invoices:**
1. Go to **Invoices** > **Generate Term Invoices**
2. Select term
3. Review families and amounts
4. Click **Generate All**

### Invoice Statuses

| Status | Description |
|--------|-------------|
| **Draft** | Not yet sent to parent |
| **Sent** | Awaiting payment |
| **Partially Paid** | Some payment received |
| **Paid** | Fully paid |
| **Overdue** | Past due date |
| **Cancelled** | Voided invoice |

### Recording Manual Payments

For cash, bank transfer, or cheque payments:

1. Open the invoice
2. Click **Record Payment**
3. Enter:
   - Payment amount
   - Payment method (Cash, Bank Transfer, Cheque)
   - Reference number (optional)
   - Notes (optional)
4. Click **Record**

### Stripe Payments

Parents can pay online via Stripe:
1. Parent clicks **Pay Now** on their invoice
2. Redirected to secure Stripe Checkout
3. Payment processed
4. Invoice automatically marked as paid
5. Receipt sent via email

### Hybrid Lesson Billing

Hybrid lessons are automatically billed with:
- **Group session rate** × number of group weeks
- **Individual session rate** × number of individual weeks

Example:
- 6 group weeks @ $25 = $150
- 4 individual weeks @ $45 = $180
- **Total: $330**

---

## Google Drive Integration

Connect your school's Google Drive for seamless file sharing.

### Connecting Google Drive

1. Go to **Settings** > **Google Drive**
2. Click **Connect Google Drive**
3. Sign in with your school's Google account
4. Grant permissions
5. You'll see "Connected" status

### Linking Folders

**To link a folder to a lesson:**
1. Go to the lesson detail page
2. Click **Link Google Drive Folder**
3. Browse your Drive folders
4. Select the folder
5. Click **Link**

**To link a folder to a student:**
1. Go to the student detail page
2. Click **Link Google Drive Folder**
3. Browse and select folder
4. Click **Link**

### File Visibility

When teachers upload files, they can set visibility:

| Visibility | Who Can See |
|------------|-------------|
| **All** | Teachers, Parents, Students |
| **Teachers & Parents** | Teachers and Parents only |
| **Teachers Only** | Only teachers |

### Sync Status

Files sync every 15 minutes automatically. To trigger manual sync:
1. Go to **Settings** > **Google Drive**
2. Click **Sync Now**

---

## Reports & Analytics

### Dashboard Statistics

The admin dashboard shows:
- Total students
- Active lessons
- Revenue this term
- Attendance rates
- Upcoming sessions

### Activity Feed

View recent activity:
- New enrollments
- Payments received
- Meet & Greet bookings
- Hybrid session bookings

### Exporting Data

Most tables support export:
1. Go to the data view (Students, Invoices, etc.)
2. Click **Export**
3. Select format (CSV, Excel, PDF)
4. Download file

---

## Troubleshooting

### Common Issues

**"Cannot login"**
- Check email and password
- Ensure you've selected the correct school
- Try "Forgot Password" to reset

**"Payment failed"**
- Check Stripe dashboard for error details
- Verify Stripe API keys in settings
- Contact parent to verify card details

**"Google Drive not syncing"**
- Check connection status in Settings
- Try disconnecting and reconnecting
- Verify folder permissions in Google Drive

**"Calendar shows conflicts"**
- Room or teacher is already booked at that time
- Choose a different time slot or resource

**"Parent can't book hybrid session"**
- Ensure booking window is open
- Check if session is within 24 hours (not allowed)
- Verify student is enrolled in the lesson

### Getting Help

- **Email:** support@musicnme.com.au
- **Phone:** Contact your Music 'n Me representative
- **In-app:** Click the help icon (?) for contextual assistance

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search |
| `Ctrl + N` | New item (context-dependent) |
| `Esc` | Close dialog |

### Important URLs

- **Login:** https://app.musicnme.com.au
- **Public Meet & Greet:** https://app.musicnme.com.au/book

---

*This guide is for Music 'n Me platform version 1.0*
