# Authentication & Security - Music 'n Me

**Last Updated:** December 18, 2025
**Version:** 1.0
**Based on:** Body Chi Me proven implementations

## Overview

This document outlines comprehensive authentication and password security for Music 'n Me platform. Patterns are based on Body Chi Me's industry-leading security implementation.

## Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [Password Security](#password-security)
3. [Password Change Feature](#password-change-feature)
4. [Security Implementation](#security-implementation)
5. [Testing Requirements](#testing-requirements)

---

## Authentication Architecture

### Technology Stack

**Backend:**
- JWT (JSON Web Tokens) for stateless authentication
- bcrypt for password hashing (12 rounds minimum)
- tRPC for secure API routes
- NextAuth.js integration (if needed)

**Frontend:**
- Secure token storage (localStorage with httpOnly flags on server)
- Authorization headers on API requests
- Protected routes with role-based access

### Multi-Tenancy Integration

**CRITICAL:** All authentication MUST enforce schoolId:

```typescript
// ✅ CORRECT - Includes schoolId check
async function getUserWithSchool(userId: string, schoolId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      schoolId: schoolId
    }
  });
}

// ❌ WRONG - No schoolId verification
async function getUserWithSchool(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId }
  });
}
```

---

## Password Security

### Password Requirements

All user passwords MUST meet these requirements:

**Minimum 8 characters** with:
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*)

**Examples:**
- ✅ `MyPassword123!` - Valid
- ✅ `SecurePass@2024` - Valid
- ❌ `password123` - No uppercase
- ❌ `PASSWORD123` - No lowercase
- ❌ `PassWord` - No number or special char

### Password Strength Scoring

Frontend displays real-time strength indicator:

| Score | Label | Color | Feedback |
|-------|-------|-------|----------|
| 0-1 | Very Weak | Red | Unacceptable |
| 2 | Weak | Orange | Poor |
| 3 | Fair | Yellow | Acceptable |
| 4 | Good | Light Green | Good |
| 5 | Strong | Green | Excellent |

**Requirement:**
Minimum score of 4/5 (Good) required for registration and password changes.

### Security Checks

#### 1. Common Password Detection

- Maintains database of 10,000+ common passwords
- Sources: SecLists, HIBP, RockYou breach dataset
- O(1) lookup performance using Set
- Blocks passwords like: "password123", "qwerty", "123456", etc.

#### 2. Personal Information Detection

Prevents passwords containing user's personal information:

- ✅ Email username (e.g., "john" from john@example.com)
- ✅ Email domain (e.g., "example")
- ✅ Name parts (first, middle, last)
- ✅ Phone number sequences
- ✅ Business/school name
- ✅ Username/handle

**Character Substitution Detection:**
- @ → a
- 3 → e
- 1 → i/l
- 5 → s
- 0 → o
- 4 → a

**Example:**
```
User: John Smith, john@musicschool.com
Blocked: "J0hn2024", "Smith@123", "Music!", "John123"
```

#### 3. Have I Been Pwned Breach Checking

Privacy-preserving integration with HIBP:

**Process:**
1. Client-side SHA-1 hashing of password
2. Only first 5 hash characters sent to API (k-anonymity)
3. User's actual password NEVER leaves the system
4. Local validation of full hash against returned ranges
5. 24-hour cache to minimize API calls
6. Graceful degradation on API failures

**Severity Levels:**
- NONE - Not found in breaches
- LOW - Found in 1-10 breaches
- MEDIUM - Found in 11-100 breaches
- HIGH - Found in 100-1,000 breaches
- CRITICAL - Found in 1,000+ breaches

**User Feedback:**
- NONE/LOW: Allow with info message
- MEDIUM/HIGH: Warning displayed, allow to proceed
- CRITICAL: Strong warning, recommend changing

#### 4. Password History

Prevents reuse of last 5 passwords:

```typescript
// Database schema
model User {
  id                String   @id @default(cuid())
  passwordHistory   Json     @default("[]") // Last 5 hashes
  lastPasswordChange DateTime?
  // ... other fields
}

// Implementation: FIFO queue
// New password added to front
// Old passwords removed when exceeding 5
```

---

## Password Change Feature

### User Flow

#### 1. Access Password Change

**Location:** Admin/Parent/Teacher Dashboard → Settings → Change Password

**UI Components:**
- Current password field
- New password field
- Confirm password field
- Password strength indicator
- Requirements checklist
- Password visibility toggles (each field)
- Change button
- Cancel button

#### 2. Validation Process

**Client-side (Real-time):**
- Empty field validation
- Password match validation
- Password strength checking
- Requirement validation
- Display errors/success states

**Server-side (Security):**
- Input sanitization
- Current password verification (bcrypt compare)
- New password strength validation
- All security checks (common, personal info, HIBP)
- Password history check
- Rate limiting enforcement

#### 3. Security Checks

```typescript
// Backend validation order
async function changePassword(
  userId: string,
  schoolId: string,
  currentPassword: string,
  newPassword: string
) {
  // 1. Verify user exists and belongs to school
  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId }
  });
  if (!user) throw new Error('User not found');

  // 2. Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new Error('Current password incorrect');

  // 3. Check rate limiting (5 failures per 15 min)
  checkRateLimiting(userId);

  // 4. Validate password strength
  const strength = evaluatePassword(newPassword, user);
  if (strength.score < 4) throw new Error('Password too weak');

  // 5. Check common passwords
  if (isCommonPassword(newPassword)) {
    throw new Error('Password is too common');
  }

  // 6. Check personal info
  if (containsPersonalInfo(newPassword, user)) {
    throw new Error('Password contains personal information');
  }

  // 7. Check HIBP breach database
  const breached = await checkHIBP(newPassword);
  if (breached.severity === 'CRITICAL') {
    throw new Error('Password found in data breaches');
  }

  // 8. Check password history (last 5)
  if (isInPasswordHistory(newPassword, user)) {
    throw new Error('Cannot reuse recent passwords');
  }

  // 9. Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // 10. Update password and history
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedPassword,
      passwordHistory: {
        // Add to front, keep last 5
      },
      lastPasswordChange: new Date()
    }
  });

  // 11. Invalidate all existing sessions (force re-login)
  await invalidateAllSessions(userId);

  // 12. Log audit trail
  await logAudit({
    userId,
    schoolId,
    action: 'PASSWORD_CHANGED',
    timestamp: new Date()
  });
}
```

#### 4. Rate Limiting

**Failed Attempt Tracking:**
- 5 failed attempts per 15-minute sliding window
- Tracked by both user ID AND IP address
- 30-minute cooldown after max attempts exceeded
- Automatic cleanup of expired attempts
- Clear error messages to user

```typescript
// Rate limiting implementation
interface FailedAttempt {
  userId: string;
  ipAddress: string;
  timestamp: Date;
}

// In-memory tracking with O(1) lookup
const failedAttempts = new Map<string, FailedAttempt[]>();

function checkRateLimiting(userId: string, ipAddress: string): boolean {
  const key = `${userId}:${ipAddress}`;
  const attempts = failedAttempts.get(key) || [];

  // Remove attempts older than 15 minutes
  const recentAttempts = attempts.filter(
    a => Date.now() - a.timestamp.getTime() < 15 * 60 * 1000
  );

  if (recentAttempts.length >= 5) {
    // Check if in cooldown period
    const oldestAttempt = recentAttempts[0];
    const cooldownExpires = new Date(
      oldestAttempt.timestamp.getTime() + 30 * 60 * 1000
    );
    if (Date.now() < cooldownExpires.getTime()) {
      throw new Error(
        `Too many failed attempts. Try again in ${Math.ceil(
          (cooldownExpires.getTime() - Date.now()) / 60000
        )} minutes.`
      );
    }
  }

  failedAttempts.set(key, recentAttempts);
  return true;
}
```

#### 5. Success Handling

**After Successful Change:**
- ✅ Toast notification: "Password changed successfully"
- ✅ Redirect to dashboard
- ✅ Force re-authentication (re-login)
- ✅ Clear form fields
- ✅ Audit log created
- ✅ Email notification sent (optional)

#### 6. Error Handling

**Specific Error Messages:**
- "Current password is incorrect"
- "New password is too weak"
- "Password must not contain your personal information"
- "Password has been found in data breaches"
- "Cannot reuse recent passwords"
- "Too many failed attempts. Try again later"
- "Passwords do not match"
- "Fields cannot be empty"

---

## Security Implementation

### Database Schema

```prisma
model User {
  id                  String   @id @default(cuid())
  schoolId            String   // Multi-tenancy
  email               String
  passwordHash        String   @db.Text
  passwordHistory     Json     @default("[]") // Last 5 password hashes
  lastPasswordChange  DateTime?
  passwordChangedAt   DateTime?

  // Session management
  lastLogin           DateTime?
  loginAttempts       Int      @default(0)
  lockedUntil         DateTime?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relations
  school              School   @relation(fields: [schoolId], references: [id])

  @@index([schoolId])
  @@index([email, schoolId])
}
```

### Password Hashing

**Algorithm:** bcrypt with 12 rounds

```typescript
// Hashing (registration)
const hashedPassword = await bcrypt.hash(password, 12);

// Verification (login/change password)
const isCorrect = await bcrypt.compare(inputPassword, storedHash);
```

**Why bcrypt:**
- Automatically includes salt
- Computational cost (adaptive)
- Industry standard for password storage
- Resistant to GPU/ASIC attacks

### Session Management

**JWT Token Content:**
```typescript
{
  userId: string;
  schoolId: string;
  role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
  iat: number;    // issued at
  exp: number;    // expiration
}
```

**Token Expiration:**
- Access token: 24 hours
- Refresh token: 7 days
- Extended session option: 30 days (requires re-auth periodically)

### Audit Logging

Log all password-related actions:

```typescript
await logAudit({
  userId,
  schoolId,
  action: 'PASSWORD_CHANGED' | 'PASSWORD_RESET' | 'PASSWORD_FAILED_ATTEMPT',
  ipAddress,
  userAgent,
  timestamp: new Date(),
  success: boolean,
  reason?: string // For failures
});
```

---

## Testing Requirements

### Unit Tests

**Backend:**
- ✅ Password strength evaluation
- ✅ Common password detection
- ✅ Personal info detection
- ✅ Password history checking
- ✅ HIBP integration
- ✅ Rate limiting logic
- ✅ Bcrypt hashing/verification

**Frontend:**
- ✅ Password strength indicator
- ✅ Requirement validation display
- ✅ Form validation logic
- ✅ Error message display
- ✅ Loading states
- ✅ Password visibility toggle

### Integration Tests

- ✅ Change password API endpoint
- ✅ Authentication requirement
- ✅ Input validation (Zod schemas)
- ✅ Error responses
- ✅ Success responses
- ✅ Rate limiting enforcement
- ✅ Session invalidation

### E2E Tests

- ✅ Complete happy path
- ✅ Incorrect current password
- ✅ Weak password rejection
- ✅ Password mismatch rejection
- ✅ Rate limiting after failures
- ✅ Breached password warning
- ✅ Success and re-login flow

### Multi-Tenancy Tests

- ✅ Cannot change other school's user password
- ✅ schoolId validation on all endpoints
- ✅ Cross-school data isolation

### Test Coverage

- **Target:** >90% coverage
- **Critical paths:** 100% coverage
- **Security features:** 100% coverage

---

## Implementation Checklist

### Phase 1: Authentication Foundation

- [ ] JWT authentication setup
- [ ] bcrypt integration
- [ ] Login/logout endpoints
- [ ] Token validation middleware
- [ ] Multi-tenancy enforcement

### Phase 2: Password Change Feature

- [ ] UI components (form, strength indicator)
- [ ] Backend endpoint with Zod validation
- [ ] Password strength evaluation
- [ ] Common password detection
- [ ] Personal info detection
- [ ] Rate limiting

### Phase 3: Advanced Security

- [ ] HIBP breach checking integration
- [ ] Password history enforcement
- [ ] Session invalidation
- [ ] Audit logging
- [ ] Comprehensive testing (>90%)
- [ ] Accessibility compliance (WCAG 2.1 AA)

---

## Best Practices

### Do's

✅ Always use bcrypt with 12+ rounds
✅ Enforce strong password requirements
✅ Check HIBP breach database
✅ Implement rate limiting
✅ Log security events
✅ Invalidate sessions on password change
✅ Include schoolId in ALL auth queries
✅ Test multi-tenancy isolation
✅ Use HTTPS everywhere
✅ Rotate secrets regularly

### Don'ts

❌ Store plain text passwords
❌ Use weak hashing (MD5, SHA1)
❌ Hardcode passwords or secrets
❌ Skip rate limiting
❌ Trust client-side validation only
❌ Expose detailed error messages to attackers
❌ Use the same password everywhere
❌ Log passwords or sensitive data
❌ Skip HIBP checks
❌ Forget multi-tenancy security

---

## Related Documentation

- `CLAUDE.md` - Project overview and security rules
- `docs/coding-standards.md` - Security coding practices
- `docs/development-workflow.md` - Development process
- `.claude/agents/multi-tenancy-enforcer.md` - Multi-tenancy security

---

## Success Criteria

Authentication is secure when:
- ✅ All passwords meet strength requirements
- ✅ No common passwords allowed
- ✅ Personal information not used in passwords
- ✅ Breached passwords detected and warned
- ✅ Rate limiting prevents brute force
- ✅ Multi-tenancy completely enforced
- ✅ Audit trail comprehensive
- ✅ Test coverage >90%
- ✅ Sessions properly invalidated
- ✅ All endpoints HTTPS protected

---

**Reference:** Implementation patterns based on Body Chi Me's industry-leading security implementation, tested in production environment.
