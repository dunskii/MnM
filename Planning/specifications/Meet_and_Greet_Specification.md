# Meet & Greet System - Technical Specification

## Overview

The Meet & Greet system allows prospective parents to book introductory sessions **before creating an account**. This pre-registration flow captures lead information, assigns meetings to appropriate teachers, and streamlines the full registration process.

---

## User Flow

### 1. Public Booking (No Account Required)

```
Parent visits website
    ↓
Clicks "Book a Meet & Greet"
    ↓
Fills out form:
  - Parent 1: name, email, phone
  - Parent 2: name, email, phone (optional)
  - Emergency contact: name, phone
  - Child's name
  - Child's age
  - Instrument of interest
  - Preferred time slots
    ↓
Submits booking
    ↓
Email verification sent
    ↓
Parent confirms email
    ↓
Booking confirmed → Admin/Teacher notified
```

### 2. Admin/Teacher Management

```
Admin/Teacher receives notification
    ↓
Reviews meet & greet details
    ↓
Conducts 15-minute session
    ↓
Marks as "Completed" and adds notes
    ↓
Decides: Approve for registration OR Follow-up needed
    ↓
If approved:
  - Admin clicks "Convert to Registration"
  - Parent receives email with registration link
  - Form pre-populated with meet & greet data (2 contacts + emergency contact)
```

### 3. Parent Registration (Post-Approval)

```
Parent receives registration email
    ↓
Clicks link (includes token)
    ↓
Registration form pre-filled:
  - Parent 1: name, email, phone ✅
  - Parent 2: name, email, phone ✅ (if provided)
  - Emergency contact: name, phone ✅
  - Child name, age ✅
    ↓
Parent completes:
  - Password
  - Additional children (if any)
  - **Registration fee payment (Stripe - credit card only)**
    ↓
Payment successful → Account created
    ↓
Admin assigns child to appropriate classes
```

---

## Database Schema

### MeetAndGreet Model

```prisma
model MeetAndGreet {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Parent 1 information (PRIMARY - captured before account creation)
  parent1Name   String
  parent1Email  String
  parent1Phone  String?

  // Parent 2 information (OPTIONAL)
  parent2Name   String?
  parent2Email  String?
  parent2Phone  String?

  // Emergency contact
  emergencyContactName  String
  emergencyContactPhone String

  // Child information
  childName   String
  childAge    Int?

  // Booking details
  instrumentInterest  String?  // "Piano", "Guitar", etc.
  preferredDateTime   DateTime
  locationId          String
  location            Location @relation(fields: [locationId], references: [id])
  roomId              String?
  room                Room?    @relation(fields: [roomId], references: [id])

  // Assigned teacher (head teacher for instrument)
  teacherId           String?
  teacher             User?    @relation("MeetAndGreetTeacher", fields: [teacherId], references: [id])

  // Status tracking
  status              MeetAndGreetStatus @default(PENDING)
  completedAt         DateTime?
  notes               String?  // Teacher notes after meeting

  // Email verification
  emailVerified       Boolean  @default(false)
  verificationToken   String?  @unique

  // Conversion to full account
  convertedToUserId   String?  @unique
  convertedToUser     User?    @relation("ConvertedFromMeetAndGreet", fields: [convertedToUserId], references: [id])
  registrationToken   String?  @unique  // Token sent in registration email
  registrationTokenExpiry DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([email])
  @@index([status])
  @@index([preferredDateTime])
}

enum MeetAndGreetStatus {
  PENDING           // Awaiting email verification
  CONFIRMED         // Email verified, awaiting meeting
  COMPLETED         // Meeting conducted
  APPROVED          // Approved for registration
  REGISTERED        // Parent has created account
  CANCELLED         // Cancelled by parent or admin
  NO_SHOW           // Parent didn't attend
}
```

### MeetAndGreetAvailability Model

