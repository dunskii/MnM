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
   - Review CLAUDE.md guidelines and brand requirements
   - Identify dependencies and prerequisites

2. **Break Down Into Phases:**
   - **Phase 1: Database Layer** - Prisma schema changes, migrations
   - **Phase 2: API Layer** - REST/tRPC endpoints with proper validation
   - **Phase 3: Service Layer** - Business logic and utilities
   - **Phase 4: Frontend Layer** - React + Material-UI v5 components
   - **Phase 5: Integration** - Connect all layers, test data flow
   - **Phase 6: Testing** - Unit tests, integration tests, E2E tests
   - **Phase 7: Documentation** - Update docs and README files

3. **Create Structured Todo Breakdown:**
   - Specific actionable tasks for each phase
   - File paths and code locations
   - Task dependencies and sequence
   - Success criteria for each task
   - Which specialized agent should handle each task

4. **Multi-Tenancy Considerations:**
   - Identify all database queries that need schoolId filtering
   - Plan authorization checks for each endpoint
   - Consider cross-school data isolation

5. **Risk Assessment:**
   - Potential challenges and complexity
   - Security considerations (especially schoolId filtering)
   - Performance implications
   - Integration points with existing features

6. **Integration Points:**
   - How this connects with existing features
   - API contract requirements
   - Shared components and utilities
   - Database relationships

**Save the complete plan to:** `md/plan/$1.md`

The plan should be detailed enough that any developer can follow it step-by-step to implement the feature correctly.
