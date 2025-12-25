# CLAUDE.md

Guidance for Claude Code when working with the Music 'n Me project.

## Project Overview

**Music 'n Me** is a SaaS platform for managing music schools, replacing "Simply Portal".

**Key Differentiators**:
- **Hybrid lesson model** - courses that alternate between group and individual sessions (CORE FEATURE)
- Meet & Greet booking system for prospective parents
- Google Drive two-way sync for seamless file management

- Client: Music 'n Me (musicnme.com.au)
- ~200 students, 2 locations, 3 rooms each
- Timeline: **12 weeks MVP** (extended from 8 weeks)

## Tech Stack

**Backend**: Node.js 18+ | TypeScript | Express | Prisma | PostgreSQL 15+
**Frontend**: React 18+ | TypeScript | Vite | Material-UI v5 | React Query
**Auth**: JWT + bcrypt (12 rounds min)
**Hosting**: DigitalOcean

**Phase 1 (MVP)**: Stripe, SendGrid, Google Drive API, **Hybrid Lesson Booking**
**Phase 2**: Twilio (WhatsApp/SMS), Xero, Google Calendar, Events, Blog/Newsletter, CRM, Teacher Training

## Lesson Types & Duration

**Default Lesson Types** (school can add/edit custom types):
- **Individual**: 45 minutes
- **Group**: 60 minutes
- **Band**: 60 minutes
- **Hybrid**: Mix of group + individual sessions (CORE FEATURE - Phase 1)

**Default Durations** (school can add/edit custom durations):
- 30 minutes
- 45 minutes
- 60 minutes

**Default Instruments** (school can add/edit custom instruments):
- Piano, Guitar, Drums, Singing, Bass, Preschool

## User Roles

- **ADMIN**: Full control - manage everything
- **TEACHER**: View ALL classes and students (full school access), mark attendance for any lesson, upload resources
- **PARENT**: View family schedule, pay invoices, book meet & greet, **book hybrid individual sessions**
- **STUDENT**: Read-only access to own data

## Brand Guidelines

### Typography

**Primary Font**: Monkey Mayhem (playful, display font for headings)
**Secondary Font**: Avenir (clean, professional font for body text)

**Font Usage:**
- Use **Monkey Mayhem** for page titles, hero text, and playful headings
- Use **Avenir** for body text, forms, tables, and UI elements
- Fallback fonts: System fonts (Roboto, SF Pro, Segoe UI)

### Logo & Visual Identity

**Logo Characteristics:**
- Playful, doodle-like shapes forming "MUSIC N ME"
- The M's are shaped like piano keys and guitar
- The two C's represent a happy person
- Soft, rounded edges (not rigid geometric)
- Can use standalone "M" icon for app icons/favicons

**Logo Usage:**
- Maintain clear space around logo (use "C" width as guideline)
- DO NOT: distort, tilt, add transparency, or use colors outside brand palette
- Primary logo for light backgrounds
- Standalone logogram for compact spaces

**Visual Style:**
- Use simple, basic shapes (circles, squares, ovals, triangles)
- Add subtle doodle textures to edges for approachable, hand-drawn feel
- Create dimension with color blocking (darker/brighter shades)
- **AVOID**: gradients, drop shadows, 3D effects
- Shapes symbolize diversity and individuality

### Characters (Age Group Mascots)

Music 'n Me uses characters to represent different age groups:

- **Alice** (Pre-school) - Pink character, sweet, day-dreamer
- **Steve** (Kids) - Yellow character with big ears, curious, perfect pitch
- **Liam** (Teens) - Blue character with sunglasses, rock enthusiast
- **Floyd** (Adult & Senior) - Mint character, career-focused, late bloomer

**Character Usage:**
- Use age-appropriate character on student dashboards
- Characters can interact with musical instruments in illustrations
- Maintain consistent color palette per character

### Sub-Brands (Program Levels)

- **Music N Me Mini** - Pre-school (rainbow icon)
- **Music N Me Master** - Kids (purple/yellow piano keys)
- **Music N Me Mezzo** - Kids/Teens (blue/yellow piano keys)
- **Music N Me Molto** - Advanced (black/yellow piano keys)
- **Music N Me Maestro** - Intermediate (teal/yellow Pac-Man icon)
- **Music N Me Voice** - Singing (pink microphone icon)

## Brand Colors

