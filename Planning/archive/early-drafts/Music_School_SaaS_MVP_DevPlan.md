# Music School SaaS Platform - MVP Development Plan

**Project**: Multi-tenant Music School Management System  
**MVP Scope**: Single music school with group/individual lessons, roster, and payment processing  
**Tech Stack**: TypeScript, Node.js, Prisma ORM, PostgreSQL, React with Material 3 design  
**Hosting**: DigitalOcean (App Platform + Managed Database)  
**Timeline**: Phased approach (Phase 1: Core MVP, Phase 2: Multi-tenancy refinement)

---

## Project Architecture Overview

### Technology Stack

**Frontend**
- React 18+ with TypeScript
- Material-UI v5 (MUI) for Material 3 design system compliance
- React Router for navigation
- Axios for API calls
- React Query for state management and caching
- Stripe.js for payment UI integration

**Backend**
- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM for database layer
- JWT for authentication
- Stripe Node SDK for payment processing
- CORS middleware for frontend communication

**Database**
- PostgreSQL 15+ on DigitalOcean Managed Database
- Prisma migrations for schema management
- Connection pooling via PgBouncer

**DevOps**
- DigitalOcean App Platform for backend deployment
- DigitalOcean Spaces for file storage (future)
- GitHub for version control
- Environment-based configuration

---

## Phase 1: MVP Foundation (8-12 weeks)

### Phase 1 Milestones

**Week 1-2: Project Setup & Database Schema**
- Initialize monorepo structure
- Set up PostgreSQL database on DigitalOcean
- Design and implement Prisma schema
- Configure development environment

**Week 3-4: Backend Authentication & User Management**
- Implement JWT authentication
- Create user registration and login endpoints
- Role-based access control (Admin, Instructor, Student)
- Password hashing and security

**Week 5-6: Core Lesson Management**
- Lesson model design (group vs. individual)
- Scheduling and calendar logic
- Lesson CRUD operations
- Instructor assignment

**Week 7-8: Student Roster & Enrollment**
- Student management system
- Class enrollment workflow
- Attendance tracking
- Roster reporting

**Week 9-10: Payment Integration**
- Stripe Connect integration for instructor payouts
- Payment processing for student lessons
- Invoice generation
- Subscription handling (if applicable)

**Week 11-12: Frontend MVP & UI**
- Material 3 component implementation
- Dashboard layouts
- Forms for lesson creation, enrollment, payments
- Integration testing

---

## Project Folder Structure