```prisma
model MeetAndGreetAvailability {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Time slot
  dayOfWeek Int      // 0 = Sunday, 1 = Monday, etc.
  startTime String   // "09:00"
  endTime   String   // "17:00"
  slotDuration Int   @default(15)  // Minutes per slot

  // Location
  locationId String
  location   Location @relation(fields: [locationId], references: [id])
  roomId     String?
  room       Room?    @relation(fields: [roomId], references: [id])

  // Teacher assignment
  teacherId  String?
  teacher    User?    @relation("MeetAndGreetAvailabilityTeacher", fields: [teacherId], references: [id])

  // Specific dates (overrides day-of-week if set)
  specificDate DateTime?

  // Active status
  active     Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([locationId])
  @@index([dayOfWeek])
  @@index([specificDate])
}
```

---

## API Endpoints

### Public Endpoints (No Auth)

#### `POST /api/v1/public/meet-and-greet/availability`
Get available time slots for booking.

**Request:**
```json
{
  "schoolId": "school_abc123",
  "instrumentInterest": "Piano",
  "startDate": "2025-01-15",
  "endDate": "2025-01-31"
}
```

**Response:**
```json
{
  "slots": [
    {
      "dateTime": "2025-01-16T10:00:00Z",
      "locationId": "loc_123",
      "locationName": "Studio A",
      "roomId": "room_456",
      "roomName": "Room 1",
      "teacherId": "teacher_789",
      "teacherName": "Ms. Johnson",
      "available": true
    },
    {
      "dateTime": "2025-01-16T10:15:00Z",
      "locationId": "loc_123",
      "locationName": "Studio A",
      "roomId": "room_456",
      "roomName": "Room 1",
      "teacherId": "teacher_789",
      "teacherName": "Ms. Johnson",
      "available": true
    }
    // ... more slots
  ]
}
```

#### `POST /api/v1/public/meet-and-greet/book`
Book a meet & greet (sends verification email).

**Request:**
```json
{
  "schoolId": "school_abc123",
  "parent1Name": "Sarah Smith",
  "parent1Email": "sarah@example.com",
  "parent1Phone": "+61412345678",
  "parent2Name": "John Smith",
  "parent2Email": "john@example.com",
  "parent2Phone": "+61498765432",
  "emergencyContactName": "Mary Johnson",
  "emergencyContactPhone": "+61411222333",
  "childName": "Emma",
  "childAge": 7,
  "instrumentInterest": "Piano",
  "preferredDateTime": "2025-01-16T10:00:00Z",
  "locationId": "loc_123",
  "roomId": "room_456",
  "teacherId": "teacher_789"
}
```

**Note:** `parent2Name`, `parent2Email`, and `parent2Phone` are optional. All other fields are required.

**Response:**
```json
{
  "id": "mag_abc123",
  "message": "Booking created! Please check your email to verify.",
  "status": "PENDING"
}
```

**Side Effects:**
- Email sent to parent with verification link
- Creates `MeetAndGreet` record with `status: PENDING`
- Generates unique `verificationToken`

#### `GET /api/v1/public/meet-and-greet/verify/:token`
Verify email address.

**Response:**
```json
{
  "message": "Email verified! Your meet & greet is confirmed.",
  "meetAndGreet": {
    "id": "mag_abc123",
    "parentName": "Sarah Smith",
    "childName": "Emma",
    "preferredDateTime": "2025-01-16T10:00:00Z",
    "locationName": "Studio A",
    "teacherName": "Ms. Johnson",
    "status": "CONFIRMED"
  }
}
```

**Side Effects:**
- Updates `emailVerified: true`
- Updates `status: CONFIRMED`
- Sends notification to assigned teacher and admin
- Adds event to school calendar

---

### Admin/Teacher Endpoints (Auth Required)

#### `GET /api/v1/meet-and-greet`
List all meet & greet bookings.

**Query Params:**
- `status` (optional): Filter by status (PENDING, CONFIRMED, COMPLETED, etc.)
- `teacherId` (optional): Filter by teacher
- `startDate` (optional): Filter by date range
- `endDate` (optional)

