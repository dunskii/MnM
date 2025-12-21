# Body Chi Me Review & Recommendations for Music 'n Me

**Date:** December 17, 2025
**Reviewer:** Claude Code
**Purpose:** Analyze Body Chi Me project structure and recommend adaptations for Music 'n Me

---

## Executive Summary

Body Chi Me demonstrates an exceptionally mature development infrastructure with comprehensive custom agents, skills, slash commands, and documentation practices. This review identifies the most valuable patterns to implement in Music 'n Me to accelerate development, maintain quality, and ensure consistency.

**Key Recommendations:**
1. Implement custom slash commands for common workflows (/study, /plan, /report, /qa, /commit)
2. Create specialized agents for hybrid booking, testing, and full-stack development
3. Develop custom skills for booking conflict detection and security validation
4. Adopt structured documentation approach with md/ directory organization
5. Implement comprehensive development workflow and coding standards

---

## 1. Custom Slash Commands (HIGHEST PRIORITY)

### Commands to Implement

#### `/study <topic>`
**Purpose:** Comprehensive research before starting work on any feature
**Body Chi Me Implementation:**
- Uses Explore agent with "very thorough" setting
- Searches docs/, TODO/, md/, progress.md, todo.md, CLAUDE.md
- Compiles findings with architecture, database models, API endpoints, business rules
- **Saves to:** `md/study/<topic>.md`

**Music 'n Me Adaptation:**
```markdown
---
description: Comprehensive research of documentation on a specific topic before starting work
allowed-tools: Task
argument-hint: <topic> (e.g., "hybrid booking", "meet & greet", "Google Drive sync")
---

# Study Topic: $1

I need to thoroughly understand "$1" in the Music 'n Me platform before starting any work.

**Use the Explore agent with "very thorough" setting** to research "$1" by searching:

1. **Documentation:**
   - `Planning/` - all specification files
   - `CLAUDE.md` - project instructions
   - `Planning/12_Week_MVP_Plan.md` - current sprint status

2. **README files:**
   - `apps/backend/README.md`
   - `apps/frontend/README.md`
   - All subdirectory READMEs

3. **Code implementation:**
   - `apps/backend/` - API and business logic
   - `apps/frontend/` - UI components
   - `apps/backend/prisma/schema.prisma` - database schema

4. **Compile findings:**
   - Overview and purpose
   - Architecture and components
   - Database models
   - API endpoints
   - Business rules
   - Current status
   - Key files and locations

5. **Save to:** `md/study/$1.md`
```

#### `/plan <task>`
**Purpose:** Generate detailed implementation plan with actionable todos
**Body Chi Me Implementation:**
- Uses Plan agent
- Creates structured todo breakdown with phases
- Identifies dependencies and risks
- **Saves to:** `md/plan/<task>.md`

**Music 'n Me Adaptation:**
```markdown
---
description: Generate detailed implementation plan with actionable todos
allowed-tools: Task
argument-hint: <task> (e.g., "hybrid booking", "meet & greet system")
---

# Implementation Plan: $1

Generate comprehensive implementation plan for "$1".

**Use the Plan agent** to create structured plan including:

1. **Task Requirements Analysis**
   - Understand scope based on Planning/ documentation
   - Review CLAUDE.md guidelines
   - Identify dependencies

2. **Break Down Into Phases:**
   - Phase 1: Database Layer (Prisma schema)
   - Phase 2: API Layer (REST/tRPC endpoints)
   - Phase 3: Service Layer (Business logic)
   - Phase 4: Frontend Layer (React components)
   - Phase 5: Integration (Connect layers)
   - Phase 6: Testing (Unit, integration, E2E)
   - Phase 7: Documentation

3. **Structured Todo Breakdown:**
   - Specific actionable tasks per phase
   - File paths and locations
   - Dependencies and sequence
   - Success criteria
   - Agent assignments

4. **Risk Assessment:**
   - Challenges and complexity
   - Security considerations
   - Performance implications

**Save to:** `md/plan/$1.md`
```