```
music-school-saas/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   ├── stripe.ts
│   │   │   │   └── auth.ts
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── lessons.controller.ts
│   │   │   │   ├── students.controller.ts
│   │   │   │   ├── instructors.controller.ts
│   │   │   │   └── payments.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── lesson.service.ts
│   │   │   │   ├── enrollment.service.ts
│   │   │   │   ├── payment.service.ts
│   │   │   │   └── stripe.service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── errorHandler.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── lessons.routes.ts
│   │   │   │   ├── students.routes.ts
│   │   │   │   ├── instructors.routes.ts
│   │   │   │   └── payments.routes.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   └── custom.d.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── validators.ts
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── tests/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Layout/
│       │   │   │   ├── AppBar.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   └── MainLayout.tsx
│       │   │   ├── Auth/
│       │   │   │   ├── LoginForm.tsx
│       │   │   │   └── RegisterForm.tsx
│       │   │   ├── Lessons/
│       │   │   │   ├── LessonList.tsx
│       │   │   │   ├── LessonForm.tsx
│       │   │   │   └── LessonDetail.tsx
│       │   │   ├── Students/
│       │   │   │   ├── StudentRoster.tsx
│       │   │   │   ├── StudentForm.tsx
│       │   │   │   └── StudentDetail.tsx
│       │   │   ├── Payments/
│       │   │   │   ├── PaymentForm.tsx
│       │   │   │   ├── InvoiceList.tsx
│       │   │   │   └── PayoutDashboard.tsx
│       │   │   └── Common/
│       │   │       ├── ConfirmDialog.tsx
│       │   │       └── LoadingSpinner.tsx
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── LessonsPage.tsx
│       │   │   ├── RosterPage.tsx
│       │   │   └── SettingsPage.tsx
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useLessons.ts
│       │   │   └── usePayments.ts
│       │   ├── services/
│       │   │   ├── api.ts
│       │   │   ├── auth.service.ts
│       │   │   └── lessons.service.ts
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   ├── theme/
│       │   │   ├── material3Theme.ts
│       │   │   └── colors.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model School {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  admins       User[]
  instructors  User[]
  students     Student[]
  lessons      Lesson[]
  enrollments  Enrollment[]
  payments     Payment[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      Role     @default(STUDENT)
  phone     String?
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])

  // Instructor specific
  bio          String?
  specialties  String?
  stripeId     String?   // Stripe Connect account ID
  lessonsAsTeacher  Lesson[]
  payouts      Payout[]

  // Student specific
  studentProfile Student?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([email])
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

model Student {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])

  parentName     String?
  parentPhone    String?
  parentEmail    String?
  instrument     String?
  level          String?   // Beginner, Intermediate, Advanced
  emergencyContact String?

  enrollments Enrollment[]
  attendance  Attendance[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}

model Lesson {
  id        String   @id @default(cuid())
  title     String
  type      LessonType
  description String?
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])
  instructorId String
  instructor User   @relation(fields: [instructorId], references: [id])

  // Scheduling
  startTime    DateTime
  endTime      DateTime
  duration     Int       // in minutes
  recurrence   Recurrence @default(ONCE) // ONCE, WEEKLY, BIWEEKLY, MONTHLY
  recurrenceEndDate DateTime?

  // Group lesson specific
  maxStudents  Int?
  enrollments  Enrollment[]

  // Individual lesson specific
  isIndividual Boolean   @default(false)

  // Payment
  pricePerStudent Decimal?  // null for invoiced later
  status       LessonStatus @default(SCHEDULED

  attendance   Attendance[]
  payments     Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([instructorId])
  @@index([startTime])
}

enum LessonType {
  GROUP
  INDIVIDUAL
}

enum Recurrence {
  ONCE
  WEEKLY
  BIWEEKLY
  MONTHLY
}

enum LessonStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Enrollment {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])

  status    EnrollmentStatus @default(ACTIVE)
  enrolledAt DateTime @default(now())
  unenrolledAt DateTime?

  @@unique([lessonId, studentId])
  @@index([studentId])
  @@index([schoolId])
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  UNENROLLED
  DROPPED
}

model Attendance {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  present   Boolean
  notes     String?

  @@unique([lessonId, studentId])
}

model Payment {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id])
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])

  amount    Decimal
  status    PaymentStatus @default(PENDING
  method    PaymentMethod @default(STRIPE

  stripePaymentIntentId String?
  invoiceNumber String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([lessonId])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  STRIPE
  BANK_TRANSFER
  CASH
}

model Payout {
  id        String   @id @default(cuid())
  instructorId String
  instructor User   @relation(fields: [instructorId], references: [id])

  amount    Decimal
  status    PayoutStatus @default(PENDING
  stripePayout String?
  period    String   // e.g., "2024-11"

  createdAt DateTime @default(now())

  @@index([instructorId])
}

enum PayoutStatus {
  PENDING
  COMPLETED
  FAILED
}
```

---

## Development Workflow Setup

### Backend Setup Commands (PowerShell)

```powershell
# Create project directory
mkdir music-school-saas
cd music-school-saas

# Initialize monorepo
mkdir apps\backend
cd apps\backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express typescript @types/express @types/node prisma @prisma/client dotenv cors bcryptjs jsonwebtoken stripe axios

# Install dev dependencies
npm install --save-dev @types/bcryptjs @types/jsonwebtoken ts-node nodemon @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

# Initialize Prisma
npx prisma init

# Create TypeScript config
npx tsc --init
```

### Frontend Setup Commands (PowerShell)

```powershell
# From project root
cd apps

# Create React + TypeScript project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install Material-UI and dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Install other dependencies
npm install react-router-dom axios react-query @stripe/react-stripe-js @stripe/js

# Install dev dependencies
npm install --save-dev typescript @types/react @types/react-dom

# Start dev server
npm run dev
```

### Environment Configuration

