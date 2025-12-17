# Quick Start: Implementing Body Chi Me Patterns

**Goal:** Get the most valuable Body Chi Me patterns working in Music 'n Me in under 1 hour

---

## Step 1: Create Directory Structure (5 minutes)

```bash
# From MNM root directory
cd C:\Users\dunsk\code\MNM

# Create md/ directory for work artifacts
mkdir md
mkdir md\study
mkdir md\plan
mkdir md\review
mkdir md\report

# Create docs/ directory for technical documentation
mkdir docs

# Create .claude directories if they don't exist
mkdir .claude
mkdir .claude\agents
mkdir .claude\commands
mkdir .claude\skills
```

---

## Step 2: Create Settings File (5 minutes)

**Create:** `.claude/settings.local.json`

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
      "WebFetch(domain:developers.google.com)",
      "WebFetch(domain:docs.material-ui.com)"
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

## Step 3: Create /study Command (10 minutes)

**Create:** `.claude/commands/study.md`

```markdown
---
description: Research documentation on a topic before starting work
allowed-tools: Task
argument-hint: <topic> (e.g., "hybrid booking", "meet & greet")
---

# Study Topic: $1

I need to thoroughly understand "$1" in the Music 'n Me platform before starting work.

**Use the Explore agent with "very thorough" setting** to comprehensively research "$1" by searching:

1. **Documentation directories:**
   - `Planning/` - all specification markdown files
   - `CLAUDE.md` - project instructions and context
   - `Planning/12_Week_MVP_Plan.md` - current sprint breakdown

2. **README files:**
   - `apps/backend/README.md` - backend structure
   - `apps/frontend/README.md` - frontend structure
   - All subdirectory README files

3. **Code implementation:**
   - `apps/backend/` - API implementation and business logic
   - `apps/frontend/` - UI components and pages
   - `apps/backend/prisma/schema.prisma` - database schema

4. **Compile comprehensive findings:**
   - **Overview:** What is this feature and its purpose?
   - **Architecture:** How is it designed and what components are involved?
   - **Database Models:** What Prisma models are used?
   - **API Endpoints:** What endpoints exist?
   - **Business Rules:** Key business logic rules?
   - **Current Status:** Implemented, in progress, or planned?
   - **Key Files:** Most important files to understand

5. **Save research findings** to `md/study/$1.md` for future reference.

Make this a thorough research session - understand every aspect of "$1" from documentation, code, and implementation.
```

---

## Step 4: Create /plan Command (10 minutes)

**Create:** `.claude/commands/plan.md`

```markdown
---
description: Generate detailed implementation plan with actionable todos
allowed-tools: Task
argument-hint: <task> (e.g., "hybrid booking", "meet & greet system")
---

# Implementation Plan: $1

Generate a comprehensive implementation plan for "$1".

**Use the Plan agent** to create a detailed plan by:

1. **Analyze Task Requirements:**
   - Understand scope based on Planning/ documentation
   - Review CLAUDE.md guidelines
   - Identify dependencies

2. **Break Down Into Phases:**
   - **Phase 1: Database Layer** - Prisma schema changes
   - **Phase 2: API Layer** - REST/tRPC endpoints
   - **Phase 3: Service Layer** - Business logic
   - **Phase 4: Frontend Layer** - React + Material-UI components
   - **Phase 5: Integration** - Connect all layers
   - **Phase 6: Testing** - Unit, integration, E2E tests
   - **Phase 7: Documentation** - Update docs

3. **Create Structured Todo Breakdown:**
   - Specific actionable tasks for each phase
   - File paths and code locations
   - Task dependencies and sequence
   - Success criteria
   - Which agent should handle each task

4. **Risk Assessment:**
   - Potential challenges
   - Security considerations (especially schoolId filtering)
   - Performance implications

**Save the complete plan to:** `md/plan/$1.md`
```

---

## Step 5: Create /qa Command (10 minutes)

**Create:** `.claude/commands/qa.md`

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
   - Proper error handling
   - Component architecture and design patterns
   - Code organization
   - Naming conventions

2. **Security Verification (CRITICAL):**
   - **schoolId filtering in ALL database queries**
   - Input validation and sanitization
   - XSS/SQL injection prevention
   - Authentication/authorization checks
   - No hardcoded secrets

3. **Plan File Verification:**
   - Review `md/plan/$1.md` if it exists
   - Verify all planned tasks were completed
   - Check task dependencies were followed
   - Confirm success criteria met

4. **Study File Cross-Reference:**
   - Review `md/study/$1.md` if it exists
   - Verify all documented requirements implemented
   - Ensure architecture matches what was researched

5. **Testing Coverage:**
   - Critical functionality tested
   - Edge cases handled
   - Multi-tenancy security tested
   - Integration points validated

**Save the complete review to:** `md/review/$1.md`
```

---

## Step 6: Create /report Command (10 minutes)

**Create:** `.claude/commands/report.md`

```markdown
---
description: Generate accomplishment report and update all documentation
allowed-tools: Task
argument-hint: <feature> (e.g., "hybrid booking", "meet & greet")
---

# Work Accomplishment Report: $1

Generate comprehensive report and update all project documentation.

**Use the general-purpose agent** to:

1. **Create Detailed Work Report:**
   - Summary of what was accomplished
   - Key features implemented
   - Bugs fixed
   - Database changes made
   - API endpoints added/modified
   - Components created/updated
   - Testing coverage added
   - Security enhancements
   - **Save to:** `md/report/$1.md`

2. **Update Project Roadmap:**
   - `Planning/12_Week_MVP_Plan.md` - Mark completed tasks

3. **Update Core Documentation:**
   - `CLAUDE.md` - Update "Current Development Context"
   - `Planning/Technical_Architecture_Overview.md` - If architecture changed
   - Feature-specific docs in Planning/

