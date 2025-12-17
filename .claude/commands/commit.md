---
description: Commit and push recent work to remote repository
allowed-tools: Bash
argument-hint: <commit message> (e.g., "feat(booking): implement hybrid lesson system")
---

# Commit and Push: $1

Commit all recent work with the message: "$1"

Please perform the following git operations:

1. **Review Changes:**
   - Run `git status` to see all changed files
   - Run `git diff` to review changes

2. **Stage All Changes:**
   ```bash
   git add .
   ```

3. **Create Commit:**
   Use conventional commit format with the provided message and attribution:
   ```bash
   git commit -m "$(cat <<'COMMIT_EOF'
$1

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
COMMIT_EOF
)"
   ```

4. **Push to Remote:**
   ```bash
   git push origin $(git branch --show-current)
   ```

5. **Verify Success:**
   ```bash
   git status
   git log -1 --oneline
   ```

**Commit Message Guidelines:**
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Scopes: booking, auth, api, ui, db, etc.
- Keep first line under 72 characters
- Add body if needed with detailed explanation

**Examples:**
- `feat(booking): implement hybrid lesson pattern system`
- `fix(auth): resolve schoolId filtering in login endpoint`
- `docs(api): update meet & greet endpoint documentation`
- `refactor(components): improve lesson card component structure`

**Important:**
- DO NOT skip hooks (--no-verify)
- DO NOT force push to main/master
- Only commit when explicitly asked by the user
