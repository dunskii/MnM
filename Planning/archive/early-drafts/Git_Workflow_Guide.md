# Git Workflow & Branching Strategy

## Overview

This document outlines the Git workflow and branching strategy for the Music School SaaS development project.

---

## Branch Naming Convention

### Main Branches

- **`main`** - Production-ready code. All commits here represent stable, tested features.
- **`develop`** - Development branch. Integration point for features before they go to main.

### Feature Branches

Create feature branches from `develop` with descriptive names:

```
feature/[feature-name]
```

Examples:
- `feature/authentication`
- `feature/lesson-management`
- `feature/payment-integration`
- `feature/student-roster`
- `feature/attendance-tracking`

### Bug Fix Branches

Create bugfix branches from `develop`:

```
bugfix/[bug-description]
```

Examples:
- `bugfix/enrollment-duplicate-issue`
- `bugfix/payment-calculation-error`

### Hotfix Branches

Create hotfix branches from `main` for urgent production fixes:

```
hotfix/[hotfix-description]
```

Examples:
- `hotfix/stripe-webhook-failure`
- `hotfix/auth-token-expiry-bug`

---

## Workflow Process

### 1. Creating a Feature Branch

```powershell
# Update local develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/authentication

# Verify you're on the new branch
git branch
```

### 2. Development Work

```powershell
# Make changes to files
# ... edit files ...

# Stage changes
git add apps/backend/src/services/auth.service.ts

# Or stage all changes
git add .

# Commit with descriptive message
git commit -m "Implement JWT token generation and validation"

# Push to GitHub (creates remote branch if it doesn't exist)
git push origin feature/authentication
```

### 3. Creating a Pull Request (PR)

1. Go to GitHub repository
2. You'll see a prompt: "Compare & pull request" for your recently pushed branch
3. Click "Create pull request"
4. Fill in:
   - **Title**: Clear, concise description of the feature
   - **Description**: Detailed explanation of changes
   - **Link any issues**: Reference relevant issues with `#123`
5. Request review (when working with team members)
6. Submit PR

### 4. Code Review & Merging

```powershell
# If changes requested, make updates on the same branch
git add .
git commit -m "Update authentication to handle token refresh"
git push origin feature/authentication

# GitHub PR automatically updates with new commits

# Once approved, merge PR via GitHub interface
# Click "Merge pull request" on GitHub
```

### 5. Cleanup After Merge

```powershell
# Delete local feature branch
git branch -d feature/authentication

# Delete remote feature branch (GitHub usually offers this option)
# Or manually:
git push origin --delete feature/authentication

# Update local develop branch
git checkout develop
git pull origin develop
```

---

## Commit Message Convention

Follow the Conventional Commits format for clear, organized commit history:

```
[type]([scope]): [subject]

[body]

[footer]
```

### Types

- **feat**: A new feature (e.g., "feat(auth): add JWT token generation")
- **fix**: A bug fix (e.g., "fix(payments): correct invoice calculation")
- **refactor**: Code refactoring without behavior change (e.g., "refactor(lessons): simplify scheduling logic")
- **style**: Code style changes (e.g., "style: format TypeScript files")
- **test**: Adding or updating tests (e.g., "test(auth): add login endpoint tests")
- **chore**: Maintenance tasks (e.g., "chore: update dependencies")
- **docs**: Documentation changes (e.g., "docs: update API endpoint documentation")

### Scope

Indicates which part of the codebase is affected:
- auth
- lessons
- students
- payments
- enrollments
- attendance
- database
- frontend
- etc.

### Subject Line

- Imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Limit to 50 characters

### Examples

```
feat(lessons): add recurring lesson scheduling

Implement logic to create recurring lessons (weekly, biweekly, monthly).
- Calculate recurrence dates based on start date and end date
- Create multiple lesson records for recurrence pattern
- Add recurrenceEndDate field to Lesson model

Closes #42
```

```
fix(payments): resolve Stripe webhook verification failure

Update webhook signature verification to use raw request body instead of parsed JSON.

Fixes #89
```

```
refactor(auth): extract password validation to separate function
```

```
chore: upgrade TypeScript to 5.3
```

---

## Common Workflows

### Starting New Feature Work

```powershell
# Ensure you have latest code
git checkout develop
git pull origin develop

# Create and switch to feature branch
git checkout -b feature/lesson-management

# Start developing
# ... make changes ...

# Commit regularly as you work
git add .
git commit -m "feat(lessons): implement lesson creation endpoint"

# Push to GitHub
git push origin feature/lesson-management
```

### Updating Feature Branch with Latest Develop

If `develop` has changed while you're working on a feature:

```powershell
# Option 1: Rebase (preferred - cleaner history)
git fetch origin
git rebase origin/develop

# If conflicts occur, resolve them, then:
git add .
git rebase --continue

# Force push your updated branch (be careful!)
git push origin feature/lesson-management --force-with-lease

# Option 2: Merge (creates merge commit)
git fetch origin
git merge origin/develop
git push origin feature/lesson-management
```

### Switching Between Branches

```powershell
# List local branches
git branch

# List all branches (including remote)
git branch -a

# Switch to existing branch
git checkout feature/student-roster

# Switch to develop
git checkout develop
```

### Working on Multiple Features

You can have multiple feature branches locally. Switch between them:

```powershell
# Create feature 1
git checkout -b feature/auth
# ... make changes, commit ...
git push origin feature/auth

# Create feature 2 from develop
git checkout develop
git checkout -b feature/lessons
# ... make changes, commit ...
git push origin feature/lessons

# Switch back to feature 1 if needed
git checkout feature/auth

# Switch to feature 2
git checkout feature/lessons
```