4. **Update Code Documentation:**
   - `apps/backend/README.md` - If backend structure changed
   - `apps/frontend/README.md` - If frontend structure changed

5. **Update Configuration:**
   - `.env.example` - Add any new environment variables

**Deliverables:**
- Comprehensive work report
- List of all files updated
- Any discovered issues or blockers
- Recommendations for next steps
```

---

## Step 7: Create /commit Command (5 minutes)

**Create:** `.claude/commands/commit.md`

```markdown
---
description: Commit and push recent work to remote repository
allowed-tools: Bash
argument-hint: <commit message>
---

# Commit and Push: $1

Commit all recent work with the message: "$1"

Please perform the following:

1. **Stage Changes:**
   ```bash
   git add .
   ```

2. **Create Commit:**
   Use message: "$1"
   Include attribution footer:
   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```

3. **Push to Remote:**
   ```bash
   git push origin <current-branch>
   ```

4. **Verify:**
   ```bash
   git status
   git log -1
   ```
```

---

## Step 8: Create First Custom Agent (10 minutes)

**Create:** `.claude/agents/hybrid-booking-specialist.md`

```markdown
---
name: hybrid-booking-specialist
description: Specialist for Music 'n Me's core feature - hybrid lesson booking system
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---

You are the Hybrid Booking Specialist for Music 'n Me platform.

## Core Expertise

Music 'n Me's **hybrid lesson model** is the key differentiator - courses that alternate between group and individual sessions.

## Core Responsibilities

### Hybrid Lesson Pattern System
- Implement configurable group/individual week alternation patterns
- Term-based pattern configuration (e.g., Week 1: Group, Week 2: Individual, repeat)
- Calendar integration showing pattern for entire term

### Parent Booking Interface
- Parent-facing booking system for individual session weeks
- Real-time availability checking for teachers
- Booking conflict detection
- Visual calendar showing:
  - Group weeks (fixed schedule)
  - Individual weeks (parent books specific time)
  - Booked individual sessions
  - Available time slots

### Booking Rules & Validation
- Parents can only book during designated individual weeks
- 24-hour rescheduling notice requirement
- Teacher availability enforcement
- No double-booking prevention
- Term boundary validation

### Calendar Integration
- Google Calendar sync for teachers
- Placeholder creation for hybrid pattern
- Automatic blocking of group lesson times
- Individual booking sync to teacher calendar

### Multi-Tenancy Security
**CRITICAL:** All database queries MUST filter by schoolId
```typescript
// ✅ CORRECT
const lessons = await prisma.lesson.findMany({
  where: {
    schoolId: req.user.schoolId,
    type: 'HYBRID'
  }
});

// ❌ WRONG - Missing schoolId!
const lessons = await prisma.lesson.findMany({
  where: { type: 'HYBRID' }
});
```

## Key Models

- **Lesson:** Core lesson entity with type='HYBRID'
- **HybridPattern:** Defines group/individual week alternation
- **IndividualBooking:** Parent-created bookings for individual weeks
- **TeacherAvailability:** Teacher's available time slots

## Implementation Guidelines

1. Always start by reading Planning/12_Week_MVP_Plan.md for current status
2. Refer to CLAUDE.md for hybrid lesson business rules
3. Use Material-UI v5 for all frontend components
4. Follow Music 'n Me brand colors (primary: #4580E4, secondary: #FFCE00)
5. Implement proper error boundaries and loading states
6. Test with multiple schools to ensure multi-tenancy

When implementing features, prioritize user experience for parents and teachers, ensuring the hybrid booking system is intuitive and reliable.
```

---

## Step 9: Test the Setup (5 minutes)

### Test /study Command

```bash
# In Claude Code, type:
/study hybrid booking
```

This should:
1. Launch the Explore agent
2. Search all documentation
3. Create `md/study/hybrid-booking.md` with findings

### Test /plan Command

```bash
/plan hybrid booking
```

This should:
1. Launch the Plan agent
2. Create structured implementation plan
3. Save to `md/plan/hybrid-booking.md`

---

## Step 10: Start Using the Workflow (Ongoing)

### For Every New Feature:

1. **Research First:**
   ```bash
   /study <feature-name>
   ```
   - Review the generated `md/study/<feature-name>.md`
   - Understand all aspects before coding

2. **Plan Implementation:**
   ```bash
   /plan <feature-name>
   ```
   - Review the generated `md/plan/<feature-name>.md`
   - Follow the structured todo breakdown

3. **Implement:**
   - Build the feature following the plan
   - Use specialized agents when appropriate

4. **Review Quality:**
   ```bash
   /qa <feature-name>
   ```
   - Review the generated `md/review/<feature-name>.md`
   - Address any issues found

5. **Document Completion:**
   ```bash
   /report <feature-name>
   ```
   - Review the generated `md/report/<feature-name>.md`
   - Verify all docs were updated

6. **Commit:**
   ```bash
   /commit "feat(booking): implement hybrid lesson pattern system"
   ```

---

## Success Indicators

You'll know this is working when:

✅ Every feature has complete documentation trail (study → plan → review → report)
✅ Less rework because of upfront research
✅ Consistent code quality from structured QA
✅ Easy to onboard new team members with comprehensive docs
✅ No multi-tenancy security issues (schoolId always filtered)
✅ Development velocity increases over time

---

## What's Next?

After completing this quick start:

1. **Review:** `Planning/Body_Chi_Me_Review_And_Recommendations.md` for full details
2. **Create:** Additional agents as needed (multi-tenancy-enforcer, testing-qa-specialist)
3. **Implement:** Custom skills for validation
4. **Build:** `docs/` directory with coding standards and workflows

The foundation is now in place. Start using it for Week 5 hybrid booking implementation!