**Official Brand Colors** (from Music 'n Me Brand Guidelines):

```typescript
primary: {
  main: '#4580E4',      // Blue - Primary brand color (R69 G128 B228)
  light: '#a3d9f6',     // Light blue
  dark: '#3899ec'       // Dark blue
}
secondary: {
  main: '#FFCE00'       // Yellow (R255 G206 B0) - Pantone 116 C
}
accent: {
  mint: '#96DAC9',      // Mint/Teal (R150 G218 B201) - Pantone 571 C
  coral: '#FFAE9E',     // Pink/Coral (R255 G174 B158) - Pantone 169 C
  cream: '#FCF6E6'      // Cream/Beige (R252 G246 B230) - Pantone 7604 C
}
error: { main: '#ff4040' }
background: {
  default: '#ffffff',
  paper: '#FCF6E6'      // Cream background for cards/panels
}
text: {
  primary: '#080808',
  secondary: '#9DA5AF'
}
```

**Color Usage:**
- **RGB** for digital use (web, mobile)
- **CMYK** for print materials
- Use color blocking with slightly darker/brighter shades for dimension
- **NO gradients or drop shadows** - keep designs flat and modern

## Critical Security Rule

**ALWAYS filter by `schoolId`** in every database query to prevent data leakage:

```typescript
// ✅ CORRECT
const lessons = await prisma.lesson.findMany({
  where: { schoolId: req.user.schoolId, instructorId: teacherId }
});

// ❌ WRONG
const lessons = await prisma.lesson.findMany({
  where: { instructorId: teacherId }  // Missing schoolId!
});
```

## MVP Scope (12 Weeks)

**Core Features**:
- User authentication & authorization
  - Login/logout functionality
  - JWT + bcrypt (12 rounds)
  - **Comprehensive password security** (from Body Chi Me)
    - Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
    - Common password detection (10,000+ database)
    - Personal information detection
    - Have I Been Pwned breach checking (k-anonymity)
    - Password history (last 5 prevention)
    - Rate limiting (5 failures per 15 min)
    - Password change feature with validation
  - See `docs/authentication-and-security.md` for details
- **Parent accounts with 2 contacts + emergency contact**
- **Meet & Greet Booking System**
  - Public booking (no account required)
  - Captures 2 contacts + emergency contact
  - Email verification
  - Admin approval workflow
  - **Registration requires Stripe payment** (credit card only)
  - Pre-populated registration with all contact data
- School setup (terms, locations, rooms, instruments, lesson types, durations - all configurable)
- Lesson management (Individual, Group, Band, **Hybrid**)
- **Hybrid Lesson Model** (CORE FEATURE)
  - Parent booking system for individual sessions
  - Configurable group/individual week patterns per term
  - Calendar integration with placeholders
  - Parent-controlled rescheduling (24h notice)
- Student enrollment & attendance
- **REQUIRED teacher notes per student AND per class** (expected daily, must by end of week)
- **Teachers can view ALL classes and students** (for coverage)
- Calendar with drag-and-drop rescheduling
- Family accounts
- **Pricing packages** (pre-defined bundles) + **Base price + add-ons model**
- Invoicing with multiple line items (term-based only)
- Stripe payments + manual payments
- **Google Drive Two-Way Sync**
  - Admin links Drive folders to classes/students
  - Teachers upload files (syncs to Drive)
  - Students download files (from Drive + portal)
  - File visibility rules (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- Email notifications
- Dashboards (Admin, Teacher, Parent)
- **Account Deletion & Data Privacy** (GDPR/Privacy Act/COPPA)
  - User self-deletion with 30-day grace period
  - Parent can delete children's data
  - Configurable data retention per school
  - Data export (right to portability)
  - School-level deletion for multi-tenant SaaS
  - See `Planning/Account_Deletion_Specification.md` for details

**Defer to Phase 2**:
- Monthly subscription payments
- WhatsApp/SMS notifications (will use email for MVP)
- Google Calendar sync
- Xero integration
- Events management
- Blog/Newsletter
- Teacher training module
- Advanced CRM features

## Project Structure

```
MnM/
├── apps/
│   ├── backend/          # Node + Express + Prisma
│   └── frontend/         # React + Vite + MUI
├── Planning/
│   ├── specifications/   # Technical specs (Meet & Greet, Drive Sync, Deletion)
│   ├── roadmaps/         # MVP plan, task list, Phase 2
│   ├── reference/        # Brand guidelines, architecture, client materials
│   └── archive/          # Outdated docs (early drafts, meeting notes)
├── docs/                 # Developer documentation
├── CLAUDE.md             # This file
├── PROGRESS.md           # **Development progress tracker** (update after each session)
├── TASKLIST.md           # **Quick task checklist** (mark items complete as you go)
└── README.md
```

## Progress Tracking

**IMPORTANT:** Always check and update these files at the start/end of each session:

- **`PROGRESS.md`** - Overall project progress, weekly status, milestones
- **`TASKLIST.md`** - Checkbox task list for quick reference

**Current Status (2025-12-25):**
- Weeks 1-9: COMPLETE
- Overall Progress: 75% (9/12 weeks)
- Next: Week 10 - Advanced Scheduling & Notifications

## Development Commands

```bash
# Backend
cd apps/backend
npm run dev              # Start dev server
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create migration

# Frontend
cd apps/frontend
npm run dev              # Start dev server
npm run build            # Production build
```

## Documentation

### Technical Documentation (docs/ directory)
- `authentication-and-security.md` - **Password security & auth** (Body Chi Me patterns)
- `coding-standards.md` - Code quality guidelines
- `development-workflow.md` - Development process
- `git-workflow.md` - Git branching and commits

### Project Planning (Planning/ directory)

**Specifications** (`Planning/specifications/`):
- `Meet_and_Greet_Specification.md` - Meet & greet system technical spec
- `Google_Drive_Sync_Specification.md` - Google Drive sync technical spec
- `Account_Deletion_Specification.md` - **GDPR/Privacy Act/COPPA compliance**

**Roadmaps** (`Planning/roadmaps/`):
- `12_Week_MVP_Plan.md` - **Current sprint breakdown**
- `Development_Task_List.md` - **Complete task checklist** (300+ items)
- `Phase_2_Roadmap.md` - Deferred features and timeline

**Reference** (`Planning/reference/`):
- `Brand_Guidelines_Reference.md` - Colors, fonts, logo usage
- `Technical_Architecture_Overview.md` - Architecture details
- `Music_n_Me_System_Overview.md` - Complete system docs (original)
- `Body_Chi_Me_Review_And_Recommendations.md` - Patterns from Body Chi Me

**Archive** (`Planning/archive/`): Outdated docs, early drafts, meeting notes

### Development Tools & Commands
- `.claude/commands/` - Slash commands (/study, /plan, /qa, /report, /commit)
- `.claude/agents/` - Specialized agents (hybrid-booking, multi-tenancy, full-stack, testing)
- `md/` - Work artifacts (study, plan, review, report)
