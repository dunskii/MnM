# Email & SMS Notifications System - Phase 1 Specification

## Overview

Email and SMS notifications are a **Must Have** Phase 1 feature. They keep parents informed of schedule changes, payment deadlines, and important events. This document specifies the technical implementation.

---

## Why This is Critical for MVP

1. **Schedule Changes**: When admin drag-and-drops a lesson to new time, parents MUST be notified
2. **Payment Reminders**: Reduces late payments, improves cash flow
3. **1-on-1 Booking**: Triggers booking action during hybrid cycles
4. **Engagement**: Keeps parents connected and engaged with the school
5. **Trust**: Professional communication builds confidence in platform

---

## Architecture Overview

### Components

**Email Service:**
- SendGrid or AWS SES for reliability and scale
- HTML templates with school branding
- Embedded payment links
- Unsubscribe handling

**SMS Service:**
- Twilio for SMS delivery
- Short, actionable messages
- Opt-in/opt-out management
- Delivery tracking

**Queue System:**
- Bull/Redis or AWS SQS for async processing
- Don't block lesson creation on email send
- Retry failed sends automatically
- Exponential backoff

**Preferences:**
- Parent controls notification types
- Channel preferences (email, SMS, both)
- Quiet hours (don't send 9pm-7am)
- Digest options (daily summary vs immediate)

---

## Notification Types & Triggers

### 1. Lesson Scheduling Notifications

#### Trigger: Admin Assigns Student to Group Class
```
Event: enrollment created with status='ACTIVE' for a group lesson

Who: Parents of enrolled students
Channel: Email (primary), SMS (optional)
Timing: Immediate
Template: lesson-assigned

Subject (Email): "[School Name] - Emma enrolled in Piano Basics"

Body:
"Hi Sarah,

Great news! Emma has been enrolled in:

📚 Piano Basics
📅 Every Thursday, 3:00 PM - 4:00 PM
📍 Main Studio, Room A
👨‍🏫 Teacher: Maria Garcia

First lesson: Thursday, October 5

Login to view: [Link]
Questions? Contact: info@school.com

---
[School Logo] [Unsubscribe]"

SMS: "Piano Basics enrollment confirmed! Emma: Thu 3pm at Main Studio. Details: [link]"
```

#### Trigger: Lesson Rescheduled (Drag-and-Drop)
```
Event: lesson.startTime or lesson.endTime updated

Who: All parents with enrolled students in that lesson
Channel: Email (primary), SMS (optional)
Timing: Immediate (within 1 second)
Template: lesson-rescheduled

Subject: "⏰ Emma's Piano Lesson Moved - New Time [NEW_TIME]"

Body:
"Hi Sarah,

Emma's lesson has been rescheduled:

OLD TIME: Thursday, October 19 at 3:00 PM - 4:00 PM
NEW TIME: Tuesday, October 24 at 4:00 PM - 5:00 PM

Location: Main Studio, Room A (same location)
Teacher: Maria Garcia (same teacher)

Why: [Optional reason from admin]

Updated schedule: [Link to view]

Questions? Contact: info@school.com

---
[School Logo] [Unsubscribe]"

SMS: "Piano Basics moved! Thu 3pm → Tue 4pm at Main Studio. Confirm: [link]"
```

#### Trigger: Lesson Cancelled
```
Event: lesson.status = 'CANCELLED'

Who: All enrolled students' parents
Channel: Email (required), SMS (optional)
Timing: Immediate
Template: lesson-cancelled

Subject: "🚫 Piano Basics Cancelled - [DATE]"

Body:
"Hi Sarah,

Unfortunately, the following lesson has been cancelled:

📚 Piano Basics
📅 Thursday, October 26, 3:00 PM - 4:00 PM

Reason: [From admin: "Teacher sick leave", "Holiday", etc.]

Makeup lesson: [If scheduled]

We apologize for any inconvenience.

Updated schedule: [Link]

Questions? Contact: info@school.com"
```

### 2. 1-on-1 Booking Notifications

#### Trigger: Hybrid Booking Period Opens
```
Event: Current week matches oneOnOneWeeks array in HybridLessonConfig

Who: All parents with children enrolled in that hybrid group
Channel: Email + SMS (action-oriented)
Timing: Triggered by scheduled job or real-time check
Template: hybrid-booking-open

Subject: "📅 Book 1-on-1 Session - Piano Basics This Week!"

Body:
"Hi Sarah,

This week is a 1-on-1 session week for Piano Basics!

Your child: Emma
Regular group class: Thursdays 3-4pm

This week (Oct 18-24): Please book a 30-min 1-on-1 session

Available times:
✓ Monday 2:00 PM
✓ Monday 3:00 PM
✓ Tuesday 4:00 PM
✓ Wednesday 3:30 PM
✓ Friday 2:00 PM

Book now: [DIRECT LINK TO BOOKING]

Booking closes: Sunday, Oct 24, 11:59 PM

Teacher: Maria Garcia

Questions? Reply to this email

---
[School Logo]"

SMS: "Book Emma's 1-on-1 with Maria now! Available: Mon 2pm, Mon 3pm, Tue 4pm + more. [link]"
```

#### Trigger: 1-on-1 Booking Confirmed
```
Event: enrollment created for 1-on-1 lesson during booking period

Who: Parent who booked
Channel: Email + SMS
Timing: Immediate
Template: onetoone-booked

Subject: "✓ 1-on-1 Session Booked - Piano with Maria"

Body:
"Hi Sarah,

Your 1-on-1 session is confirmed!

📚 Piano Basics - Individual Session
📅 Monday, October 21, 2:00 PM - 2:30 PM
📍 Main Studio, Room A
👨‍🏫 Teacher: Maria Garcia

Your booking code: BK-2024-10-21-001

Add to calendar: [iCal link]
View schedule: [Link]

Cancel until: Sunday, Oct 20, 11:59 PM
(No cancellation charge)

Questions? Contact: info@school.com

---
[School Logo]"

SMS: "Booked! Emma Mon Oct 21 2-2:30pm with Maria at Main Studio. Code: BK-001"
```

### 3. Payment Notifications

#### Trigger: Invoice Created
```
Event: payment created with status='PENDING' or invoice generated

Who: Parent who owes payment (from FamilyGroup or directly)
Channel: Email (primary)
Timing: Immediate
Template: invoice-created

Subject: "Invoice #INV-2024-10-15 Ready - Piano Lessons"

Body:
"Hi Smith Family,

Your invoice for October lessons is ready:

INVOICE #INV-2024-10-15
Due: October 31, 2024

---

LESSONS

Piano Basics (Emma)
4 lessons @ $20/lesson = $80

Violin Beginner (Liam)
4 lessons @ $20/lesson = $80

---

TOTAL DUE: $160

---

Pay now (secure): [PAYMENT LINK]
View invoice details: [Link]

Payment methods:
✓ Credit/Debit Card (Stripe)
✓ Bank Transfer
✓ Cash at studio

Questions? Email: billing@school.com

---
[School Logo]"

Note: SMS not used for invoices (too much detail)
```

#### Trigger: Payment Reminder (3 Days Before Due)
```
Event: Scheduled job runs daily, checks for invoices due in 3 days

Who: Parents with unpaid invoices
Channel: Email + SMS (if opted in)
Timing: 9am local time
Template: payment-reminder

Subject: "💳 Payment Reminder - Invoice Due Oct 31"

Body:
"Hi Smith Family,

Friendly reminder: Your invoice is due in 3 days

Invoice #INV-2024-10-15
Due: October 31, 2024
Amount: $160

Pay now: [LINK]

Questions? Contact: billing@school.com

---
[School Logo]"

SMS: "Reminder: Invoice INV-2024-10-15 due Oct 31. Pay online: [link]"
```

#### Trigger: Payment Received (Receipt)
```
Event: payment.status changed from PENDING to COMPLETED

Who: Parent who made payment
Channel: Email
Timing: Immediate (within 2 seconds of Stripe webhook)
Template: payment-received

Subject: "✓ Payment Received - Thank You!"

Body:
"Hi Smith Family,

We've received your payment!

Invoice #INV-2024-10-15
Amount Paid: $160.00
Payment Method: Visa ending in 4242
Transaction ID: ch_1234567890

Payment Date: October 28, 2024
Received: October 28, 2024

View receipt: [Link]
Download PDF: [Link]

Thank you for supporting music education at [School Name]!

---
[School Logo]"
```

#### Trigger: Payment Failed
```
Event: Stripe webhook confirms payment failed

Who: Parent whose payment failed
Channel: Email + SMS
Timing: Immediate
Template: payment-failed

Subject: "⚠️ Payment Failed - Action Required"

Body:
"Hi Sarah,

Your payment could not be processed:

Invoice #INV-2024-10-15
Amount: $160.00
Error: Card declined (insufficient funds)

Retry payment: [LINK]

Alternative payment methods:
✓ Bank Transfer (details: [link])
✓ Cash at studio
✓ Call to arrange: (555) 123-4567

Action needed by: October 31, 2024

Questions? Contact: billing@school.com

---
[School Logo]"

SMS: "Payment failed for INV-2024-10-15. Retry: [link] or call (555) 123-4567"
```

### 4. Attendance Notifications

#### Trigger: Weekly Attendance Report (Optional - Phase 1)
```
Event: Scheduled job runs every Monday morning

Who: Parents (if enabled)
Channel: Email
Timing: 8am local time
Template: attendance-report (OPTIONAL - can skip if time-pressed)

Subject: "📊 Weekly Attendance Report - Piano Basics"

Body:
"Hi Sarah,

Emma's attendance last week:

PIANO BASICS
✓ Thursday, Oct 19, 3-4pm: PRESENT
Notes: Practiced Hanon exercises well

Next lesson: Thursday, Oct 26, 3-4pm

View full attendance: [Link]

---
[School Logo]"

Note: This can be deferred to Phase 2 if timeline is tight
```

### 5. Award & Achievement Notifications

#### Trigger: Teacher Awards Progression Badge
```
Event: progressionAward created

Who: Student and parents
Channel: Email (to parents)
Timing: Immediate
Template: award-earned

Subject: "🏆 Emma Earned a Badge! - Completed Section 1"

Body:
"Hi Sarah,

Congratulations! Emma just earned an achievement:

⭐ Completed Section 1
Awarded by: Maria Garcia
Date: October 24, 2024

Emma is making great progress!

View Emma's achievements: [Link]

---
[School Logo]"

SMS: "🏆 Congrats! Emma earned 'Completed Section 1' badge in Piano!"
```

---

## Notification Preferences Management

### Parent Settings Page

```
═══════════════════════════════════════════════════════════════
  NOTIFICATION PREFERENCES
═══════════════════════════════════════════════════════════════

Email Notifications
─────────────────────────────────────────────
☑ Lesson scheduling & changes      (default: ON)
☑ 1-on-1 booking period opened     (default: ON)
☑ Payment invoices & reminders     (default: ON)
☑ Payment receipts                 (default: ON)
☑ Attendance reports               (default: OFF)
☑ Awards & achievements            (default: ON)
☑ General school announcements     (default: OFF)

SMS Notifications
─────────────────────────────────────────────
Phone number: (555) 123-4567 [Change]

☑ Urgent schedule changes          (default: ON)
☑ 1-on-1 booking period opened     (default: ON)
☑ Payment reminders                (default: ON)
☐ Attendance reports               (default: OFF)

Quiet Hours
─────────────────────────────────────────────
Don't send notifications between: [09:00 PM ▼] and [07:00 AM ▼]

Unsubscribe from all: [Link]

[Save Preferences]
```

### Database Schema for Preferences

```prisma
model NotificationPreference {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Email preferences
  emailLessonChanges          Boolean @default(true)
  emailBookingPeriods         Boolean @default(true)
  emailPaymentInvoices        Boolean @default(true)
  emailPaymentReminders       Boolean @default(true)
  emailPaymentReceipts        Boolean @default(true)
  emailAttendance             Boolean @default(false)
  emailAwards                 Boolean @default(true)
  emailAnnouncements          Boolean @default(false)

  // SMS preferences
  smsEnabled                  Boolean @default(false)
  smsPhoneNumber              String?
  smsUrgentChanges            Boolean @default(true)
  smsBookingPeriods           Boolean @default(true)
  smsPaymentReminders         Boolean @default(true)
  smsAwards                   Boolean @default(false)

  // Quiet hours
  quietHoursStart             String? // "21:00"
  quietHoursEnd               String? // "07:00"
  quietHoursEnabled           Boolean @default(true)

  // Digest options (Phase 2)
  digestEnabled               Boolean @default(false)
  digestFrequency             String? // "daily", "weekly"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

---

## Technical Implementation

### Backend Services

#### Notification Service

```typescript
// services/notification.service.ts

interface NotificationPayload {
  type: NotificationType;
  recipientId: string;  // User ID
  data: Record<string, any>;
  priority?: 'urgent' | 'normal' | 'low';
  channels?: ('email' | 'sms')[];  // Override user preferences
}

export class NotificationService {
  
  // Main entry point
  async send(payload: NotificationPayload): Promise<void> {
    // Validate recipient exists and is parent/student
    const user = await prisma.user.findUnique({
      where: { id: payload.recipientId },
      include: { notificationPreference: true }
    });

    if (!user) throw new Error('User not found');

    // Get user preferences
    const prefs = user.notificationPreference;
    const channels = payload.channels || getChannelsForType(payload.type, prefs);

    // Check quiet hours
    if (this.isInQuietHours(prefs)) {
      if (payload.priority !== 'urgent') {
        // Queue for delivery after quiet hours
        await this.queueForLaterDelivery(payload, prefs);
        return;
      }
    }

    // Send via appropriate channels
    if (channels.includes('email')) {
      await this.sendEmail(user.email, payload.type, payload.data);
    }

    if (channels.includes('sms') && prefs.smsEnabled) {
      await this.sendSMS(prefs.smsPhoneNumber, payload.type, payload.data);
    }
  }

  // Email sending
  private async sendEmail(
    to: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<void> {
    const template = this.getTemplate(type, 'email');
    const html = this.renderTemplate(template, data);

    // Add to queue for async sending
    await notificationQueue.add({
      type: 'email',
      to,
      subject: template.subject,
      html,
      timestamp: new Date()
    });
  }

  // SMS sending
  private async sendSMS(
    phoneNumber: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<void> {
    const template = this.getTemplate(type, 'sms');
    const message = this.renderTemplate(template, data);

    await smsQueue.add({
      type: 'sms',
      to: phoneNumber,
      message,
      timestamp: new Date()
    });
  }

  // Queue retry logic
  private async queueForLaterDelivery(
    payload: NotificationPayload,
    prefs: NotificationPreference
  ): Promise<void> {
    const deliverAfter = this.getQuietHoursEnd(prefs);
    await delayedNotificationQueue.add(payload, {
      delay: deliverAfter.getTime() - Date.now()
    });
  }
}
```

### Queue Processors

```typescript
// queues/emailQueue.processor.ts

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;

  try {
    // Send via SendGrid
    await sgMail.send({
      to,
      from: 'noreply@school.mymusics.app',
      subject,
      html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    });

    // Log successful send
    await prisma.notificationLog.create({
      data: {
        type: 'email',
        recipient: to,
        status: 'sent',
        sentAt: new Date()
      }
    });

  } catch (error) {
    // Retry with exponential backoff
    throw error;  // Bull will retry
  }
});

emailQueue.on('failed', async (job, err) => {
  // After 5 retries, give up and log
  console.error(`Email to ${job.data.to} failed:`, err);
  
  await prisma.notificationLog.create({
    data: {
      type: 'email',
      recipient: job.data.to,
      status: 'failed',
      error: err.message,
      failedAt: new Date()
    }
  });
});
```

### API Endpoints

```
POST /api/notifications/send
  (Admin only - for manual notifications)
  Body: { userId, type, data }

GET /api/notifications/preferences
  (Current user)
  Response: { preferences: NotificationPreference }

PATCH /api/notifications/preferences
  (Current user)
  Body: { emailLessonChanges: false, smsEnabled: true, ... }

GET /api/notifications/history
  (Current user - view sent notifications)
  Query: ?limit=50&offset=0&type=payment
  Response: { notifications: NotificationLog[] }
```

### Triggers (When to Send)

Each trigger needs to be implemented as either:
1. **Synchronous** - send immediately when event happens (e.g., lesson rescheduled)
2. **Async** - queue for processing (e.g., invoice created)
3. **Scheduled** - run on schedule (e.g., payment reminders 3 days before due)

```typescript
// examples/triggers.ts

// Trigger: Lesson rescheduled (synchronous)
async function handleLessonRescheduled(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { enrollments: { include: { student: true } } }
  });

  for (const enrollment of lesson.enrollments) {
    const student = enrollment.student;
    const parent = await prisma.user.findFirst({
      where: { familyGroupId: student.familyGroupId || student.userId }
    });

    if (parent) {
      await notificationService.send({
        type: 'LESSON_RESCHEDULED',
        recipientId: parent.id,
        data: {
          lessonTitle: lesson.title,
          oldTime: lesson.previousStartTime,  // Store from audit
          newTime: lesson.startTime,
          studentName: student.user.firstName
        },
        priority: 'urgent'
      });
    }
  }
}

