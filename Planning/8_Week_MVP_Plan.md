# Music 'n Me - 8 Week MVP Plan

## Project Summary

**Client**: Music 'n Me (musicnme.com.au)
**Current System**: Simply Portal (to be replaced)
**Timeline**: 8 weeks to MVP
**Students**: ~200 (manual entry)
**Locations**: 2 locations, 3 rooms each

## Key Requirements

### Lesson Structure
- **Group Lessons**: 1 hour
- **One-on-One Lessons**: 45 minutes
- **Band Lessons**: 1 hour

### Billing & Terms
- **Billing**: Per term
- **Term Structure**: 4 terms × 10 weeks (configurable per school)
- **Critical**: Must support multiple countries with different academic calendars

### Instruments
- Current: Piano, Guitar, Drums, Singing
- **Must be expandable** (more instruments coming)

### Tech Stack
- TypeScript, Node.js, PostgreSQL
- React with Material-UI (Material 3)
- Hosted on DigitalOcean
- Stripe for payments

## Brand Colors (Extracted from musicnme.com.au)

```javascript
const theme = {
  palette: {
    primary: {
      main: '#116dff',      // Primary action blue
      light: '#a3d9f6',     // Light blue
      dark: '#3899ec',      // Medium blue
    },
    secondary: {
      main: '#7fccf7',      // Sky blue
    },
    error: {
      main: '#ff4040',      // Error red
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#080808',
      secondary: '#9DA5AF',
    },
  },
};
```

## 8-Week Sprint Breakdown

### WEEK 1: Foundation & Authentication
**Goal**: Working development environment + user authentication

**Days 1-2: Project Setup**
- Initialize monorepo structure
- Set up PostgreSQL with Docker
- Create Prisma schema (core models only)
- Initial migration
- GitHub repository setup

**Days 3-4: Authentication System**
- JWT authentication service
- User registration/login endpoints
- Password hashing (bcrypt)
- Auth middleware
- Role-based access control (ADMIN, TEACHER, PARENT, STUDENT)

**Day 5: Basic API Structure**
- Express app with middleware
- Error handling
- Request logging
- Health check endpoint
- Environment configuration

**Deliverables:**
- ✅ Backend runs on port 5000
- ✅ PostgreSQL database created
- ✅ User can register and login
- ✅ JWT tokens generated and validated

---

### WEEK 2: School Setup & User Management
**Goal**: Complete school configuration and user management

**Days 1-2: School Configuration**
- School creation endpoint
- **School Terms management** (CRITICAL - configurable terms)
  - Create term: name, start date, end date
  - List terms for school
  - Update term dates
- Location management
- Room management per location

**Days 3-4: User Management**
- Admin user management
  - Create teachers
  - Create students
  - Create parent accounts
  - List all users
- Student roster with parent contact info
- Instruments configuration (Piano, Guitar, Drums, Singing + custom)

**Day 5: Frontend Setup**
- Create React app with Vite
- Material-UI v5 setup with Music 'n Me theme
- Login/Register pages
- Protected routes
- Admin dashboard shell

**Deliverables:**
- ✅ School can configure 4 × 10-week terms
- ✅ Admin can create 2 locations with 3 rooms each
- ✅ Admin can create teachers and students
- ✅ Frontend login working

---

### WEEK 3: Lesson Management & Enrollment
**Goal**: Create and manage lessons, enroll students

**Days 1-2: Lesson System**
- Lesson creation (INDIVIDUAL, GROUP, BAND)
  - Lesson types with correct durations:
    - GROUP: 1 hour (60 minutes)
    - INDIVIDUAL: 45 minutes
    - BAND: 1 hour (60 minutes)
  - Assign teacher
  - Assign location & room
  - Set recurrence (ONCE, WEEKLY, BIWEEKLY)
  - Link to school term
- Lesson listing with filters (by teacher, location, date)
- Lesson detail view

**Days 3-4: Enrollment Workflow**
- Bulk student enrollment (Admin can assign multiple students to group lesson)
- Individual enrollment
- Enrollment status tracking (ACTIVE, COMPLETED, UNENROLLED)
- Max students per lesson enforcement
- View enrolled students per lesson