**Response:**
```json
{
  "meetAndGreets": [
    {
      "id": "mag_abc123",
      "parentName": "Sarah Smith",
      "email": "sarah@example.com",
      "phone": "+61412345678",
      "childName": "Emma",
      "childAge": 7,
      "instrumentInterest": "Piano",
      "preferredDateTime": "2025-01-16T10:00:00Z",
      "location": { "id": "loc_123", "name": "Studio A" },
      "room": { "id": "room_456", "name": "Room 1" },
      "teacher": { "id": "teacher_789", "name": "Ms. Johnson" },
      "status": "CONFIRMED",
      "emailVerified": true,
      "notes": null,
      "createdAt": "2025-01-10T14:30:00Z"
    }
    // ... more bookings
  ],
  "total": 15,
  "page": 1,
  "pageSize": 20
}
```

#### `PATCH /api/v1/meet-and-greet/:id`
Update meet & greet status/notes.

**Request:**
```json
{
  "status": "COMPLETED",
  "notes": "Great meeting! Emma is enthusiastic about piano. Recommended for Piano Foundation 1.",
  "completedAt": "2025-01-16T10:15:00Z"
}
```

**Response:**
```json
{
  "id": "mag_abc123",
  "status": "COMPLETED",
  "notes": "Great meeting! Emma is enthusiastic about piano. Recommended for Piano Foundation 1.",
  "completedAt": "2025-01-16T10:15:00Z"
}
```

#### `POST /api/v1/meet-and-greet/:id/approve`
Approve for registration and send registration link to parent.

**Response:**
```json
{
  "message": "Registration email sent to sarah@example.com",
  "registrationLink": "https://musicnme.com/register?token=reg_xyz789",
  "status": "APPROVED"
}
```

**Side Effects:**
- Updates `status: APPROVED`
- Generates unique `registrationToken` (expires in 7 days)
- Sends email to parent(s) with registration link
  - Sent to parent1Email (always)
  - Sent to parent2Email (if provided)
- Email includes:
  - Link to registration form
  - Pre-filled data (parent 1/2 contacts, emergency contact, child name/age)
  - **Payment requirement notice** (registration fee via Stripe - credit card only)
  - Expiry notice (7 days)

#### `DELETE /api/v1/meet-and-greet/:id`
Cancel/delete a meet & greet booking.

**Response:**
```json
{
  "message": "Meet & greet cancelled successfully"
}
```

**Side Effects:**
- Updates `status: CANCELLED`
- Sends cancellation email to parent
- Removes from calendar

---

### Admin Availability Management

#### `GET /api/v1/meet-and-greet/availability`
List all availability configurations.

**Response:**
```json
{
  "availabilities": [
    {
      "id": "avail_123",
      "dayOfWeek": 1,  // Monday
      "startTime": "09:00",
      "endTime": "17:00",
      "slotDuration": 15,
      "location": { "id": "loc_123", "name": "Studio A" },
      "room": { "id": "room_456", "name": "Room 1" },
      "teacher": { "id": "teacher_789", "name": "Ms. Johnson" },
      "active": true
    }
    // ... more
  ]
}
```

#### `POST /api/v1/meet-and-greet/availability`
Create availability slots.

**Request:**
```json
{
  "dayOfWeek": 1,  // Monday
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 15,
  "locationId": "loc_123",
  "roomId": "room_456",
  "teacherId": "teacher_789",
  "active": true
}
```

**Response:**
```json
{
  "id": "avail_123",
  "message": "Availability created successfully"
}
```

#### `PATCH /api/v1/meet-and-greet/availability/:id`
Update availability (e.g., disable specific dates).

#### `DELETE /api/v1/meet-and-greet/availability/:id`
Delete availability configuration.

---

## Business Logic

### Slot Availability Calculation

