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
   - Other specification files in Planning/

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
   - **Multi-Tenancy:** How does schoolId filtering apply?
   - **Current Status:** Implemented, in progress, or planned?
   - **Related Features:** What other features depend on or relate to this?
   - **Key Files:** Most important files to understand

5. **Save research findings** to `md/study/$1.md` for future reference.

Make this a thorough research session - understand every aspect of "$1" from documentation, code, and implementation before starting any work.