// Trigger: Payment reminder (scheduled job)
async function sendPaymentReminders() {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
  const dueSoon = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      invoiceDueDate: {
        gte: new Date(Date.now()),
        lte: threeDaysFromNow
      }
    },
    include: { school: true, lesson: true }
  });

  for (const payment of dueSoon) {
    // Get parent from enrollment or family group
    const parent = await getParentForPayment(payment);
    
    await notificationService.send({
      type: 'PAYMENT_REMINDER',
      recipientId: parent.id,
      data: {
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        dueDate: payment.invoiceDueDate,
        paymentLink: generatePaymentLink(payment)
      },
      priority: 'normal'
    });
  }
}

// Trigger: Hybrid booking period (scheduled or event-based)
async function checkAndTriggerHybridBooking() {
  const hybridConfigs = await prisma.hybridLessonConfig.findMany({
    include: { lesson: { include: { enrollments: true } } }
  });

  for (const config of hybridConfigs) {
    const lesson = config.lesson;
    const currentCycleWeek = calculateCurrentCycleWeek(lesson.startTime, config);

    if (config.oneOnOneWeeks.includes(currentCycleWeek)) {
      // This is a 1-on-1 booking week!
      
      for (const enrollment of lesson.enrollments) {
        const student = enrollment.student;
        const parent = await getParentForStudent(student);

        if (parent) {
          await notificationService.send({
            type: 'HYBRID_BOOKING_OPEN',
            recipientId: parent.id,
            data: {
              lessonTitle: lesson.title,
              studentName: student.user.firstName,
              availableSlots: await getAvailableOneOnOneSlots(lesson),
              bookingLink: generateBookingLink(lesson, student)
            },
            channels: ['email', 'sms'],  // Force both channels
            priority: 'urgent'
          });
        }
      }
    }
  }
}
```

---

## Email Templates

### Example: Lesson Rescheduled

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2e7d32; color: white; padding: 20px; text-align: center; }
    .content { background: #f5f5f5; padding: 20px; }
    .change-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { background: #2e7d32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { background: #e0e0e0; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Lesson Rescheduled</h1>
    </div>

    <div class="content">
      <p>Hi {{parentName}},</p>

      <p>{{studentName}}'s lesson has been rescheduled!</p>

      <div class="change-box">
        <p><strong>{{lessonTitle}}</strong></p>
        
        <p>
          <strike>{{oldDate}} at {{oldTime}}</strike><br>
          <strong>→ {{newDate}} at {{newTime}}</strong>
        </p>

        <p>
          📍 {{location}}, {{room}}<br>
          👨‍🏫 {{teacherName}}
        </p>
      </div>

      <p>
        <a href="{{scheduleLink}}" class="button">View Updated Schedule</a>
      </p>

      <p>If you have any questions, reply to this email or contact us at {{schoolEmail}}.</p>

      <p>Thank you,<br><strong>{{schoolName}}</strong></p>
    </div>

    <div class="footer">
      <p>© {{schoolName}} | {{year}}</p>
      <p><a href="{{unsubscribeLink}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
```