```typescript
async function getAvailableSlots(params: {
  schoolId: string;
  instrumentInterest?: string;
  startDate: Date;
  endDate: Date;
}): Promise<AvailableSlot[]> {
  // 1. Get all availability configurations for school
  const configs = await prisma.meetAndGreetAvailability.findMany({
    where: {
      schoolId: params.schoolId,
      active: true,
    },
    include: { location: true, room: true, teacher: true },
  });

  // 2. Generate time slots based on dayOfWeek + startTime/endTime
  const slots: AvailableSlot[] = [];
  for (const config of configs) {
    const slotsForConfig = generateSlotsFromConfig(
      config,
      params.startDate,
      params.endDate
    );
    slots.push(...slotsForConfig);
  }

  // 3. Get existing bookings in date range
  const bookings = await prisma.meetAndGreet.findMany({
    where: {
      schoolId: params.schoolId,
      preferredDateTime: {
        gte: params.startDate,
        lte: params.endDate,
      },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
  });

  // 4. Mark slots as unavailable if already booked
  const bookedTimes = new Set(
    bookings.map((b) => b.preferredDateTime.toISOString())
  );

  slots.forEach((slot) => {
    if (bookedTimes.has(slot.dateTime.toISOString())) {
      slot.available = false;
    }
  });

  // 5. Filter by instrument interest (assign appropriate teacher)
  if (params.instrumentInterest) {
    return slots.filter((slot) =>
      slot.teacher?.specialties?.includes(params.instrumentInterest)
    );
  }

  return slots;
}
```

### Email Verification Flow

```typescript
async function sendVerificationEmail(meetAndGreet: MeetAndGreet) {
  const token = generateSecureToken(); // crypto.randomBytes(32).toString('hex')
  const verificationUrl = `${process.env.APP_URL}/api/v1/public/meet-and-greet/verify/${token}`;

  await prisma.meetAndGreet.update({
    where: { id: meetAndGreet.id },
    data: { verificationToken: token },
  });

  await sendEmail({
    to: meetAndGreet.email,
    subject: "Verify Your Meet & Greet Booking - Music 'n Me",
    template: 'meet-and-greet-verification',
    data: {
      parentName: meetAndGreet.parentName,
      childName: meetAndGreet.childName,
      dateTime: formatDateTime(meetAndGreet.preferredDateTime),
      locationName: meetAndGreet.location.name,
      teacherName: meetAndGreet.teacher?.firstName,
      verificationUrl,
    },
  });
}
```

### Registration Token Flow

```typescript
async function approveAndSendRegistrationLink(meetAndGreetId: string) {
  const meetAndGreet = await prisma.meetAndGreet.findUnique({
    where: { id: meetAndGreetId },
    include: { school: true },
  });

  if (meetAndGreet.status !== 'COMPLETED') {
    throw new Error('Meet & greet must be completed before approval');
  }

  const registrationToken = generateSecureToken();
  const expiryDate = addDays(new Date(), 7); // Token expires in 7 days

  await prisma.meetAndGreet.update({
    where: { id: meetAndGreetId },
    data: {
      status: 'APPROVED',
      registrationToken,
      registrationTokenExpiry: expiryDate,
    },
  });

  const registrationUrl = `${process.env.APP_URL}/register?token=${registrationToken}`;

  await sendEmail({
    to: meetAndGreet.email,
    subject: "You're Approved! Complete Your Registration - Music 'n Me",
    template: 'registration-invitation',
    data: {
      parentName: meetAndGreet.parentName,
      childName: meetAndGreet.childName,
      schoolName: meetAndGreet.school.name,
      registrationUrl,
      expiryDate: formatDate(expiryDate),
    },
  });
}
```

### Pre-Filled Registration

