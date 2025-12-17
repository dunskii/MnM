# Development Workflow - Music 'n Me

**Last Updated:** December 17, 2025
**Version:** 1.0

## Overview

This document outlines the complete development workflow for Music 'n Me platform, from feature conception to deployment.

## Table of Contents

1. [Feature Development Lifecycle](#feature-development-lifecycle)
2. [Slash Command Workflow](#slash-command-workflow)
3. [Development Environment](#development-environment)
4. [Code Quality Gates](#code-quality-gates)
5. [Testing Workflow](#testing-workflow)
6. [Deployment Process](#deployment-process)

## Feature Development Lifecycle

### Phase 1: Research (/study)

**Before writing any code, understand the feature completely.**

```bash
/study <feature-name>
```

This command will:
1. Search all Planning/ documentation
2. Review CLAUDE.md for context
3. Examine existing code patterns
4. Identify dependencies
5. Create `md/study/<feature-name>.md` with findings

**What to look for:**
- Feature requirements and scope
- Business rules
- Multi-tenancy considerations
- Integration points
- Existing similar features

**Example:**
```bash
/study hybrid booking
# Creates: md/study/hybrid-booking.md
# Contains: Architecture, business rules, database models, API needs
```

### Phase 2: Planning (/plan)

**Create structured implementation plan.**

```bash
/plan <feature-name>
```

This command will:
1. Break feature into phases (Database → API → Frontend → Testing)
2. Create actionable todo items
3. Identify dependencies and risks
4. Assign tasks to specialized agents
5. Create `md/plan/<feature-name>.md`

**Plan Structure:**
- Phase 1: Database Layer (Prisma schema, migrations)
- Phase 2: API Layer (Endpoints, validation)
- Phase 3: Service Layer (Business logic)
- Phase 4: Frontend Layer (Components, pages)
- Phase 5: Integration (Connect all layers)
- Phase 6: Testing (Unit, integration, E2E)
- Phase 7: Documentation (Update docs)

**Example:**
```bash
/plan hybrid booking
# Creates: md/plan/hybrid-booking.md
# Contains: 7 phases with specific tasks, dependencies, success criteria
```

### Phase 3: Implementation

**Follow the plan step by step.**

#### Step 1: Database Changes

```bash
cd apps/backend

# Edit Prisma schema
# prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_hybrid_booking

# Generate client
npx prisma generate

# Test with seed data
npx prisma db seed
```

**Critical:** Every model MUST have schoolId for multi-tenancy!

#### Step 2: API Development

```typescript
// 1. Create route file
// apps/backend/src/routes/hybridBooking.ts

// 2. Define Zod validation schemas
const bookingSchema = z.object({
  lessonId: z.string().cuid(),
  weekNumber: z.number().min(1),
  dateTime: z.string().datetime(),
});

// 3. Implement endpoints with schoolId filtering
router.post('/bookings', authenticate, async (req, res) => {
  const data = bookingSchema.parse(req.body);

  const booking = await prisma.booking.create({
    data: {
      ...data,
      schoolId: req.user.schoolId // ALWAYS include!
    }
  });

  res.status(201).json(booking);
});

// 4. Add tests
// __tests__/hybridBooking.test.ts
```

#### Step 3: Frontend Development

```bash
cd apps/frontend

# 1. Create API client
# src/api/hybridBooking.ts

# 2. Create React Query hooks
# src/hooks/useHybridBooking.ts

# 3. Build components
# src/components/hybrid-booking/
#   - HybridCalendar.tsx
#   - BookingForm.tsx
#   - WeekPattern.tsx

# 4. Create pages
# src/pages/parent/HybridBooking.tsx

# 5. Add routes
# Update App.tsx
```

#### Step 4: Testing

```bash
# Backend tests
cd apps/backend
npm test
npm run test:coverage

# Frontend tests
cd apps/frontend
npm test
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Phase 4: Quality Assurance (/qa)

**Comprehensive code review before completion.**

```bash
/qa <feature-name>
```

This command will:
1. Check coding standards compliance
2. Verify multi-tenancy security (CRITICAL)
3. Review against plan file
4. Check testing coverage
5. Validate brand compliance
6. Create `md/review/<feature-name>.md`

**Review Checklist:**
- [ ] All schoolId filters in place
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] Material-UI patterns followed
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Loading states added

**Example:**
```bash
/qa hybrid booking
# Creates: md/review/hybrid-booking.md
# Contains: Issues found, security checks, recommendations
```

### Phase 5: Documentation (/report)

**Document completion and update all docs.**

```bash
/report <feature-name>
```

This command will:
1. Create comprehensive work summary
2. Update Planning/12_Week_MVP_Plan.md
3. Update CLAUDE.md
4. Update relevant specs
5. Create `md/report/<feature-name>.md`

**Documentation Updates:**
- Mark tasks complete in roadmap
- Update current development context
- Document new API endpoints
- Update component documentation

**Example:**
```bash
/report hybrid booking
# Creates: md/report/hybrid-booking.md
# Updates: All project documentation
```

### Phase 6: Commit and Push (/commit)

**Commit work with proper message.**

```bash
/commit "feat(booking): implement hybrid lesson booking system"
```

This command will:
1. Stage all changes
2. Create commit with conventional format
3. Push to remote branch
4. Verify success

**Commit Message Format:**
```
type(scope): description

- Bullet points of changes
- Each item on new line

Closes #issue-number

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Slash Command Workflow

### Complete Workflow Example

```bash
# 1. Research the feature
/study hybrid booking
# Review: md/study/hybrid-booking.md

# 2. Create implementation plan
/plan hybrid booking
# Review: md/plan/hybrid-booking.md

# 3. Implement following the plan
# ... do the work ...

# 4. Quality assurance
/qa hybrid booking
# Review: md/review/hybrid-booking.md
# Fix any issues found

# 5. Document completion
/report hybrid booking
# Review: md/report/hybrid-booking.md

# 6. Commit and push
/commit "feat(booking): implement hybrid lesson booking system"
```

### Documentation Trail

This workflow creates complete audit trail:

```
md/
├── study/
│   └── hybrid-booking.md          # What we learned
├── plan/
│   └── hybrid-booking.md          # How we planned it
├── review/
│   └── hybrid-booking.md          # Quality checks
└── report/
    └── hybrid-booking.md          # What we accomplished
```

**Benefits:**
- Complete history of decisions
- Easy to reference past work
- Onboarding new developers
- Understanding feature evolution

## Development Environment

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd MNM

# Install backend dependencies
cd apps/backend
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Daily Development

```bash
# Start backend
cd apps/backend
npm run dev
# Server runs on http://localhost:3000

# Start frontend (new terminal)
cd apps/frontend
npm run dev
# Frontend runs on http://localhost:5173

# Run tests (new terminal)
cd apps/backend
npm run test:watch

cd apps/frontend
npm run test:watch
```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
STRIPE_SECRET_KEY="..."
SENDGRID_API_KEY="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

**Frontend (.env.local):**
```env
VITE_API_URL="http://localhost:3000"
VITE_STRIPE_PUBLIC_KEY="..."
```

## Code Quality Gates

### Pre-Commit Checks

```bash
# Run before every commit
npm run lint          # ESLint check
npm run type-check    # TypeScript check
npm run test          # Run tests
npm run format        # Prettier format
```

### PR Requirements

**Code cannot be merged unless:**
- ✅ All tests passing
- ✅ Coverage targets met (80% backend, 70% frontend)
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Multi-tenancy security verified
- ✅ Code reviewed and approved
- ✅ Documentation updated

### Automated Checks (CI/CD)

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Check coverage
        run: npm run test:coverage
```

## Testing Workflow

### Test-Driven Development (TDD)

**Recommended for critical features:**

1. **Write test first** (it fails - RED)
2. **Write minimal code** to pass test (GREEN)
3. **Refactor** while keeping test passing (REFACTOR)
4. **Repeat**

### Testing Hierarchy

```
                   E2E Tests (Few)
                  /               \
          Integration Tests (Some)
         /                         \
    Unit Tests (Many)
```

**Test Distribution:**
- 70% Unit tests (fast, focused)
- 20% Integration tests (API endpoints)
- 10% E2E tests (critical user journeys)

### Multi-Tenancy Testing

**Every feature MUST include multi-tenancy tests:**

```typescript
describe('Multi-Tenancy Security', () => {
  it('should not allow cross-school access', async () => {
    const schoolA = await createTestSchool();
    const schoolB = await createTestSchool();
    const lessonA = await createTestLesson({ schoolId: schoolA.id });

    // School B user should not access School A data
    const userB = { schoolId: schoolB.id };
    await expect(getLesson(lessonA.id, userB)).rejects.toThrow();
  });
});
```

## Deployment Process

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Documentation updated
- [ ] Changelog updated

### Deployment Steps

```bash
# 1. Build backend
cd apps/backend
npm run build

# 2. Run database migrations
npx prisma migrate deploy

# 3. Build frontend
cd apps/frontend
npm run build

# 4. Deploy to DigitalOcean
# (Automated via CI/CD or manual deployment)

# 5. Verify deployment
curl https://api.musicnme.com/health
```

### Post-Deployment

- [ ] Smoke tests on production
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify multi-tenancy isolation

## Best Practices

### Do's

✅ Always use slash commands for workflow
✅ Research before coding (/study)
✅ Plan before implementing (/plan)
✅ Review before committing (/qa)
✅ Document after completion (/report)
✅ Include schoolId in EVERY query
✅ Write tests alongside code
✅ Follow Material-UI patterns
✅ Use brand colors correctly
✅ Mobile-first responsive design

### Don'ts

❌ Skip the /study phase
❌ Code without a plan
❌ Commit without /qa review
❌ Forget multi-tenancy security
❌ Skip writing tests
❌ Use console.log in production
❌ Hardcode values
❌ Skip documentation updates

## Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
sudo service postgresql start
```

**Prisma Client Out of Sync:**
```bash
npx prisma generate
```

**Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

**Tests Failing:**
```bash
# Clear test database
npm run test:db:reset

# Re-run tests
npm test
```

## Success Metrics

Development workflow is effective when:
- ✅ Complete documentation trail for every feature
- ✅ Fewer bugs reaching production
- ✅ Consistent code quality
- ✅ Faster onboarding of new developers
- ✅ Clear understanding of feature evolution
- ✅ No multi-tenancy security issues

---

**Remember:** The workflow exists to maintain quality and prevent issues. Following it saves time in the long run and ensures Music 'n Me remains secure and maintainable.