---

## Implementation Timeline (Weeks 9-10)

### Week 9

**Day 1-2:**
- ✅ Set up SendGrid account and Twilio account
- ✅ Create NotificationService class
- ✅ Create NotificationPreference table/model

**Day 3-4:**
- ✅ Implement email queue processors
- ✅ Implement SMS queue processors
- ✅ Create notification templates

**Day 5:**
- ✅ Implement 3 key triggers (lesson rescheduled, payment created, hybrid booking)
- ✅ Testing

### Week 10

**Day 1-2:**
- ✅ Implement remaining triggers (payment reminder, payment received, etc.)
- ✅ Create preferences UI/API

**Day 3-4:**
- ✅ Implement quiet hours logic
- ✅ Implement retry/failure handling

**Day 5:**
- ✅ Full system testing
- ✅ SendGrid/Twilio testing with real numbers
- ✅ Template refinement

---

## Phase 1 Scope

✅ Basic email notifications via SendGrid  
✅ Basic SMS via Twilio  
✅ Key triggers (reschedule, payments, hybrid booking)  
✅ Notification preferences (opt-in/out)  
✅ Quiet hours  
✅ Retry logic & delivery logging  

❌ Advanced features (Phase 2):
- Notification scheduling
- Bulk/batch messaging
- Two-way SMS responses
- Notification analytics
- Custom templates per school

