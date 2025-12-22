---
description: Generate accomplishment report and update all documentation
allowed-tools: Task
argument-hint: <feature> (e.g., "hybrid booking", "meet & greet")
---

# Work Accomplishment Report: $1

Generate comprehensive report of completed work and update all project documentation.

**Use the general-purpose agent or documentation-management-agent** to:

1. **Create Detailed Work Report:**
   - Summary of what was accomplished
   - Key features implemented
   - Bugs fixed
   - Database changes made (schema, migrations)
   - API endpoints added/modified
   - Components created/updated
   - Testing coverage added
   - Security enhancements (especially schoolId filtering)
   - Performance improvements
   - Brand compliance (colors, typography)
   - **Save complete report to:** `md/report/$1.md`

2. **Update Progress Tracking Files (CRITICAL):**
   - **`PROGRESS.md`** - Update the following sections:
     - Phase progress percentages
     - Phase status tables (mark tasks Complete/In Progress)
     - Weekly status updates section (add new entry or update current)
     - Critical milestones (mark achieved with date)
     - Test coverage metrics (if tests added)
     - Known issues (add any discovered)
     - Decisions log (add any architectural decisions made)
     - Notes for next session
     - Change history (add entry with date and changes)
   - **`TASKLIST.md`** - Update the following:
     - Mark completed items with [x]
     - Update Progress Summary table at bottom
     - Update overall completion percentage

3. **Update Project Roadmap:**
   - `Planning/roadmaps/12_Week_MVP_Plan.md` - Mark completed tasks, update status
   - Note any dependencies unlocked
   - Identify any blockers discovered

4. **Update Core Documentation:**
   - `CLAUDE.md` - Update "Current Status" section with date and progress
   - `Planning/reference/Technical_Architecture_Overview.md` - If architecture changed
   - Feature-specific docs in Planning/ (e.g., Meet_and_Greet_Specification.md)

5. **Update Code Documentation:**
   - `apps/backend/README.md` - If backend structure changed
   - `apps/frontend/README.md` - If frontend structure changed
   - API documentation for new/modified endpoints
   - Component documentation for new UI components

6. **Update Configuration Files:**
   - `.env.example` - Add any new environment variables
   - `apps/backend/prisma/schema.prisma` - Already updated, verify consistency

7. **Cross-Reference Check:**
   - Ensure PROGRESS.md and TASKLIST.md are aligned
   - Verify phase completion percentages match task completion
   - Check that all three files (PROGRESS.md, TASKLIST.md, 12_Week_MVP_Plan.md) are consistent
   - Ensure all documentation references are consistent
   - Check that linked sections are accurate
   - Verify no broken documentation links

**Deliverables in the report:**
- Comprehensive work summary
- List of ALL files created/modified
- Database schema changes
- API endpoint changes
- New components created
- Test coverage statistics
- Any discovered issues or technical debt
- Recommendations for next steps
- Dependencies on other features
- Estimated time spent vs planned

**Progress Tracking Alignment Checklist:**
- [ ] PROGRESS.md phase percentages updated
- [ ] PROGRESS.md weekly status section updated
- [ ] PROGRESS.md milestones updated with dates
- [ ] TASKLIST.md checkboxes marked complete
- [ ] TASKLIST.md progress summary table updated
- [ ] All three tracking documents show consistent status

The report should be thorough enough that another developer can understand exactly what was accomplished without reading all the code.
