# Music 'n Me - System Overview
**A Complete Management Platform for Your Music School**

---

## Executive Summary

Music 'n Me is building a custom-designed management platform specifically tailored to how your music school operates. Unlike off-the-shelf solutions like Opus1, this system is built around your unique teaching model—particularly your **hybrid lesson approach** that mixes group and individual instruction.

**The system will handle:**
- Scheduling and calendar management
- Student enrollment and attendance tracking
- Flexible billing and invoicing
- Parent communication via WhatsApp, SMS, and email
- Teacher resource sharing
- Payment processing
- Accounting integration

**Timeline**: 14-16 weeks to launch

---

## What This System Does

Think of this as your complete school management hub. Everything that currently requires multiple tools, spreadsheets, or manual processes will be in one place.

### The Four Main Areas

#### 1. **School Administration**
Manage your entire school setup, locations, rooms, teachers, students, and all the lessons you offer.

#### 2. **Scheduling & Calendar**
Visual calendar showing all lessons, with the ability to drag-and-drop to reschedule. Automatically prevents double-booking teachers or rooms.

#### 3. **Billing & Payments**
Generate term invoices automatically, accept online payments, and track who's paid. Syncs with your Xero accounting software.

#### 4. **Communication**
Send WhatsApp messages, SMS, and emails to parents about lesson changes, payment confirmations, and important updates.

---

## Who Uses the System

### School Administrators
**You have complete control.**

**What you can do:**
- Set up your school's term dates (4 terms of 10 weeks, fully customizable)
- Create and manage your 2 locations and their rooms
- Add teachers and assign them to lessons
- Enroll students (manually enter your ~200 current students)
- Create all types of lessons: group classes, one-on-one lessons, band rehearsals, and hybrid lessons
- Generate invoices for each term
- Add custom charges (books, exam fees, supplies, excursions)
- Reschedule any lesson by dragging it on the calendar
- View reports: attendance rates, payment status, upcoming lessons
- Connect integrations (Xero, Google Calendar)

### Teachers
**Your teachers focus on teaching.**

**What they can do:**
- View their complete schedule (all assigned lessons)
- Mark attendance after each lesson
- Upload teaching materials (music scores, backing tracks, recordings)
- Share resources with specific students
- See which students have booked their individual sessions (for hybrid lessons)
- Connect their personal Google Calendar to see lessons automatically

**What they cannot do:**
- Change lesson times (they must request admin to reschedule)
- Access student payment information
- See other teachers' schedules

### Parents
**Parents manage their family's bookings and payments.**

**What they can do:**
- Create a family account (one parent manages multiple children)
- View a combined schedule showing all their children's lessons
- **Book individual lesson sessions** when you open booking periods (for hybrid lessons)
- **Reschedule their child's individual sessions** (if you allow it, with 24-hour notice)
- Make payments online via credit card (Stripe)
- View invoices and payment history
- Download teaching resources shared by teachers
- Set notification preferences (WhatsApp, SMS, or email)

**What they cannot do:**
- Change group lesson times
- Cancel enrollments (must contact admin)
- Access other families' information

### Students
**Students can view their own information.**

**What they can do:**
- View their upcoming lessons
- Download music scores and backing tracks their teacher shared
- See their attendance history

**What they cannot do:**
- Modify anything (read-only access)

---

## Your Core Feature: Hybrid Lessons Explained

### What's a Hybrid Lesson?

This is what makes your school unique. A hybrid lesson is a **single course that alternates between group classes and individual sessions** based on a pattern you design for each term.

### Why This Matters

Most music school software (like Opus1) can only handle:
- Pure group lessons (everyone meets at the same time every week)
- Pure individual lessons (one-on-one, same time every week)

**But your school runs differently.** You might have a piano course where students meet as a group for 3 weeks, then have individual sessions in week 4, back to group for weeks 5-7, individual again in week 8, and so on.

### Real-World Example

**"Piano Foundation 1" - 10 Week Term**

Your pattern might look like:
- **Weeks 1-3**: Group class (Mondays, 4:00 PM, 1 hour, all students together)
- **Week 4**: Individual sessions (45 minutes each, parents book their preferred time)
- **Weeks 5-7**: Group class (back to Monday 4:00 PM)
- **Week 8**: Individual sessions (parents book again)
- **Week 9**: Group class
- **Week 10**: Individual sessions (parents book again)

### How It Works