**Day 5: Frontend - Lesson Management**
- Admin lesson creation form
- Lesson list view
- Student enrollment interface
- Enrollment roster view

**Deliverables:**
- ✅ Admin can create group lessons (1 hour)
- ✅ Admin can create one-on-one lessons (45 minutes)
- ✅ Admin can create band lessons (1 hour)
- ✅ Bulk enroll students in group lessons
- ✅ View lesson rosters

---

### WEEK 4: Calendar & Basic Scheduling
**Goal**: Visual calendar with basic scheduling

**Days 1-3: Calendar Backend**
- Calendar API endpoints
  - Get lessons for date range
  - Filter by teacher, location, room
  - Get teacher schedule
- Basic conflict detection
  - Teacher double-booking prevention
  - Room double-booking prevention
- Reschedule endpoint (without drag-and-drop yet)

**Days 4-5: Calendar Frontend**
- Install and configure react-big-calendar
- Calendar view showing all lessons
  - Color-coded by lesson type
  - Show teacher, room, enrolled students
- Click lesson to view details
- Filter by location, teacher, week

**Deliverables:**
- ✅ Calendar displays all lessons
- ✅ Can filter by teacher and location
- ✅ Conflict detection prevents double-booking
- ✅ Basic reschedule functionality

---

### WEEK 5: Attendance & Family Accounts
**Goal**: Mark attendance, create family accounts

**Days 1-2: Attendance System**
- Mark attendance endpoint
  - Mark present/absent
  - Add notes per student
  - Absence reasons (sick, holiday, school camp, etc.)
- Attendance history per student
- Attendance report per lesson
- Teacher attendance interface (frontend)

