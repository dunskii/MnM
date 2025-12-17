# Music 'n Me - Specialized Subagents

This directory contains 6 specialized Claude Code subagents for the Music 'n Me SaaS platform development.

## Available Agents

### 1. backend-architect.md
**Purpose:** Backend architecture specialist
**Expertise:** Node.js, TypeScript, Express, Prisma, PostgreSQL, multi-tenancy
**Use for:** API design, database schemas, business logic, security

**Key Focus:**
- Hybrid lesson data modeling
- Multi-tenancy security (schoolId filtering)
- Complex business logic (booking conflicts, invoice calculation)

---

### 2. frontend-developer.md
**Purpose:** Frontend development specialist
**Expertise:** React 18, TypeScript, Material-UI v5, React Query, Vite
**Use for:** UI components, state management, API integration

**Key Focus:**
- Hybrid booking interface
- Calendar with drag-and-drop
- Responsive mobile-first design

---

### 3. ui-designer.md
**Purpose:** UI/UX design specialist
**Expertise:** Material Design 3, component systems, visual hierarchy, accessibility
**Use for:** Interface design, user flows, visual consistency

**Key Focus:**
- Hybrid booking UX (mobile-first)
- Calendar visualization
- Music 'n Me brand guidelines (#116dff primary color)

---

### 4. ux-researcher.md
**Purpose:** User experience research specialist
**Expertise:** Usability testing, user flow validation, friction identification
**Use for:** Validating designs, testing user scenarios, measuring task completion

**Key Focus:**
- Hybrid booking flow validation (CRITICAL - must be under 3 min on mobile)
- Parent, teacher, admin workflow testing
- Mobile experience validation

---

### 5. api-tester.md
**Purpose:** API testing specialist
**Expertise:** Jest, Supertest, integration testing, security testing
**Use for:** Endpoint validation, edge case testing, performance testing

**Key Focus:**
- Multi-tenancy security (every endpoint filters by schoolId)
- Hybrid booking conflict scenarios
- Concurrent request testing
- Invoice calculation accuracy

---

### 6. devops-automator.md
**Purpose:** DevOps and infrastructure specialist
**Expertise:** DigitalOcean, CI/CD, Docker, GitHub Actions, third-party integrations
**Use for:** Infrastructure setup, deployment, Stripe/SendGrid/Google Drive integration

**Key Focus:**
- Production deployment to DigitalOcean
- Stripe webhook security
- Google Drive sync jobs (Bull + Redis)
- SendGrid email queue

---

## How to Use These Agents

### Invoking an Agent

Use phrases like:
```
"Use the backend-architect to design the Prisma schema for hybrid lessons"
"Have the ui-designer create the booking interface mockup"
"Get the api-tester to validate all multi-tenancy security"
```

### Multiple Agents in Sequence

For complex features:
1. **ui-designer** → Design interface
2. **ux-researcher** → Validate design
3. **backend-architect** → Design API
4. **frontend-developer** → Implement UI
5. **api-tester** → Test everything

### Example: Hybrid Booking System (Week 5)

```
1. ui-designer: Design the parent booking interface (mobile-first)
2. ux-researcher: Test with 5 parent scenarios, validate it's under 3 minutes
3. backend-architect: Design the booking API with conflict detection
4. frontend-developer: Implement the booking UI with React Query
5. api-tester: Test concurrent bookings and 24h reschedule rule
```

---

## Agent Priority by Week

### Week 1-2: Setup
- **backend-architect** (heavy)
- **devops-automator** (heavy)
- **api-tester** (medium)

### Week 3: Meet & Greet
- **ui-designer** (heavy)
- **frontend-developer** (heavy)
- **backend-architect** (medium)

### Week 4: Lessons
- **backend-architect** (critical - hybrid model)
- **frontend-developer** (medium)
- **api-tester** (medium)

### Week 5: Hybrid Booking ⭐ ALL HANDS
- **ALL AGENTS ACTIVE**
- This is the most critical week - core feature

### Week 7: Payments
- **devops-automator** (critical - Stripe)
- **backend-architect** (critical - hybrid invoicing)
- **api-tester** (heavy)

### Week 8-9: Google Drive
- **devops-automator** (critical)
- **backend-architect** (heavy)
- **frontend-developer** (medium)

### Week 12: Launch ⭐ ALL HANDS
- **api-tester** (critical - comprehensive testing)
- **ux-researcher** (critical - final validation)
- **devops-automator** (critical - deployment)
- All others (bug fixes, polish)

---

## Quick Reference

| Need to... | Use Agent |
|------------|-----------|
| Design database schema | backend-architect |
| Create API endpoint | backend-architect |
| Check multi-tenancy security | backend-architect + api-tester |
| Build React component | frontend-developer |
| Design user interface | ui-designer |
| Test usability | ux-researcher |
| Test API | api-tester |
| Deploy to production | devops-automator |
| Integrate Stripe/Google Drive | devops-automator |

---

## Configuration

All agents inherit from `base-config.yml` which contains:
- Music 'n Me project details
- Tech stack specifications
- Brand colors (#116dff primary)
- Security rules (schoolId filtering)
- Core features (hybrid lessons, meet & greet, etc.)

---

## Success Criteria

### backend-architect
✅ 0 schoolId leaks (multi-tenancy perfect)
✅ Hybrid booking handles all edge cases
✅ Invoice calculation 100% accurate

### frontend-developer
✅ Hybrid booking UI intuitive
✅ Calendar performant (200+ lessons)
✅ Mobile-first, responsive

### ui-designer
✅ Parent booking flow < 3 minutes
✅ Brand consistency throughout
✅ WCAG AA accessibility met

### ux-researcher
✅ 90% task completion without help
✅ User satisfaction 8+/10
✅ Mobile experience validated

### api-tester
✅ 80% test coverage (100% on critical paths)
✅ All multi-tenancy tests pass
✅ Performance benchmarks met

### devops-automator
✅ Zero-downtime deployments
✅ All integrations secure
✅ Production monitoring active

---

## Emergency Protocols

### If Hybrid Booking Fails Validation (Week 5)
1. STOP implementation
2. ui-designer + ux-researcher redesign
3. Re-test
4. Proceed only when validated

### If Security Issues Found (Week 12)
1. CRITICAL - Fix immediately
2. backend-architect audits all queries
3. api-tester re-tests everything
4. Delay launch if needed

---

**For detailed week-by-week usage, see:** `Planning/Subagent_Deployment_Plan.md`

**Remember:** The hybrid lesson booking system is the core differentiator. Maximum resources should be allocated to Week 5 to ensure this feature is perfect.