#### Step 1: You Set the Pattern
When creating the lesson, you tell the system:
- Which weeks are group weeks
- Which weeks are individual weeks
- When and where group classes happen
- How long individual sessions should be
- Pricing for each type (e.g., $35 per group, $50 per individual)

#### Step 2: You Control When Parents Can Book
At the start of the term (or whenever you're ready), you click **"Open Bookings"** for that hybrid lesson. The system sends a WhatsApp message to all enrolled parents: *"Booking is now open for Piano Foundation 1 individual sessions."*

#### Step 3: Parents Book Their Individual Sessions
Parents log in and see all the individual weeks for the term (weeks 4, 8, and 10 in our example). They select their preferred timeslots based on your teacher's availability. They can book all three sessions at once or one at a time.

#### Step 4: Everyone Sees the Schedule
- The **calendar** shows group classes at their regular time (Monday 4 PM)
- On individual weeks, the calendar shows a **reminder** at the regular group time saying "1-on-1 Week" (you can customize this label)
- Each booked individual session appears separately on the calendar
- Teachers see exactly when each student is coming

#### Step 5: Parents Can Reschedule (If You Allow It)
You decide whether parents can reschedule their individual sessions. If allowed, they must give at least 24 hours notice. They can only reschedule the individual sessions from hybrid lessons—not regular group classes or pure individual lessons.

### What This Solves

**Before**: You'd have to manually coordinate dozens of individual booking requests via phone, email, or Slack. Parents would email asking what times are available. You'd check the teacher's schedule, reply back, wait for confirmation, and update your calendar manually.

**After**: Parents book online from available slots. Double-bookings are impossible. Everyone's calendar updates automatically. Teachers see who's booked and who hasn't.

---

## Day-to-Day Workflows

### Monday Morning: Admin Checks the Week

You open the dashboard and see:
- **This week's lessons**: 45 lessons scheduled
- **Attendance rate**: 94% (3 students absent last week)
- **Pending payments**: 12 families have outstanding invoices
- **Unboked sessions**: 2 parents haven't booked their individual sessions for next week

You click on the 2 unbooked sessions and send a reminder via WhatsApp.

### Tuesday 3:45 PM: Teacher Prepares for Class

Ms. Johnson logs in 15 minutes before her 4 PM group class. She sees:
- **Today's lesson**: Piano Foundation 1, 4:00-5:00 PM, Room 1
- **Enrolled students**: Emma, Liam, Sophia, Oliver, Ava (5 students)
- **Last week's attendance**: All present
- **Resources uploaded**: "Für Elise" sheet music, backing track

She reviews the materials and heads to the room.

### Tuesday 5:05 PM: Teacher Marks Attendance

After class, Ms. Johnson marks attendance:
- Emma: Present
- Liam: Present
- Sophia: Absent (parent texted she's sick)
- Oliver: Present
- Ava: Present

She adds a note: "Sophia absent due to illness. Will send catch-up materials."

The system automatically records this. Sophia's parent receives a WhatsApp message: *"Sophia was marked absent today. Reason: Illness. Your teacher will provide catch-up materials."*

### Wednesday Morning: Parent Books Individual Session

Sarah (Emma's mother) receives a WhatsApp notification: *"Booking is now open for Piano Foundation 1 individual sessions (Weeks 4, 8, 10)."*

She logs into her parent dashboard and sees:

**Week 4 (Feb 24-28) - Available times:**
- Monday 3:00 PM
- Monday 5:00 PM ← *She selects this*
- Tuesday 4:00 PM
- Wednesday 3:30 PM

**Week 8 (Mar 24-28) - Available times:**
- Monday 5:00 PM ← *She selects this*
- Thursday 4:00 PM
- Friday 3:00 PM

**Week 10 (Apr 7-11) - Available times:**
- Monday 5:00 PM ← *She selects this*
- Tuesday 4:00 PM
- Friday 4:00 PM

She clicks **"Confirm All Bookings"**. Done. All three sessions are booked for the same convenient time (Monday 5 PM). She receives confirmation via WhatsApp.

### End of Term: Invoicing

You click **"Generate Term 1 Invoices"**. The system automatically creates invoices for all families based on their enrolled lessons.

**Emma Smith's invoice** shows:
- Piano Foundation 1 - Group Lessons × 7 @ $35 = $245
- Piano Foundation 1 - Individual Lessons × 3 @ $50 = $150
- Guitar Group - Group Lessons × 10 @ $30 = $300

**Subtotal**: $695

You review the invoice and add custom items:
- Piano Method Book Level 1: $28
- AMEB Grade 1 Exam Fee: $85

**New Total** (with GST): $889.80

You set the due date (February 28) and click **"Send Invoices"**. All families receive their invoices via email and a WhatsApp notification: *"Your Term 1 invoice is ready. Click here to view and pay online."*

### Parent Pays Online

Sarah opens the invoice link and clicks **"Pay with Card"**. She enters her credit card details (processed securely via Stripe). Payment confirmed.

The system:
- Marks the invoice as PAID
- Sends Sarah a receipt via email
- Records the payment in Xero (your accounting software)
- Sends you a notification that Emma Smith's family has paid

---

## Billing & Invoicing Features

### Automatic Invoice Generation

At the end of each term, you click one button. The system calculates exactly what each family owes based on their enrolled lessons.

**For hybrid lessons**, it automatically splits the charges:
- Counts how many group weeks and individual weeks in the term
- Applies the correct price for each type
- Creates separate line items so parents can see the breakdown

### Custom Line Items

Before sending invoices, you can add:
- Books and materials
- Exam fees (AMEB, Trinity, etc.)
- Excursion costs
- Registration fees
- Instrument rental
- Anything else specific to each student

### Multiple Payment Methods

**Online (Stripe)**:
- Parents pay with credit/debit card
- Payment recorded automatically
- Receipt sent immediately
- Syncs to Xero

**Manual (Bank Transfer, Cash, Check)**:
- You mark the payment as received
- Select payment method
- System updates invoice status
- Still syncs to Xero

### Payment Tracking

Dashboard shows:
- Total outstanding: $12,450
- Paid this week: $3,200
- Overdue invoices: 5 families
- Average payment time: 8 days

You can see which families have paid and send reminders to those who haven't.

---

## Communication & Notifications

### Three Channels, Smart Fallback

**Primary: WhatsApp** (cheapest, most convenient)
- Most parents prefer WhatsApp
- Instant delivery
- Parents can reply directly
- Costs about $0.005 per message

**Backup: SMS** (if WhatsApp fails or parent doesn't use it)
- Reliable delivery
- Works on any phone
- Costs about $0.08 per message

**Fallback: Email** (always works)
- Detailed information
- Includes attachments
- Professional records

The system automatically tries WhatsApp first, then SMS if WhatsApp fails, then email as last resort.

### What Gets Sent

**Lesson Reminders** (24 hours before):
*"Reminder: Emma has Piano Foundation 1 tomorrow at 4:00 PM at Studio A."*

**Lesson Changes**:
*"Piano Foundation 1 has been rescheduled from Monday 4 PM to Tuesday 4 PM this week."*

**Hybrid Booking Alerts** (critical):
*"Booking is now open for Piano Foundation 1 individual sessions. Please log in to book your preferred times."*

**Payment Notifications**:
*"Your payment of $889.80 has been received. Thank you!"*

**Invoice Reminders**:
*"Your Term 1 invoice of $889.80 is due on Feb 28. Click here to pay online."*

**Attendance Updates**:
*"Emma was marked absent today. Reason: Illness."*

### Parent Preferences

Each parent controls what they receive:
- WhatsApp: Yes/No (and which phone number)
- SMS: Yes/No (fallback)
- Email: Yes/No (always available)

They can also choose which types of notifications they want:
- Lesson reminders: Yes
- Lesson changes: Yes
- Payment confirmations: Yes
- Hybrid booking alerts: Yes (recommended!)

### Group Messages

You can send a message to all parents in a specific lesson. For example:

*"Piano Foundation 1 parents: Our studio will be closed next Monday for maintenance. Your lesson is rescheduled to Tuesday same time."*

All 5 parents receive the message via their preferred channel.

---

## Teacher Resources & File Sharing

### Teachers Upload Materials

Ms. Johnson has prepared materials for next week's lesson:
- "Für Elise" sheet music (PDF)
- Simplified backing track (MP3)
- Example recording (MP3)

She logs in, goes to "Piano Foundation 1", and uploads all three files. She can add notes: *"Practice the first 8 bars using the backing track. Listen to the example recording for phrasing."*

### Students Download Materials

Emma logs in (or her parent does) and sees:
**New Resources from Ms. Johnson**
- Für Elise - Sheet Music.pdf
- Für Elise - Backing Track.mp3
- Für Elise - Example.mp3

She downloads them and starts practicing.

### Security & Access

- Only enrolled students can access materials for their lessons
- Teachers can only upload to their own lessons
- Files are stored securely in cloud storage (DigitalOcean Spaces)
- You set maximum file size (suggested: 10MB per file)

---

## Calendar & Scheduling Features

### Visual Calendar

The main view shows all lessons across your two locations in a weekly or monthly grid. Color-coded by lesson type:
- Blue: Group lessons
- Green: Individual lessons
- Purple: Hybrid lessons
- Orange: Band rehearsals

### Drag-and-Drop Rescheduling

Need to reschedule a lesson? Click and drag it to a new time. The system:
- Checks if the teacher is available
- Checks if the room is available
- Prevents conflicts automatically
- Shows a red warning if there's a problem
- Asks you to confirm the change
- Sends notifications to all affected parents and the teacher

### Conflict Detection

The system won't let you:
- Double-book a teacher
- Double-book a room
- Schedule a lesson outside school hours
- Create overlapping individual session bookings

If you try, it shows a clear error: *"Teacher Ms. Johnson is already teaching at this time."*

### Filter Views

Too many lessons to see at once? Filter by:
- Location (Studio A or Studio B)
- Teacher (show only Ms. Johnson's lessons)
- Lesson type (show only hybrid lessons)
- Week (focus on this week only)

### Multiple Calendar Views

- **Week View**: See Monday-Sunday hour-by-hour
- **Month View**: See the whole month
- **Teacher View**: See one teacher's complete schedule
- **Room View**: See which room is used when

---

## Integrations

### Google Calendar (Teacher Sync)

**What it does**: When you create, change, or cancel a lesson, it automatically updates in the teacher's personal Google Calendar.

**How it works**:
1. Teacher clicks "Connect Google Calendar"
2. Signs in with their Google account
3. Chooses which calendar to sync to
4. Done - all their lessons appear in Google Calendar automatically

**Benefits**:
- Teachers see lessons in their phone's calendar app
- Syncs to Apple Calendar, Outlook, or any app that reads Google Calendar
- Updates automatically when you reschedule
- One-way sync (changes in Google don't affect your system, preventing conflicts)

**Also available**: Parents can subscribe to an iCal feed to see their children's lessons in any calendar app (read-only).

### Xero Accounting (Admin Sync)

**What it does**: Automatically syncs invoices and payments to your Xero account.

**How it works**:
1. You connect your Xero account once (secure OAuth connection)
2. When you send an invoice, it's created in Xero automatically
3. When a parent pays, the payment is recorded in Xero
4. Your accountant has up-to-date records without manual entry

**What syncs**:
- Families (as Xero contacts)
- Invoices (with all line items)
- Payments (with correct dates and methods)
- GST/tax codes (10% GST automatically applied)

**Benefits**:
- No double-entry bookkeeping
- Always accurate financial records
- Easy end-of-year reporting
- Your accountant loves you

**Future-proof**: Built with an abstraction layer, so if you ever want to switch to QuickBooks or MYOB, we can add that without rebuilding everything.

### Stripe Payment Processing

**What it does**: Handles all online credit/debit card payments securely.

**How it works**:
- Parents click "Pay Online" on an invoice
- Redirected to Stripe's secure payment page
- Enter card details (never stored on our servers)
- Payment processed instantly
- Confirmation sent to parent and admin

**Fees**: Stripe charges 2.9% + 30¢ per transaction (industry standard).

**Security**: Stripe is PCI Level 1 compliant (the highest level). Your system never touches credit card numbers.

### Twilio (WhatsApp & SMS)

**What it does**: Sends all WhatsApp messages and SMS notifications.

**Why one vendor**: Using Twilio for both channels means:
- Simpler setup
- Automatic fallback (WhatsApp fails → SMS sent instead)
- Single billing
- Reliable delivery

**Costs**:
- WhatsApp: ~$0.005 per message (half a cent)
- SMS: ~$0.08 per message (8 cents)
- For 200 students (assuming 2 messages per week per family): ~$80/month

---

## Benefits & Value

### What This Replaces

**Simply Portal**: Your current system that requires manual coordination, has rigid processes, and doesn't support your hybrid lesson model.

**Spreadsheets**: No more tracking attendance, payments, and schedules in Excel.

**Email/Phone/Slack**: No more manual booking coordination for individual sessions.

**Manual Invoicing**: No more calculating charges and creating invoices by hand.

### Time Savings

**Before**:
- Coordinating 200 students' individual session bookings: 10-15 hours per term
- Creating term invoices manually: 8-10 hours per term
- Sending lesson reminders and updates: 2-3 hours per week
- Tracking payments and following up: 3-4 hours per week

**After**:
- Parents book their own sessions: 0 hours (automated)
- Invoices generated automatically: 15 minutes to review and send
- Notifications sent automatically: 0 hours (automated)
- Payment tracking automated: 5 minutes per week to review

**Total time saved**: ~20 hours per month

### Error Prevention

**Eliminated**:
- Double-booked teachers or rooms (system prevents it)
- Lost booking requests (everything tracked in database)
- Incorrect invoice calculations (automated with correct rates)
- Missed payments (automatic reminders and tracking)

### Professional Parent Experience

**Parents get**:
- Convenient online booking (book at midnight if they want)
- WhatsApp notifications (their preferred communication method)
- Online payment (no checks to write)
- Clear invoices (see exactly what they're paying for)
- Easy rescheduling (for individual sessions with 24h notice)
- Mobile-friendly dashboard (manage everything from phone)

**Result**: Happier parents, fewer complaints, better retention.

### Competitive Advantage

**Opus1 can't do this**: Your hybrid lesson model is impossible in their system. You can now say:

*"We offer flexible learning with our unique hybrid approach - group classes for ensemble skills and individual attention when you need it. Our custom platform makes booking and managing your lessons effortless."*

### Scalability

**Built for growth**:
- Support multiple locations (you have 2 now, can add more)
- Add unlimited teachers and students
- Handle multiple schools if you expand
- Add new instruments easily (admin-configurable)
- Support different countries with custom term dates

### Compliance & Security

**Built-in**:
- Secure password hashing (industry standard bcrypt)
- Multi-tenant data isolation (schools never see each other's data)
- Encrypted payment processing (Stripe Level 1 PCI compliant)
- Secure file storage (DigitalOcean Spaces with access controls)
- Automated backups (daily database backups)
- HTTPS encryption (all data encrypted in transit)

---

## What Happens Next

### Development Timeline: 14-16 Weeks

**Weeks 1-2**: Foundation
- Database setup
- User accounts and login
- School configuration

**Weeks 3-4**: Lessons & Enrollment
- Create all lesson types
- Enroll students
- Family accounts

**Weeks 5-6**: Calendar & Scheduling
- Visual calendar
- Drag-and-drop rescheduling
- Conflict detection

**Weeks 7-8**: Attendance & Payments
- Attendance tracking
- Stripe integration
- Payment processing

**Weeks 9-10**: Hybrid Lessons ⭐
- Hybrid configuration
- Parent booking system
- Calendar placeholders
- Rescheduling logic

**Week 11**: File Sharing
- Teacher uploads
- Student downloads
- Resource management

**Week 12**: Xero Integration
- Invoice sync
- Payment reconciliation

**Week 13**: Calendar Integration
- Google Calendar sync
- iCal feeds

**Week 14**: Twilio Integration
- WhatsApp notifications
- SMS fallback

**Week 15**: Dashboards & Polish
- Admin dashboard
- Teacher dashboard
- Parent dashboard
- Mobile responsiveness

**Week 16**: Testing & Deployment
- End-to-end testing
- Security audit
- Production deployment
- Training

### Weekly Check-Ins

Every Friday (30 minutes):
- Demo what was built that week
- Gather your feedback
- Adjust priorities if needed
- Answer questions

### Milestones

**Week 8**: Payments working
- You can accept Stripe payments
- Manual payment recording
- Basic invoicing

**Week 10**: Hybrid lessons complete ⭐
- The core feature is functional
- Parents can book individual sessions
- You can test the full workflow

**Week 16**: Ready to launch
- All features complete
- Tested and secure
- You can start entering student data

### Post-Launch

**Week 17-20**: Data entry & training
- You manually enter your ~200 students
- Create all lessons for current term
- Train teachers and key staff
- Parents receive invitation emails

**Week 21+**: Live!
- Parents start booking
- Teachers mark attendance
- You send first term invoices
- System is fully operational

---

## Monthly Operating Costs (Estimate)

### Third-Party Services

**DigitalOcean** (Hosting):
- Database (1GB): $15/month
- Backend server: $12/month
- File storage: $5/month
- **Subtotal**: ~$32/month

**Stripe** (Payments):
- 2.9% + $0.30 per transaction
- If you process $10,000/month: ~$320/month in fees
- (Parents pay this effectively, as it's built into total)

**Twilio** (WhatsApp & SMS):
- WhatsApp: $0.005 per message
- SMS: $0.08 per message
- ~200 students, 2 messages/week: ~$80/month
- **Can be reduced by using WhatsApp more, SMS less**

**SendGrid** (Email):
- Free tier: 100 emails/day (sufficient for MVP)
- Paid tier if needed: $19.95/month (50,000 emails)
- **Start free**: $0/month initially

**Xero** (You already pay for this):
- No additional cost for API integration

**Total Monthly Cost**: ~$110-150/month
- Could be lower if mostly using WhatsApp
- Scales with student numbers

### One-Time Costs

- Domain name: ~$15/year
- SSL Certificate: Free (Let's Encrypt)
- Development: Your investment in building the system

---

## Frequently Asked Questions

### Can parents reschedule group lessons?

No, only admins can reschedule group lessons. Parents can only reschedule individual sessions from hybrid lessons (if you enable this feature, with 24-hour minimum notice).

### What if a parent doesn't have WhatsApp?

The system automatically falls back to SMS, then email. Parents can also disable WhatsApp and choose SMS or email as their primary channel.

### Can we customize the term dates?

Yes, completely. You set the start and end date for each term. You can have 4 terms of 10 weeks, or 3 terms of 12 weeks, or any structure. This makes the system work in any country.

### What if we add a third location?

No problem. You (admin) can add new locations and rooms at any time. Just go to Settings → Locations → Add Location.

### Can we add more instruments?

Yes, completely customizable. You can add Violin, Cello, Flute, or any instrument. It's just a configuration setting.

### What happens if a teacher leaves?

You can reassign all their lessons to a new teacher in bulk. Students stay enrolled, only the instructor changes. Parents receive a notification about the change.

### Can we charge different prices for different students?

Not automatically, but you can adjust invoices before sending them. Add discounts as custom line items with negative amounts, or adjust line item prices manually.

### What if we want to run special holiday workshops?

Create a lesson with type "ONE-OFF" instead of "WEEKLY". Set the specific date and time. Enroll students. Done.

### Is there a mobile app?

The system is mobile-responsive, meaning it works great in a web browser on phones and tablets. A native iOS/Android app is planned for Phase 2 (after the initial 16-week launch).

### What if we want to expand to multiple schools?

The system is built as multi-tenant from day one. Each school has completely separate data, their own branding, their own term dates, and their own pricing. Adding a second school is just creating another school account.

### Can students/parents use it without tech experience?

Yes, designed for simplicity:
- Parents: "View schedule, click book, select time, confirm"
- Students: "View schedule, download resources"
- Very intuitive interface based on Material Design (same design system as Gmail, Google Calendar)

### What about security and data privacy?

- All passwords hashed (unreadable even to developers)
- All data encrypted in transit (HTTPS)
- Credit card info never stored (handled by Stripe)
- Multi-tenant isolation (schools can't see each other's data)
- Daily automated backups
- Hosted in Australia (DigitalOcean Sydney datacenter)

### Who owns the data?

You do. All student, lesson, and payment data belongs to Music 'n Me. You can export it at any time.

---

## Summary

This system is purpose-built for Music 'n Me's unique hybrid teaching model. It transforms your most time-consuming manual processes into automated workflows while giving parents the modern, convenient experience they expect.

**Core Value**:
- **Time savings**: ~20 hours/month freed from administrative tasks
- **Better experience**: Parents book online, pay online, get WhatsApp updates
- **Fewer errors**: No double-bookings, no calculation mistakes, no lost requests
- **Competitive edge**: Offer hybrid lessons that Opus1 can't support
- **Scalability**: Built to grow with multiple locations and potential expansion

**Timeline**: 16 weeks to launch, then 3-4 weeks for data entry and training.

**Total Investment**: ~$110-150/month operating costs after launch.

**What makes it special**: It's not trying to be everything to everyone. It's built specifically for how Music 'n Me teaches music, with your hybrid lesson model as the centerpiece.

---

**Questions?** Your development team is ready to clarify any aspect of the system or walk through specific workflows in more detail.