---

## Testing Scenarios

### Scenario 1: Parent Gets Notified of Rescheduled Lesson
1. Admin drags Piano Basics from Thu 3pm to Tue 4pm
2. System identifies all enrolled students
3. Gets parents from family groups
4. Creates notification payload
5. Email queued → Sent via SendGrid
6. SMS queued → Sent via Twilio
7. Parent receives both within 2 seconds
8. Parent can click link to see updated schedule

### Scenario 2: Payment Reminder Respected Quiet Hours
1. Parent set quiet hours: 9pm-7am
2. Payment due date 2 days away, reminder triggers at 8pm
3. System detects quiet hours
4. Queues reminder for 7:01am next morning
5. Reminder sent at 7:01am
6. Parent sees reminder with payment link

### Scenario 3: 1-on-1 Booking Period Notification
1. Current date = Oct 18 (week 4 of 8-week cycle)
2. HybridLessonConfig.oneOnOneWeeks = [4, 8]
3. Scheduled job detects: "This is week 4!"
4. Finds all hybrid lessons in booking week
5. Notifies all parents: "Book your 1-on-1 now"
6. Parents click link, see available times
7. Parent books Mon 2pm
8. Confirmation email sent immediately

---

## Safeguards & Best Practices

```typescript
// Don't send duplicate notifications
const recentNotification = await prisma.notificationLog.findFirst({
  where: {
    recipientId: userId,
    type: 'LESSON_RESCHEDULED',
    lessonId: lessonId,
    createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }  // Last 5 min
  }
});

if (recentNotification) {
  return;  // Skip if duplicate
}

// Rate limit: No more than 10 notifications per user per hour
const recentCount = await prisma.notificationLog.count({
  where: {
    recipientId: userId,
    createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
  }
});

if (recentCount >= 10) {
  await notificationQueue.add({...}, { delay: 60 * 1000 });  // Delay by 1 min
  return;
}

// Handle unsubscribe universally
if (user.notificationPreference.unsubscribedFromAll) {
  return;  // Don't send any notifications
}
```

This notification system is the backbone of MVP user engagement and will be refined in Phase 2 based on usage patterns.