#### `/qa <topic>`
**Purpose:** Comprehensive code review before completion
**Body Chi Me Implementation:**
- Reviews coding standards, security, plan file verification
- Runs CodeRabbit analysis (wsl bash -l -c "coderabbit review --plain")
- Cross-references with study and plan files
- **Saves to:** `md/review/<topic>.md`

**Music 'n Me Adaptation:**
```markdown
---
description: Comprehensive code review for quality, security, and completeness
allowed-tools: Task
argument-hint: <topic> (e.g., "hybrid booking", "meet & greet")
---

# Code Review: $1

Perform comprehensive code review of "$1".

**Use the general-purpose agent** to review:

1. **Coding Standards:**
   - TypeScript strict mode compliance
   - Error handling
   - Design patterns
   - Code organization
   - Naming conventions

2. **Security:**
   - Input validation
   - schoolId filtering (CRITICAL)
   - XSS/SQL injection prevention
   - Authentication/authorization

3. **Plan File Verification:**
   - Review `md/plan/$1.md` if exists
   - Verify all tasks completed
   - Check dependencies followed
   - Confirm success criteria met

4. **Study File Cross-Reference:**
   - Review `md/study/$1.md` if exists
   - Verify requirements implemented
   - Check architecture matches

5. **Testing Coverage:**
   - Critical functionality tested
   - Edge cases handled
   - Integration validated

**Save to:** `md/review/$1.md`
```

#### `/report <feature>`
**Purpose:** Document completed work and update all documentation
**Body Chi Me Implementation:**
- Uses documentation-management-agent
- Updates roadmap, progress.md, todo.md, CLAUDE.md
- Documents API changes, database changes
- **Saves to:** `md/report/<feature>.md`

**Music 'n Me Adaptation:**
```markdown
---
description: Generate accomplishment report and update all documentation
allowed-tools: Task
argument-hint: <feature> (e.g., "hybrid booking", "meet & greet")
---

# Work Accomplishment Report: $1

Generate comprehensive report and update all documentation.

**Use the documentation-management-agent** (or general-purpose agent) to:

1. **Create Work Report:**
   - Summary of accomplishments
   - Features implemented
   - Bugs fixed
   - Database changes
   - API endpoints added/modified
   - Components created/updated
   - Testing coverage
   - **Save to:** `md/report/$1.md`

2. **Update Project Docs:**
   - `Planning/12_Week_MVP_Plan.md` - mark completed tasks
   - `CLAUDE.md` - update current context
   - `Planning/Technical_Architecture_Overview.md` - if changed
   - Feature-specific docs in Planning/

3. **Update Code Docs:**
   - `apps/backend/README.md`
   - `apps/frontend/README.md`
   - API documentation

4. **Update Configuration:**
   - `.env.example` if new variables
   - `prisma/schema.prisma` if changes

**Deliverables:**
- Comprehensive report
- All updated files listed
- Next steps recommendations
```

#### `/commit <message>`
**Purpose:** Simplified git commit and push workflow
**Body Chi Me Implementation:**
- Stages changes
- Creates commit with proper format
- Pushes to remote
- Verifies success

**Music 'n Me Adaptation:**
```markdown
---
description: Commit and push recent work to remote repository
allowed-tools: Bash
argument-hint: <commit message>
---

# Commit and Push: $1

Commit all recent work with message: "$1"

1. **Stage Changes:**
   git add .

2. **Create Commit:**
   Use message: "$1"
   Include attribution footer

3. **Push:**
   git push origin <current-branch>

4. **Verify:**
   git status
   git log -1
```

---

## 2. Custom Agents (HIGH PRIORITY)

### Agents to Create

#### `hybrid-booking-specialist`
**Purpose:** Specialized agent for Music 'n Me's core feature - hybrid lesson booking
**Based on:** Body Chi Me's `booking-system-architect`

**Responsibilities:**
- Implement hybrid lesson alternating patterns (group/individual weeks)
- Parent booking interface for individual sessions
- Calendar integration with placeholders for hybrid lessons
- Conflict detection for hybrid booking
- Parent-controlled rescheduling (24h notice)
- Teacher availability management