**Backend .env.example**
```
# Database
DATABASE_URL="postgresql://user:password@host:5432/music_school"

# JWT
JWT_SECRET="your_super_secret_key_here_change_in_production"
JWT_EXPIRE="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Server
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

---

## Key Implementation Details

### Phase 1 Features Breakdown

**Authentication & Authorization**
- Email/password registration and login
- JWT token generation and validation
- Role-based access control (Admin, Instructor, Student)
- Middleware for protected routes

**Lesson Management**
- Create group and individual lessons
- Schedule lessons with recurrence support
- Assign instructors to lessons
- Cancel or modify lessons
- Lesson history and archiving

**Student Roster**
- Register students with parent/guardian info
- Track student details (instrument, level)
- View class enrollments per student
- Manage student unenrollment

**Enrollment System**
- Students enroll in group classes
- Automatic enrollment for individual lessons
- Enrollment status tracking (active, completed, dropped)
- Bulk enrollment for group classes

**Attendance Tracking**
- Mark attendance for each lesson
- Record notes per student
- Generate attendance reports

**Payment Processing**
- Stripe Connect for instructor payouts
- Payment processing for individual lessons
- Invoice generation
- Payment history and reconciliation
- Payout calculations for instructors

---

## DigitalOcean Deployment Strategy

### Database Setup

1. Create Managed PostgreSQL Database (15.x)
   - Single node or high-availability depending on needs
   - Auto-backups enabled
   - Connection pooling via PgBouncer

2. Prisma Migration
   - Run migrations in deployment pipeline before app starts
   - Keep migration history in GitHub

### App Deployment

1. Create App Platform app
   - Backend: Node.js environment
   - Frontend: Static site or Node.js buildpack
   - Set environment variables from .env
   - Enable auto-deploy from GitHub

2. GitHub Actions CI/CD
   - Run tests on pull requests
   - Build and deploy on merge to main
   - Run database migrations automatically

### Secrets Management

- Store sensitive keys in DigitalOcean App Platform secrets
- Never commit `.env` files to GitHub
- Use `.env.example` for documentation

---

## Testing Strategy (Phase 1)

**Backend Testing**
- Unit tests for services (Jest)
- Integration tests for API endpoints
- Mock database with test fixtures

**Frontend Testing**
- Component tests with React Testing Library
- Integration tests for user flows
- E2E tests with Cypress (Phase 2)

**Manual Testing Checklist**
- Authentication flows (registration, login, logout)
- Lesson creation and editing
- Enrollment workflows
- Payment processing (test mode)
- Attendance marking

---

## Security Considerations

- **Password Security**: Use bcrypt with salt rounds 12+
- **JWT Tokens**: Secure, short-lived tokens with refresh logic
- **HTTPS Only**: Enforce HTTPS on DigitalOcean
- **CORS**: Restrict to frontend domain
- **Input Validation**: Server-side validation on all endpoints
- **Rate Limiting**: Implement on auth endpoints
- **SQL Injection**: Protected via Prisma ORM
- **PCI Compliance**: Never store card data; use Stripe for all payments

---

## Success Metrics for MVP

✅ Single school can manage group and individual lessons  
✅ Students can enroll in lessons and view schedule  
✅ Instructors can see their assigned lessons and student list  
✅ Payments processed via Stripe with proper accounting  
✅ Attendance tracked and reported  
✅ Admin can manage all school data  
✅ UI follows Material 3 design principles  
✅ Deployed and running on DigitalOcean  

---

## Phase 2 Preview (Post-MVP)

- Multi-tenancy refinement (multiple schools on one platform)
- Admin dashboard for pricing and features
- Billing and subscription management
- Advanced reporting and analytics
- Mobile app (React Native)
- Integration with Google Calendar
- Email notifications and reminders
- Progress tracking and lesson notes

---

## Next Steps

1. **Week 1 Action Items**
   - Set up DigitalOcean PostgreSQL database
   - Initialize backend and frontend projects
   - Create GitHub repository
   - Design and implement Prisma schema
   - Set up CI/CD pipeline

2. **Documentation to Maintain**
   - API endpoint documentation
   - Database schema documentation
   - Setup and deployment guides
   - Code style guide for future team members

---

**Start Date**: [Insert date]  
**Target MVP Launch**: 12 weeks from start  
**Lead Developer**: Andrew  
**Architecture**: Scalable multi-tenant foundation (MVP = single school)