```typescript
async function getRegistrationDataFromToken(token: string) {
  const meetAndGreet = await prisma.meetAndGreet.findUnique({
    where: { registrationToken: token },
    include: { school: true },
  });

  if (!meetAndGreet) {
    throw new Error('Invalid registration token');
  }

  if (meetAndGreet.registrationTokenExpiry < new Date()) {
    throw new Error('Registration token has expired');
  }

  if (meetAndGreet.status === 'REGISTERED') {
    throw new Error('Account already created from this meet & greet');
  }

  return {
    schoolId: meetAndGreet.schoolId,
    parent1Name: meetAndGreet.parent1Name,
    parent1Email: meetAndGreet.parent1Email,
    parent1Phone: meetAndGreet.parent1Phone,
    parent2Name: meetAndGreet.parent2Name,
    parent2Email: meetAndGreet.parent2Email,
    parent2Phone: meetAndGreet.parent2Phone,
    emergencyContactName: meetAndGreet.emergencyContactName,
    emergencyContactPhone: meetAndGreet.emergencyContactPhone,
    children: [
      {
        name: meetAndGreet.childName,
        age: meetAndGreet.childAge,
        instrumentInterest: meetAndGreet.instrumentInterest,
      },
    ],
  };
}

async function createAccountFromMeetAndGreet(
  token: string,
  additionalData: {
    password: string;
    additionalChildren?: Array<{ name: string; age: number }>;
    stripePaymentIntentId: string;  // REQUIRED: Registration fee payment
  }
) {
  const meetAndGreet = await prisma.meetAndGreet.findUnique({
    where: { registrationToken: token },
  });

  if (!meetAndGreet || meetAndGreet.registrationTokenExpiry < new Date()) {
    throw new Error('Invalid or expired token');
  }

  // Verify payment was successful
  const payment = await verifyStripePayment(additionalData.stripePaymentIntentId);
  if (payment.status !== 'succeeded') {
    throw new Error('Payment not completed');
  }

  // Create parent user account (Parent 1 - primary)
  const hashedPassword = await bcrypt.hash(additionalData.password, 12);
  const parentUser = await prisma.user.create({
    data: {
      email: meetAndGreet.parent1Email,
      password: hashedPassword,
      firstName: meetAndGreet.parent1Name.split(' ')[0],
      lastName: meetAndGreet.parent1Name.split(' ').slice(1).join(' '),
      phone: meetAndGreet.parent1Phone,
      role: 'PARENT',
      schoolId: meetAndGreet.schoolId,
      emailVerified: true, // Already verified via meet & greet
    },
  });

  // Create Parent 2 account if provided
  let parent2User = null;
  if (meetAndGreet.parent2Email) {
    parent2User = await prisma.user.create({
      data: {
        email: meetAndGreet.parent2Email,
        password: hashedPassword, // Same password as parent 1 initially
        firstName: meetAndGreet.parent2Name?.split(' ')[0] || '',
        lastName: meetAndGreet.parent2Name?.split(' ').slice(1).join(' ') || '',
        phone: meetAndGreet.parent2Phone,
        role: 'PARENT',
        schoolId: meetAndGreet.schoolId,
        emailVerified: true,
      },
    });
  }

  // Create family group
  const familyGroup = await prisma.familyGroup.create({
    data: {
      name: `${meetAndGreet.parent1Name} Family`,
      schoolId: meetAndGreet.schoolId,
      adminId: parentUser.id,
      emergencyContactName: meetAndGreet.emergencyContactName,
      emergencyContactPhone: meetAndGreet.emergencyContactPhone,
    },
  });

  // Create student for primary child
  const primaryStudent = await prisma.student.create({
    data: {
      userId: parentUser.id, // Student linked to parent
      schoolId: meetAndGreet.schoolId,
      // ... child data from meet & greet
    },
  });

  // Update meet & greet status
  await prisma.meetAndGreet.update({
    where: { id: meetAndGreet.id },
    data: {
      status: 'REGISTERED',
      convertedToUserId: parentUser.id,
    },
  });

  // Send welcome email
  await sendWelcomeEmail(parentUser);

  return { user: parentUser, familyGroup };
}
```

---

## Frontend Components

### Public Booking Page

**Route:** `/book-meet-and-greet`

**Components:**
- `MeetAndGreetBookingForm.tsx`
  - Parent info fields
  - Child info fields
  - Instrument selection (dropdown)
  - Date/time slot picker (calendar + time slots)
  - Location display (read-only, based on selected slot)
  - Teacher display (read-only, based on instrument)
  - Submit button
- `AvailableSlotCalendar.tsx`
  - Shows available dates
  - Click date → shows time slots
  - Color-coded availability
- `ConfirmationModal.tsx`
  - Shows booking details
  - "Check your email" message

### Admin Meet & Greet Management

**Route:** `/admin/meet-and-greet`

**Components:**
- `MeetAndGreetList.tsx`
  - Table of all bookings
  - Filters: status, date range, teacher
  - Actions: View, Mark Complete, Approve, Cancel
- `MeetAndGreetDetail.tsx`
  - Full booking details
  - Status timeline
  - Notes field (editable by teacher/admin)
  - Approve button → sends registration email
- `MeetAndGreetAvailabilitySettings.tsx`
  - List availability configs
  - Add/edit availability
  - Set days/times, location, room, teacher