**Configuration:**
```markdown
---
name: hybrid-booking-specialist
description: Specialist for hybrid lesson booking system - Music 'n Me's core feature
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---

You are the Hybrid Booking Specialist for Music 'n Me platform.

## Core Responsibilities
- Hybrid lesson pattern configuration (group/individual alternation)
- Parent booking interface for individual sessions
- Calendar integration with Google Calendar
- Booking conflict detection
- 24-hour rescheduling rules
- Teacher availability management
```

#### `full-stack-developer`
**Purpose:** End-to-end feature implementation
**Based on:** Body Chi Me's `full-stack-developer`

**Responsibilities:**
- Complete feature implementation (database → UI)
- Multi-tenancy (schoolId) enforcement
- React + MUI + Node.js + Prisma
- Type-safe development

**Key Adaptation:**
- **CRITICAL:** Enforce `schoolId` filtering in ALL database queries
- Material-UI v5 (vs Body Chi Me's Shadcn)
- Music 'n Me brand colors and typography

#### `testing-qa-specialist`
**Purpose:** Comprehensive testing across all layers
**Based on:** Body Chi Me's `testing-qa-agent`

**Responsibilities:**
- Unit tests (Jest + React Testing Library)
- Integration tests
- E2E tests (Playwright/Cypress)
- Multi-tenancy security testing (CRITICAL)
- Hybrid booking scenario testing

#### `meet-and-greet-specialist`
**Purpose:** Specialized for meet & greet booking system
**New agent specific to Music 'n Me**

**Responsibilities:**
- Public booking (no auth required)
- Email verification flow
- 2 contacts + emergency contact capture
- Admin approval workflow
- Stripe payment integration
- Registration pre-population

---

## 3. Custom Skills (MEDIUM PRIORITY)

### Skills to Implement

#### `multi-tenancy-validator`
**Purpose:** Validate schoolId filtering in all database queries
**Critical for Music 'n Me security**

**Implementation:**
```typescript
/**
 * Multi-Tenancy Security Validator
 * Ensures all database queries include schoolId filtering
 */

// Validation checks:
1. Scan all Prisma queries for schoolId filter
2. Check tRPC endpoints for tenant isolation
3. Validate API routes enforce school context
4. Test cross-school data access prevention

// Usage:
npm run validate:multi-tenancy
npm run validate:multi-tenancy:detailed
```

#### `hybrid-booking-conflict-detector`
**Purpose:** Detect conflicts in hybrid lesson scheduling
**Based on:** Body Chi Me's `booking-conflict-detector`

**Music 'n Me Specific Checks:**
- Group week vs individual week conflicts
- Parent booking within allowed individual weeks
- 24-hour rescheduling window validation
- Teacher availability for hybrid patterns
- Term-based schedule validation

#### `google-drive-sync-validator`
**Purpose:** Validate Google Drive two-way sync
**New skill specific to Music 'n Me**

**Validation Checks:**
- Folder linking to classes/students
- File upload sync to Drive
- File visibility rules (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- Sync error handling
- Permission validation

#### `meet-and-greet-flow-tester`
**Purpose:** Test complete meet & greet booking flow
**New skill specific to Music 'n Me**

**Test Scenarios:**
- Public booking without authentication
- Email verification flow
- Stripe payment processing
- Admin approval workflow
- Registration pre-population
- Contact data validation

---

## 4. Documentation Structure (HIGH PRIORITY)

### Directory Organization

Body Chi Me uses a sophisticated documentation approach we should adopt:

```
MNM/
├── Planning/                    # Existing - keep current structure
│   ├── 12_Week_MVP_Plan.md
│   ├── Meet_and_Greet_Specification.md
│   └── ...
├── md/                          # NEW - organized work artifacts
│   ├── study/                   # Research findings before work
│   │   ├── hybrid-booking.md
│   │   ├── meet-and-greet.md
│   │   ├── google-drive-sync.md
│   │   └── ...
│   ├── plan/                    # Implementation plans
│   │   ├── hybrid-booking.md
│   │   ├── meet-and-greet.md
│   │   └── ...
│   ├── review/                  # Code review reports
│   │   ├── hybrid-booking.md
│   │   ├── meet-and-greet.md
│   │   └── ...
│   └── report/                  # Completion summaries
│       ├── hybrid-booking.md
│       ├── meet-and-greet.md
│       └── ...
├── docs/                        # NEW - technical documentation
│   ├── architecture.md
│   ├── api-specification.md
│   ├── database-schema.md
│   ├── coding-standards.md
│   ├── development-workflow.md
│   ├── git-workflow.md
│   ├── testing-strategy.md
│   └── ...
├── .claude/
│   ├── agents/                  # Custom agents
│   ├── commands/                # Slash commands
│   ├── skills/                  # Reusable skills
│   └── settings.local.json
```

### Documentation Workflow

1. **Before Starting:** `/study <topic>` → `md/study/<topic>.md`
2. **Planning:** `/plan <task>` → `md/plan/<task>.md`
3. **Implementation:** Build feature following plan
4. **Review:** `/qa <topic>` → `md/review/<topic>.md`
5. **Completion:** `/report <feature>` → `md/report/<feature>.md`

This creates a **complete audit trail** of research → planning → implementation → review → completion.

---

## 5. Development Workflow Enhancements

### Git Workflow

Adopt Body Chi Me's structured branch strategy:

```bash
# Branch naming
feature/MNM-123-hybrid-booking-system
fix/MNM-456-attendance-bug
docs/update-api-spec

# Commit message format
feat(booking): implement hybrid lesson pattern system

- Add database models for hybrid patterns
- Create parent booking interface
- Implement conflict detection
- Add 24-hour rescheduling rules

Closes MNM-123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Code Review Checklist

Create `docs/code-review-checklist.md` based on Body Chi Me's comprehensive template:

```markdown
## Functionality ✅
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Multi-tenancy (schoolId filtering) verified
- [ ] Performance assessed

## Security ✅
- [ ] schoolId filtering in ALL queries (CRITICAL)
- [ ] Input validation
- [ ] No hardcoded secrets
- [ ] XSS/SQL injection prevention
- [ ] Authentication/authorization verified

## Testing ✅
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Multi-tenancy security tests
- [ ] Accessibility tests

## Code Quality ✅
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] No console.log in production
- [ ] Material-UI patterns followed
```

---

## 6. Coding Standards (MEDIUM PRIORITY)

### Create `docs/coding-standards.md`

Adapt Body Chi Me's comprehensive coding standards with Music 'n Me specifics:

**Key Sections:**
1. TypeScript Configuration (strict mode)
2. File Organization
3. Naming Conventions
4. Component Guidelines (Material-UI specific)
5. Error Handling Patterns
6. Performance Guidelines
7. Testing Standards

**Music 'n Me Specific Additions:**
- Multi-tenancy patterns (schoolId enforcement)
- Material-UI v5 component structure
- Prisma multi-tenant query patterns
- Music 'n Me brand color usage
- Monkey Mayhem & Avenir font guidelines

---

## 7. Settings Configuration

### `.claude/settings.local.json`

Create comprehensive permissions file:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(git:*)",
      "Bash(node:*)",
      "Bash(npm run:*)",
      "WebSearch",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:docs.stripe.com)",
      "WebFetch(domain:developers.google.com)"
    ],
    "deny": [],
    "ask": [],
    "directories": {
      "allow": [
        "C:\\Users\\dunsk\\code\\MNM"
      ],
      "deny": [],
      "ask": []
    }
  }
}
```

---

## 8. Implementation Priority

### Phase 1: Foundation (Week 1)
**Priority: CRITICAL**

1. **Create directory structure:**
   ```bash
   mkdir md md/study md/plan md/review md/report
   mkdir docs
   mkdir .claude/agents .claude/commands .claude/skills
   ```

2. **Implement slash commands:**
   - `/study` - Most important for research
   - `/plan` - Essential for structured development
   - `/qa` - Critical for quality
   - `/report` - Important for documentation
   - `/commit` - Nice to have

3. **Create `.claude/settings.local.json`**

### Phase 2: Core Agents (Week 2)
**Priority: HIGH**

1. **Create core agents:**
   - `hybrid-booking-specialist` (MOST IMPORTANT)
   - `full-stack-developer`
   - `testing-qa-specialist`
   - `meet-and-greet-specialist`

2. **Create initial docs:**
   - `docs/coding-standards.md`
   - `docs/development-workflow.md`
   - `docs/git-workflow.md`

### Phase 3: Skills & Validation (Week 3)
**Priority: MEDIUM**

1. **Create critical skills:**
   - `multi-tenancy-validator` (MOST IMPORTANT)
   - `hybrid-booking-conflict-detector`

2. **Create validation scripts:**
   ```json
   // package.json scripts
   "scripts": {
     "validate:multi-tenancy": "ts-node scripts/validate-multi-tenancy.ts",
     "validate:hybrid-booking": "ts-node scripts/validate-hybrid-booking.ts",
     "validate:api-contracts": "ts-node scripts/validate-api-contracts.ts"
   }
   ```

### Phase 4: Documentation (Ongoing)
**Priority: MEDIUM**

1. **Complete docs/ directory:**
   - `docs/architecture.md`
   - `docs/api-specification.md`
   - `docs/database-schema.md`
   - `docs/testing-strategy.md`

2. **Start using workflow:**
   - `/study` before every major feature
   - `/plan` for implementation
   - `/qa` before completion
   - `/report` after completion

---

## 9. Key Lessons from Body Chi Me

### What Worked Well

1. **Structured Workflow:**
   - Study → Plan → Implement → QA → Report creates excellent audit trail
   - Forces research before coding (prevents rework)
   - Documentation stays current

2. **Specialized Agents:**
   - Domain-specific agents (booking, payment, testing) are highly effective
   - Reduces context switching
   - Maintains expertise within domains

3. **Custom Skills:**
   - Reusable validation skills save time
   - Consistent quality checks
   - Easy to run at any time

4. **md/ Directory:**
   - Organized work artifacts
   - Easy to reference past decisions
   - Great for onboarding

### What to Adapt (Not Copy)

1. **Regional Complexity:**
   - Body Chi Me has 6 regional markets (India, Philippines, etc.)
   - Music 'n Me is single-region initially
   - **Adapt:** Remove regional config complexity

2. **Payment Gateways:**
   - Body Chi Me: Razorpay, Xendit, SSLCommerz, Flutterwave
   - Music 'n Me: Stripe only (MVP)
   - **Adapt:** Simpler payment validation

3. **WordPress Migration:**
   - Body Chi Me migrated 14,138 businesses from WordPress
   - Music 'n Me is greenfield
   - **Adapt:** Skip migration-specific tools

4. **Multi-Region Deployment:**
   - Body Chi Me: Separate droplets per region
   - Music 'n Me: Single DigitalOcean deployment
   - **Adapt:** Simpler deployment scripts

---

## 10. Music 'n Me Specific Considerations

### Critical Multi-Tenancy Agent

Create a **dedicated multi-tenancy enforcement agent** that Body Chi Me doesn't need:

```markdown
---
name: multi-tenancy-enforcer
description: Ensures ALL database operations include schoolId filtering
tools: Read, Edit, Grep, Glob
model: sonnet
---

You are the Multi-Tenancy Security Enforcer.

**CRITICAL RESPONSIBILITY:** Ensure NO data leakage between schools.

**Validation Checks:**
1. Every Prisma query MUST filter by schoolId
2. Every tRPC endpoint MUST validate school context
3. Every REST API route MUST enforce tenant isolation
4. Frontend components MUST NOT display cross-school data

**Example Patterns:**
✅ CORRECT:
```typescript
const lessons = await prisma.lesson.findMany({
  where: { schoolId: req.user.schoolId, teacherId: id }
});
```

❌ WRONG:
```typescript
const lessons = await prisma.lesson.findMany({
  where: { teacherId: id }  // MISSING schoolId!
});
```

**Auto-run on:** All database-related code changes
```

### Hybrid Booking Validation

Body Chi Me has general booking, but Music 'n Me's hybrid model is unique:

**Create:** `hybrid-booking-pattern-validator` skill
- Validates alternating group/individual week patterns
- Checks parent booking within correct weeks
- Verifies term-based schedule integrity
- Tests rescheduling rules (24h notice)

---

## 11. Implementation Checklist

### Immediate Actions (This Week)

- [ ] Create `md/` directory structure (study, plan, review, report)
- [ ] Create `docs/` directory
- [ ] Create `.claude/agents/` directory
- [ ] Create `.claude/commands/` directory
- [ ] Create `.claude/skills/` directory
- [ ] Create `.claude/settings.local.json`

### Slash Commands (Priority Order)

- [ ] `/study` - Research before implementation
- [ ] `/plan` - Structured implementation planning
- [ ] `/qa` - Code review and quality checks
- [ ] `/report` - Documentation and completion
- [ ] `/commit` - Simplified git workflow

### Core Agents (Priority Order)

- [ ] `hybrid-booking-specialist` - Core feature
- [ ] `multi-tenancy-enforcer` - Security critical
- [ ] `full-stack-developer` - General development
- [ ] `testing-qa-specialist` - Quality assurance
- [ ] `meet-and-greet-specialist` - Key MVP feature

### Critical Skills (Priority Order)

- [ ] `multi-tenancy-validator` - Prevent data leaks
- [ ] `hybrid-booking-conflict-detector` - Core feature validation
- [ ] `google-drive-sync-validator` - MVP feature validation
- [ ] `meet-and-greet-flow-tester` - MVP feature validation

### Documentation (Priority Order)

- [ ] `docs/coding-standards.md`
- [ ] `docs/development-workflow.md`
- [ ] `docs/git-workflow.md`
- [ ] `docs/architecture.md`
- [ ] `docs/api-specification.md`
- [ ] `docs/database-schema.md`
- [ ] `docs/testing-strategy.md`
- [ ] `docs/code-review-checklist.md`

---

## 12. Success Metrics

### How to Measure Success

1. **Documentation Coverage:**
   - Every major feature has md/study/, md/plan/, md/review/, md/report/
   - Target: 100% for Week 5+ features

2. **Multi-Tenancy Security:**
   - Zero data leakage incidents
   - 100% of queries include schoolId filtering
   - Automated validation in CI/CD

3. **Code Quality:**
   - Consistent coding standards across team
   - All PRs pass QA checklist
   - Test coverage >80% backend, >70% frontend

4. **Development Velocity:**
   - Reduced rework from upfront research (/study)
   - Faster onboarding with comprehensive docs
   - Consistent implementation patterns

---

## 13. Next Steps

1. **Review this document** with the team
2. **Prioritize** which elements to implement first
3. **Create** the directory structure
4. **Implement** slash commands (start with `/study`)
5. **Build** first custom agent (hybrid-booking-specialist)
6. **Test** workflow on Week 5 hybrid booking implementation
7. **Iterate** based on what works

---

## Conclusion

Body Chi Me's sophisticated development infrastructure provides an excellent blueprint for Music 'n Me. The most valuable elements to adopt are:

**Must Have:**
1. Custom slash commands (/study, /plan, /qa, /report)
2. Structured md/ directory for work artifacts
3. Multi-tenancy security validation
4. Hybrid booking specialist agent

**Should Have:**
5. Full-stack developer agent
6. Testing QA specialist agent
7. Comprehensive coding standards
8. Git workflow documentation

**Nice to Have:**
9. Custom skills for validation
10. Meet & greet specialist agent
11. Detailed API specification docs
12. Code review checklists

By implementing these patterns incrementally, Music 'n Me will benefit from:
- **Faster development** through research-first approach
- **Higher quality** through structured QA
- **Better security** through multi-tenancy validation
- **Complete audit trail** of all development decisions
- **Easier onboarding** with comprehensive documentation

The investment in this infrastructure will pay dividends throughout the 12-week MVP timeline and beyond.