**Days 3-4: Family Accounts**
- Family group creation (Parent)
- Add multiple children to family
- Family schedule view (all children's lessons)
- Parent dashboard showing:
  - All children
  - Combined schedule
  - Upcoming lessons

**Day 5: Teacher Dashboard**
- Teacher view of assigned lessons
- Mark attendance interface
- View enrolled students
- View weekly schedule

**Deliverables:**
- ✅ Teachers mark attendance after each lesson
- ✅ Parents create family accounts
- ✅ Parents add multiple children
- ✅ Family schedule shows all children's lessons
- ✅ Teacher dashboard functional

---

### WEEK 6: Payments & Invoicing
**Goal**: Stripe integration for term-based billing

**Days 1-2: Stripe Integration**
- Stripe account setup
- Payment intent creation
- Stripe webhook handler
- Payment confirmation flow

**Days 3-4: Invoicing System**
- Create invoice per term
  - Calculate total for student's enrolled lessons
  - Generate invoice number
  - Due date tracking
- Payment recording
  - Stripe payments
  - Manual payments (bank transfer, cash, check)
- Payment history per student/family

**Day 5: Payment Frontend**
- Parent payment page
  - View outstanding invoices
  - Pay via Stripe
  - Payment history
- Admin invoice management
  - Create invoices for term
  - Mark manual payments
  - View payment reports

**Deliverables:**
- ✅ Stripe payment integration working
- ✅ Parents can pay invoices online
- ✅ Admin can create term invoices
- ✅ Admin can record manual payments

---

### WEEK 7: File Sharing & Drag-and-Drop Scheduling
**Goal**: Teachers upload files, improved scheduling UX

**Days 1-2: File Upload System**
- DigitalOcean Spaces or S3 setup
- File upload endpoint (Teachers only)
  - Music scores (PDF)
  - Backing tracks (MP3, WAV)
  - Example recordings
- Grant access to enrolled students
- Student resource download
- Track file access

**Days 3-4: Drag-and-Drop Scheduling**
- Install react-big-calendar drag-and-drop addon
- Implement drag event handler
- Real-time conflict checking on drag
- Visual conflict alerts
- Reschedule confirmation
- Send notifications on reschedule

**Day 5: Email Notifications (SendGrid)**
- SendGrid integration
- Email templates:
  - Lesson rescheduled
  - Payment received
  - Invoice created
- Notification queue setup (Bull + Redis)
- Send emails on triggers

**Deliverables:**
- ✅ Teachers upload files (scores, tracks)
- ✅ Students download shared files
- ✅ Drag-and-drop reschedule lessons
- ✅ Email notifications sent

---

### WEEK 8: Polish, Testing & Deployment
**Goal**: Production-ready MVP

**Days 1-2: UI Polish**
- Apply Material 3 design consistently
- Responsive design for tablets
- Loading states and error handling
- User feedback (toasts, confirmations)
- Admin dashboard statistics:
  - Total students
  - Total lessons this week
  - Attendance rate
  - Pending payments

**Days 3-4: Testing & Bug Fixes**
- End-to-end testing of critical flows:
  - User registration → Create lesson → Enroll students → Mark attendance
  - Parent creates family → Adds children → Views schedule
  - Admin creates invoice → Parent pays → Payment recorded
- Security audit:
  - Multi-tenancy isolation
  - Role-based permissions
  - Input validation
- Performance testing
- Bug fixes

**Day 5: Deployment**
- Deploy PostgreSQL to DigitalOcean Managed Database
- Deploy backend to DigitalOcean App Platform
- Deploy frontend to App Platform (static site)
- Configure environment variables
- Set up DigitalOcean Spaces for file storage
- Configure custom domain (if ready)
- Final smoke testing on production

**Deliverables:**
- ✅ MVP deployed to production
- ✅ All critical user flows tested
- ✅ Admin, Teacher, and Parent dashboards complete
- ✅ Music 'n Me team can start manual data entry

---

## MVP Feature Checklist

### ✅ Must Have (Week 1-8)
- [x] User authentication (Admin, Teacher, Parent, Student)
- [x] **Configurable school terms** (4 terms × 10 weeks, editable)
- [x] Location & room management (2 locations, 3 rooms each)
- [x] **Instrument management** (Piano, Guitar, Drums, Singing + custom)
- [x] Lesson creation with correct durations:
  - [x] Group: 1 hour
  - [x] One-on-one: 45 minutes
  - [x] Band: 1 hour
- [x] Student roster (~200 students)
- [x] Bulk enrollment
- [x] Calendar view
- [x] Drag-and-drop rescheduling
- [x] Conflict detection
- [x] Attendance tracking
- [x] Family accounts (single parent, multiple children)
- [x] **Term-based billing**
- [x] Stripe payment integration
- [x] Manual payment recording
- [x] File upload/download (teachers share resources)
- [x] Email notifications (lesson changes, payments)
- [x] Teacher dashboard
- [x] Parent dashboard
- [x] Admin dashboard

### 🔄 Post-MVP (Phase 2)
- [ ] Hybrid lesson model (complex cycle logic)
- [ ] SMS notifications (Twilio)
- [ ] Progression awards
- [ ] Exam requests
- [ ] Scheduled file release
- [ ] Advanced reporting & analytics
- [ ] Mobile app (React Native)
- [ ] Custom branding per school (multi-school expansion)
- [ ] Advanced notification preferences
- [ ] Attendance reports (CSV export)

---

## Risk Mitigation

### Timeline Risks

**Risk**: 8 weeks is aggressive for this feature set
**Mitigation**:
- Focus only on must-have features
- Defer hybrid lessons to Phase 2 (most complex feature)
- Use proven libraries (react-big-calendar, Material-UI)
- Minimize custom UI components

**Risk**: Stripe integration complexity
**Mitigation**:
- Use Stripe Checkout for MVP (simpler than Payment Intents)
- Manual invoicing for first term if needed
- Test thoroughly with Stripe test mode

**Risk**: File upload/storage costs unknown
**Mitigation**:
- Start with DigitalOcean Spaces (predictable pricing)
- Implement file size limits (10MB max)
- Monitor storage usage weekly

### Technical Risks

**Risk**: Drag-and-drop conflicts with touch devices
**Mitigation**:
- Test on tablets early (Week 7)
- Provide alternative reschedule button for touch devices

**Risk**: Multi-tenancy data leakage
**Mitigation**:
- Code review all queries for `schoolId` filter
- Add integration tests for data isolation
- Security audit in Week 8

**Risk**: Email deliverability
**Mitigation**:
- Use SendGrid (high deliverability)
- Set up SPF and DKIM records
- Monitor bounce rates

---

## Success Criteria

### Week 4 Checkpoint
- ✅ Admin can create school with 4 terms
- ✅ Admin can create 2 locations with 3 rooms
- ✅ Admin can create teachers and students
- ✅ Admin can create lessons and enroll students
- ✅ Calendar shows all lessons

### Week 6 Checkpoint
- ✅ Teachers can mark attendance
- ✅ Parents can create families and view schedules
- ✅ Stripe payment test successful
- ✅ Invoices generated for enrolled students

### Week 8 Launch
- ✅ Music 'n Me team trained on system
- ✅ 200 students manually entered
- ✅ All 4 terms configured for 2025
- ✅ Email notifications working
- ✅ Parents can pay invoices online
- ✅ Production deployment stable

---

## Post-MVP Roadmap

### Phase 2 (Weeks 9-12): Advanced Features
- Hybrid lesson model with 1-on-1 booking
- SMS notifications via Twilio
- Scheduled file release
- Progression awards

### Phase 3 (Weeks 13-16): Reporting & Analytics
- Attendance reports
- Revenue reports
- Student progress tracking
- CSV exports

### Phase 4 (Weeks 17-20): Multi-School Expansion
- Custom branding per school
- School onboarding workflow
- Subscription billing for schools
- Marketing website

### Phase 5 (Future): Mobile App
- React Native mobile app
- Push notifications
- Offline mode
- Parent and teacher apps

---

## Development Team Recommendations

For 8-week timeline:
- **1 Full-stack Developer** (you): Backend + Frontend
- **Optional: 1 Part-time Designer** (Weeks 7-8): UI polish, graphics
- **Music 'n Me Team**: Testing, feedback, data entry

Daily standup format:
```
Yesterday: [What was completed]
Today: [What will be worked on]
Blockers: [Any issues]
```

Weekly demo to Music 'n Me:
- End of Week 2: School setup + user management
- End of Week 4: Lessons + calendar
- End of Week 6: Attendance + payments
- End of Week 8: Final MVP

---

## Budget Considerations

### Third-Party Service Costs (Estimate)

**DigitalOcean** (Monthly):
- Managed PostgreSQL (1GB): $15/month
- App Platform (Basic): $5-12/month
- Spaces (250GB): $5/month
- **Total**: ~$25-32/month

**Stripe**:
- 2.9% + 30¢ per transaction
- No monthly fees
- Estimate: $20-50/month (depends on volume)

**SendGrid**:
- Free tier: 100 emails/day
- Essentials: $19.95/month (50,000 emails)
- **Start with free tier**

**Twilio** (Phase 2 only):
- SMS: $0.0075 per message (Australia)
- Defer to Phase 2

**AWS S3 or DigitalOcean Spaces**:
- Included in DigitalOcean Spaces estimate above

**Total Estimated Monthly Cost**: $50-100/month

### One-Time Costs
- Domain name: $10-20/year
- SSL Certificate: Free (Let's Encrypt via DigitalOcean)
- Development tools: Free (VSCode, GitHub, Postman)

---

## Next Steps

1. **Confirm with Music 'n Me**:
   - ✅ Color palette extracted
   - ✅ 8-week timeline confirmed
   - ✅ Specifications documented
   - ⏳ Approve MVP feature list
   - ⏳ Confirm go-live date (Week 8 + 1-2 weeks for data entry)

2. **Week 1 Kickoff** (Start immediately):
   - Set up GitHub repository
   - Initialize project structure
   - Set up DigitalOcean account
   - Create PostgreSQL database
   - Begin Week 1 sprint

3. **Weekly Check-ins with Client**:
   - Friday demos (30 minutes)
   - Gather feedback
   - Adjust priorities if needed

---

**Are you ready to begin Week 1?** 🚀