### Pre-Filled Registration Form

**Route:** `/register?token=xxx`

**Component:** `RegistrationForm.tsx`
- Pre-populated fields (disabled):
  - Parent name ✅
  - Email ✅
  - Phone ✅
  - Child name ✅
  - Child age ✅
- Editable fields:
  - Password (new)
  - Confirm password
  - Additional children (optional, repeater)
  - Emergency contact (optional)
- Submit → creates account

---

## Notifications

### Email Templates

**1. Verification Email** (to Parent)
```
Subject: Verify Your Meet & Greet Booking - Music 'n Me

Hi Sarah,

Thanks for booking a meet & greet for Emma!

Please verify your email to confirm your booking:
[Verify Email Button]

Booking Details:
- Date & Time: Monday, January 16 at 10:00 AM
- Location: Studio A, Room 1
- Teacher: Ms. Johnson (Piano)
- Duration: 15 minutes

This link expires in 24 hours.

Best,
Music 'n Me Team
```

**2. Confirmation Email** (to Parent, after verification)
```
Subject: Meet & Greet Confirmed - Music 'n Me

Hi Sarah,

Your meet & greet is confirmed!

We're excited to meet Emma on Monday, January 16 at 10:00 AM.

Location: Studio A, Room 1
Teacher: Ms. Johnson
What to bring: Just Emma's enthusiasm!

See you soon!

Music 'n Me Team
```

**3. Admin/Teacher Notification** (after verification)
```
Subject: New Meet & Greet Booking

A new meet & greet has been booked:

Parent: Sarah Smith (sarah@example.com, +61412345678)
Child: Emma (7 years old)
Instrument: Piano
Date & Time: Monday, January 16 at 10:00 AM
Location: Studio A, Room 1
Teacher: Ms. Johnson

[View in Dashboard]
```

**4. Registration Invitation** (to Parent, after approval)
```
Subject: You're Approved! Complete Your Registration - Music 'n Me

Hi Sarah,

Great news! After meeting Emma, we'd love to have her join our piano program.

Please complete your registration to get started:
[Complete Registration Button]

Your registration link expires in 7 days.

We've already saved your details from the meet & greet, so this will only take a minute!

Looking forward to seeing Emma in class!

Music 'n Me Team
```

---

## Security Considerations

1. **Rate Limiting**
   - Limit public booking endpoint: 5 requests per hour per IP
   - Prevent spam bookings

2. **Email Verification**
   - Required before booking is confirmed
   - Prevents fake bookings

3. **Token Security**
   - Verification tokens: 32-byte random hex (crypto.randomBytes)
   - Registration tokens: 32-byte random hex + expiry (7 days)
   - Tokens stored hashed in database (optional extra security)

4. **Captcha** (Optional but Recommended)
   - Google reCAPTCHA v3 on public booking form
   - Prevents bot spam

5. **Data Validation**
   - Zod schemas for all inputs
   - Email format validation
   - Phone number format validation (E.164)

---

## Testing Strategy

### Unit Tests
- Slot availability calculation logic
- Token generation and validation
- Email verification flow
- Registration token expiry

### Integration Tests
- Public booking flow (form → email → verification → confirmation)
- Admin approval flow (complete → approve → registration email)
- Registration flow (token → pre-fill → create account)

### E2E Tests
- Full journey: Book → Verify → Admin Approve → Parent Registers → Account Created

---

## Success Metrics

- **Booking Conversion Rate**: % of meet & greets that lead to registrations
- **Email Verification Rate**: % of bookings verified within 24 hours
- **No-Show Rate**: % of confirmed bookings where parent doesn't attend
- **Registration Completion Rate**: % of approved bookings that complete registration within 7 days

---

## Future Enhancements (Phase 2)

- WhatsApp/SMS notifications (in addition to email)
- Automated reminders (24 hours before meeting)
- Online video meetings (Zoom/Google Meet integration)
- Multi-child bookings in single form
- Parent can reschedule their own meet & greet (with 24h notice)
- Teacher availability sync with Google Calendar
- Feedback form after meet & greet (for parents)