---

## Viewing Commit History

### View Recent Commits

```powershell
# Last 10 commits
git log --oneline -10

# Commits by a specific author
git log --author="Andrew" --oneline

# Commits affecting a specific file
git log --oneline -- apps/backend/src/app.ts

# Commits in feature branch not in main
git log --oneline develop..feature/lesson-management

# Detailed view with changes
git log -p -5
```

### View Branch Status

```powershell
# See current branch and status
git status

# See all branches and their tracking info
git branch -vv

# See which branches contain a specific commit
git branch --contains [commit-hash]
```

---

## Undoing Changes

### Before Committing

```powershell
# Discard changes in a file
git checkout -- apps/backend/src/app.ts

# Discard all changes
git checkout -- .

# Unstage a file
git restore --staged apps/backend/src/app.ts

# See what changed
git diff
```

### After Committing (Locally)

```powershell
# View recent commits
git log --oneline -5

# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes
git reset --hard HEAD~1

# Undo last 3 commits
git reset --soft HEAD~3
```

### After Pushing (Use with Caution)

```powershell
# Create a new commit that undoes changes
git revert [commit-hash]
git push origin feature/lesson-management

# Or force-push (only if no one else has pulled)
git reset --hard HEAD~1
git push origin feature/lesson-management --force-with-lease
```

---

## Merging Strategy

### When to Merge to Main

Only merge to `main` when:
- ✅ Feature is complete and tested
- ✅ Pull request is reviewed and approved
- ✅ All automated tests pass (when CI/CD is set up)
- ✅ Code follows project conventions
- ✅ Documentation is updated

### Merge Strategies

1. **Squash and Merge** (Recommended for features)
   - Combines all feature commits into one clean commit on main
   - Use for: Complete features (e.g., "Add lesson management system")
   - Keeps main history clean

2. **Create a Merge Commit** (For releases)
   - Preserves full commit history with a merge commit
   - Use for: Major releases or critical features
   - Creates trail of when features were integrated

3. **Rebase and Merge** (Rarely needed)
   - Replays commits on top of main
   - Use for: Simple, linear features
   - Can complicate history if not careful

---

## GitHub Best Practices

### Pull Request Guidelines

**Good PR Title:**
```
Add JWT authentication and user registration
```

**Poor PR Title:**
```
Fix stuff
Updates
Work in progress
```

**Good PR Description:**
```
## What does this PR do?

Implements JWT-based authentication system with user registration endpoint.

## How was it tested?

- Manual testing with Postman
- Verified JWT token generation and validation
- Tested with expired token scenarios

## Related Issues

Closes #15
Relates to #20

## Checklist

- [x] Code follows project style
- [x] Prisma schema updated
- [x] Database migration created
- [x] Error handling added
- [x] Documented new endpoints
```

### Keeping PRs Focused

- One feature per PR
- Keep PR size reasonable (< 400 lines changed is ideal)
- If PR gets large, break into smaller PRs

### Code Review Checklist

When reviewing your own code before submission:
- [ ] All new code has appropriate error handling
- [ ] Variable names are clear and descriptive
- [ ] No hardcoded values or passwords
- [ ] Database queries are efficient
- [ ] API endpoints are documented
- [ ] Types are properly defined (TypeScript)
- [ ] No console.log statements left in code
- [ ] Code follows naming conventions

---

## Setting Up GitHub Desktop (Optional)

If you prefer a GUI for Git operations:

1. Download from https://desktop.github.com
2. Sign in with GitHub account
3. Clone repository
4. Make changes in VS Code
5. GitHub Desktop shows changes
6. Stage and commit with visual interface
7. Push to GitHub
8. Create PR on GitHub web

Commands also work alongside GitHub Desktop.

---

## Troubleshooting Git Issues

### Lost Commits

```powershell
# Find lost commits using reflog
git reflog

# Recover a lost commit
git checkout [commit-hash]

# Create branch from recovered commit
git checkout -b feature/recovered-branch
```

### Merge Conflicts

```powershell
# When pulling and conflicts occur
git pull origin develop

# Git will mark conflicts with:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# Edit files to resolve conflicts
# Then:
git add .
git commit -m "Resolve merge conflict with develop"
```

### Accidentally Committed to Main

```powershell
# Undo the commit (keep changes)
git reset --soft HEAD~1

# Create a feature branch
git checkout -b feature/my-feature

# Commit to feature branch
git commit -m "feat: add new feature"

# Push feature branch and create PR
git push origin feature/my-feature
```

### Branch Tracking Issues

```powershell
# Set upstream branch
git branch --set-upstream-to=origin/feature/lesson-management

# Or push and set upstream
git push -u origin feature/lesson-management

# View tracking info
git branch -vv
```

---

## Quick Reference Commands

```powershell
# Clone repository
git clone https://github.com/[user]/music-school-saas.git

# Create and switch to feature branch
git checkout -b feature/name

# See status
git status

# Add changes
git add .

# Commit
git commit -m "feat: description"

# Push branch
git push origin feature/name

# Update from develop
git pull origin develop

# Switch branch
git checkout develop

# Delete local branch
git branch -d feature/name

# See commit history
git log --oneline -10

# View changes before committing
git diff
```

---

## Final Notes

- **Commit often**: Small, focused commits are easier to review and debug
- **Push regularly**: Reduces risk of losing work; backs up to GitHub
- **Write clear messages**: Future you (and team members) will appreciate it
- **Review your own code first**: Catch obvious issues before creating a PR
- **Keep branches short-lived**: Feature branches should be merged within a week or two

Happy coding! 🚀
