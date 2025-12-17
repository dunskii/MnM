---
description: Comprehensive code review for quality, security, and completeness
allowed-tools: Task
argument-hint: <topic> (e.g., "hybrid booking", "meet & greet")
---

# Code Review: $1

Perform comprehensive code review of "$1" to ensure quality, security, and completeness.

**Use the general-purpose agent** to review:

1. **Coding Standards Compliance:**
   - TypeScript strict mode compliance
   - Proper error handling and try-catch blocks
   - Component architecture and design patterns
   - Code organization and structure
   - Naming conventions (camelCase, PascalCase, etc.)
   - Proper type definitions (no 'any' types)
   - Material-UI v5 component patterns

2. **Security Verification (CRITICAL):**
   - **schoolId filtering in ALL database queries** (MOST IMPORTANT)
   - Input validation and sanitization
   - Protection against XSS, SQL injection, CSRF
   - Proper authentication/authorization checks
   - No hardcoded secrets or credentials
   - Secure error messages (no data leakage)
   - Rate limiting where applicable

3. **Plan File Verification:**
   - Review `md/plan/$1.md` if it exists
   - Verify all planned tasks were completed
   - Check task dependencies were followed in correct sequence
   - Confirm all success criteria were met
   - Ensure all phases (database, API, frontend, testing) completed

4. **Study File Cross-Reference:**
   - Review `md/study/$1.md` if it exists
   - Verify all documented requirements are implemented
   - Ensure architecture matches what was researched
   - Check for gaps in implementation vs documentation

5. **Multi-Tenancy Security:**
   - Verify EVERY database query includes schoolId filter
   - Check API endpoints validate school context
   - Ensure no cross-school data exposure
   - Test with multiple school scenarios

6. **Testing Coverage:**
   - Unit tests for critical functionality
   - Integration tests for API endpoints
   - Multi-tenancy security tests
   - Edge cases handled
   - Error scenarios tested

7. **Code Quality:**
   - Performance considerations
   - Database query optimization
   - Proper use of React hooks
   - Component reusability
   - Mobile responsiveness

8. **Brand Compliance:**
   - Music 'n Me colors (primary: #4580E4, secondary: #FFCE00)
   - Typography (Monkey Mayhem for headings, Avenir for body)
   - Material-UI theming applied correctly

**Save the complete review to:** `md/review/$1.md`

The review should identify:
- Critical issues that must be fixed
- Security vulnerabilities
- Coding standard violations
- Missing tests or documentation
- Recommendations for improvements
