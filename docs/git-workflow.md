# Git Workflow - Music 'n Me

**Last Updated:** December 17, 2025
**Version:** 1.0

## Overview

This document defines the Git branching strategy, commit conventions, and pull request process for Music 'n Me platform.

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Commit Message Format](#commit-message-format)
3. [Pull Request Process](#pull-request-process)
4. [Code Review Guidelines](#code-review-guidelines)
5. [Hotfix Process](#hotfix-process)

## Branching Strategy

### Branch Structure

```
main (production)
├── develop (integration)
├── feature/MNM-123-hybrid-booking (feature development)
├── fix/MNM-456-attendance-bug (bug fixes)
└── hotfix/critical-security-patch (emergency fixes)
```

### Branch Types

#### Main Branches

**main**
- Production-ready code only
- Protected branch (no direct commits)
- All commits must come from PRs
- Deployed to production

**develop**
- Integration branch
- All features merge here first
- Deployed to staging environment
- Should always be stable

#### Supporting Branches

**feature/** - New feature development
```bash
# Format: feature/MNM-<issue-number>-brief-description
git checkout develop
git checkout -b feature/MNM-123-hybrid-booking-system
```

**fix/** - Bug fixes
```bash
# Format: fix/MNM-<issue-number>-brief-description
git checkout develop
git checkout -b fix/MNM-456-attendance-calculation-bug
```

**hotfix/** - Emergency production fixes
```bash
# Format: hotfix/brief-description
git checkout main
git checkout -b hotfix/critical-security-patch
```

## Commit Message Format

### Conventional Commits

Use conventional commit format for all commits:

```
type(scope): description

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring (no functional change)
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### Scopes

- `booking`: Hybrid booking system
- `auth`: Authentication/authorization
- `attendance`: Attendance tracking
- `payment`: Stripe payments and invoicing
- `calendar`: Calendar integration
- `drive`: Google Drive sync
- `meet-greet`: Meet & Greet system
- `ui`: UI components
- `api`: API endpoints
- `db`: Database changes

### Examples

**Feature:**
```
feat(booking): implement hybrid lesson pattern system

- Add database models for hybrid patterns
- Create parent booking interface
- Implement 24-hour rescheduling rule
- Add conflict detection logic

Closes #42

🤖 Generated with Claude Code

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Bug Fix:**
```
fix(attendance): correct attendance calculation for hybrid lessons

Individual sessions were not being counted correctly in attendance
percentages. Updated calculation logic to include all session types.

Fixes #67
```

**Documentation:**
```
docs(api): update hybrid booking API documentation

- Add request/response examples
- Document error codes
- Include multi-tenancy notes
```

**Refactoring:**
```
refactor(auth): extract JWT validation to middleware

No functional changes. Improved code organization and reusability.
```

### Using /commit Command

**Recommended:** Use the `/commit` slash command:

```bash
/commit "feat(booking): implement hybrid lesson booking system"
```

This automatically:
- Stages all changes
- Creates properly formatted commit
- Adds attribution footer
- Pushes to remote
- Verifies success

## Pull Request Process

### Creating a Pull Request

#### 1. Ensure Branch is Up to Date

```bash
git checkout develop
git pull origin develop
git checkout feature/MNM-123-hybrid-booking
git merge develop
# Resolve any conflicts
```

#### 2. Push to Remote

```bash
git push origin feature/MNM-123-hybrid-booking
```

#### 3. Create PR on GitHub

**Title Format:**
```
feat(booking): Implement hybrid lesson booking system
```

**Description Template:**
```markdown
## Summary
Brief description of what this PR accomplishes.

## Changes
- [x] Database models for hybrid patterns
- [x] Parent booking interface
- [x] 24-hour rescheduling rule
- [x] Conflict detection
- [x] Multi-tenancy security verified

## Testing
- [x] Unit tests added for business logic
- [x] Integration tests for API endpoints
- [x] Multi-tenancy security tests
- [x] E2E tests for booking flow
- [x] Manual testing on staging

## Multi-Tenancy Security
- [x] All queries include schoolId filtering
- [x] Authorization checks implemented
- [x] Cross-school access prevented
- [x] Security tests passing

## Screenshots
![Hybrid Booking Calendar](...)
![Parent Booking Interface](...)

## Checklist
- [x] Code follows style guidelines
- [x] Tests pass locally
- [x] Documentation updated
- [x] No console.log statements
- [x] TypeScript errors resolved
- [x] Mobile responsive

Closes #42
```

### PR Requirements

**Before requesting review:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Coverage targets met
- [ ] Multi-tenancy security verified
- [ ] Documentation updated
- [ ] Self-reviewed the code

**PR Size Guidelines:**
- Small: < 200 lines changed ✅ (Preferred)
- Medium: 200-500 lines changed ⚠️
- Large: > 500 lines changed ❌ (Break into smaller PRs)

## Code Review Guidelines

### As a Reviewer

**What to Check:**

1. **Functionality**
   - Code works as intended
   - Edge cases handled
   - Error handling comprehensive

2. **Security** (CRITICAL)
   - ALL database queries include schoolId filtering
   - Input validation present
   - No hardcoded secrets
   - Authorization checks correct

3. **Code Quality**
   - Follows coding standards
   - TypeScript types proper
   - No unnecessary complexity
   - Comments where needed

4. **Testing**
   - Adequate test coverage
   - Multi-tenancy tests included
   - Tests are meaningful

5. **Performance**
   - No N+1 query problems
   - Proper database indexes
   - Efficient algorithms

6. **Brand Compliance**
   - Correct colors (#4580E4, #FFCE00)
   - Typography (Monkey Mayhem, Avenir)
   - Material-UI patterns

**Review Types:**

- **MUST FIX**: Critical issues blocking approval
- **SHOULD FIX**: Important improvements
- **CONSIDER**: Suggestions for future
- **NITPICK**: Minor style issues

**Example Comments:**

```markdown
MUST FIX: Missing schoolId filter
This query needs to filter by schoolId to prevent cross-school data access.

SHOULD FIX: Extract to separate function
This logic would be more maintainable as a separate utility function.

CONSIDER: Add loading state
Consider adding a loading indicator while data fetches.

NITPICK: Use const instead of let
This variable isn't reassigned, so const would be more appropriate.
```

### As a Developer

**Responding to Reviews:**

```markdown
✅ Fixed in commit abc123
Added schoolId filter to lesson query

🔧 Updated in commit def456
Extracted calendar logic to `calendarUtils.ts`

💭 Discussed offline
We agreed to defer this optimization to next sprint

❓ Question
Could you clarify which color should be used for this button?
```

**Making Changes:**

```bash
# Make requested changes
git add .
git commit -m "refactor: address code review feedback

- Extract calendar logic to separate service
- Add missing schoolId filters
- Improve error messages"

git push origin feature/MNM-123-hybrid-booking
```

### Approval Requirements

**PRs require:**
- ✅ 1 approval from team lead OR
- ✅ 2 approvals from team members
- ✅ All CI/CD checks passing
- ✅ No unresolved conversations

## Merging Pull Requests

### Merge Strategy

**Use "Squash and Merge" for feature branches:**
- Keeps main/develop history clean
- One commit per feature
- Preserves detailed history in PR

**Example Squash Commit:**
```
feat(booking): implement hybrid lesson booking system (#42)

* Add database models for hybrid patterns
* Create parent booking interface
* Implement 24-hour rescheduling rule
* Add conflict detection logic
* Include multi-tenancy security tests
```

### After Merging

```bash
# Delete feature branch
git branch -d feature/MNM-123-hybrid-booking
git push origin --delete feature/MNM-123-hybrid-booking

# Update local develop
git checkout develop
git pull origin develop
```

## Hotfix Process

### When to Use Hotfix

Use hotfix branch for:
- Critical production bugs
- Security vulnerabilities
- Data integrity issues

**Do NOT use for:**
- Feature requests
- Non-critical bugs
- Performance improvements (unless critical)

### Hotfix Workflow

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-payment-processing

# 2. Fix the issue
# ... make changes ...

# 3. Test thoroughly
npm test
npm run test:e2e

# 4. Commit
git add .
git commit -m "fix: resolve payment processing timeout

Critical fix for payment confirmation timeout issue
affecting user checkout flow.

Fixes #urgent-123"

# 5. Create PR to main
git push origin hotfix/fix-payment-processing
# Create PR: hotfix → main

# 6. After approval, also merge to develop
# Merge main → develop to keep in sync
```

## Best Practices

### Do's

✅ Pull latest develop before starting work
✅ Use descriptive branch names
✅ Write meaningful commit messages
✅ Keep PRs focused and small
✅ Include tests with code changes
✅ Update documentation
✅ Respond to review comments promptly
✅ Delete merged branches
✅ Use /commit command for consistency

### Don'ts

❌ Commit directly to main or develop
❌ Force push to shared branches
❌ Include unrelated changes in PR
❌ Skip writing tests
❌ Leave console.log statements
❌ Ignore review comments
❌ Merge without approval
❌ Commit secrets or credentials

## Git Commands Reference

### Daily Commands

```bash
# Check status
git status

# Pull latest
git pull origin develop

# Create branch
git checkout -b feature/MNM-123-new-feature

# Stage changes
git add .
git add <specific-file>

# Commit (or use /commit command)
git commit -m "feat(scope): description"

# Push
git push origin feature/MNM-123-new-feature

# Switch branches
git checkout develop

# Update branch with develop
git merge develop

# View history
git log --oneline
```

### Undoing Changes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- <file>
git restore <file>

# Unstage file
git reset HEAD <file>

# Undo commit and changes (DANGEROUS!)
git reset --hard HEAD~1
```

### Stashing

```bash
# Save changes temporarily
git stash

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash apply stash@{0}
```

## Troubleshooting

### Merge Conflicts

```bash
# 1. Pull latest develop
git checkout develop
git pull origin develop

# 2. Try to merge
git checkout feature/MNM-123-my-feature
git merge develop

# 3. If conflicts, resolve manually
# Edit conflicted files
# Look for <<<<<<, ======, >>>>>>

# 4. Stage resolved files
git add <resolved-file>

# 5. Complete merge
git commit
```

### Accidentally Committed to Wrong Branch

```bash
# 1. Undo commit (keep changes)
git reset --soft HEAD~1

# 2. Stash changes
git stash

# 3. Switch to correct branch
git checkout correct-branch

# 4. Apply changes
git stash pop

# 5. Commit
git add .
git commit -m "..."
```

## Success Metrics

Git workflow is effective when:
- ✅ Clean, readable commit history
- ✅ No broken code in main or develop
- ✅ PRs reviewed within 24 hours
- ✅ Merge conflicts are rare
- ✅ Easy to trace feature history
- ✅ Hotfixes deployed quickly

---

**Remember:** Good git workflow prevents issues and makes collaboration smooth. Use the /commit command to ensure consistency and proper formatting.
