# Critical Security Issues - Research Study

**Date:** 2025-12-27
**Status:** Research Complete
**Priority:** URGENT - Fix Before Production Launch

---

## Executive Summary

5 critical security issues were identified in the Music 'n Me codebase. All violate the core multi-tenancy rule from CLAUDE.md:

> **ALWAYS filter by `schoolId` in every database query to prevent data leakage**

---

## Issue 1: Stripe Payment Webhook Vulnerability (CRITICAL)

### Location
- `apps/backend/src/services/stripe.service.ts:656-708` (recordStripePayment)
- `apps/backend/src/services/stripe.service.ts:370-568` (handleWebhookEvent)
- `apps/backend/src/routes/payment.routes.ts:117-153` (webhook endpoint)

### Current Problem
```typescript
// recordStripePayment - MISSING schoolId filter
const existing = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  // ❌ NO schoolId filter!
});
```

### Attack Scenario
1. Attacker intercepts/modifies Stripe webhook payload
2. Changes invoiceId to point to another school's invoice
3. Since no schoolId verification, payment gets applied to wrong school
4. Victim school's invoice marked as PAID without actual payment

### Required Fix
```typescript
export async function recordStripePayment(
  schoolId: string,  // ✅ ADD THIS
  invoiceId: string,
  amount: number,
  stripePaymentId: string
): Promise<Payment> {
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId  // ✅ CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }
  // ... rest of function
}
```

### Effort: 4-6 hours

---

## Issue 2: Token Revocation Not Checked (CRITICAL)

### Location
- `apps/backend/src/middleware/authenticate.ts:43-56`
- `apps/backend/src/services/token.service.ts:164-174`

### Current Problem
```typescript
// authenticate.ts - Verifies JWT but NOT revocation status
const user = await prisma.user.findUnique({
  where: { id: payload.userId },
  // ❌ NO CHECK if access token was revoked!
});
```

### Attack Scenario
1. User gets access token with 24h expiry
2. Admin revokes user's session (only deletes RefreshToken)
3. Original access token remains valid for 24 hours
4. User continues making authenticated requests

### Required Fix (Option A: Token Blacklist)
```typescript
// Add to Prisma schema:
model RevokedToken {
  id        String   @id @default(uuid())
  jti       String   @unique  // JWT ID claim
  userId    String
  revokedAt DateTime @default(now())
  expiresAt DateTime

  @@index([jti])
  @@index([expiresAt])
}

// In authenticate.ts:
const isRevoked = await prisma.revokedToken.findUnique({
  where: { jti: payload.jti }
});

if (isRevoked) {
  throw new AppError('Session has been revoked.', 401);
}
```

### Effort: 6-8 hours

---

## Issue 3: Encryption Key Fallback to JWT Secret (HIGH)

### Location
- `apps/backend/src/utils/crypto.ts:61-64`

### Current Problem
```typescript
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || config.jwt.secret;
  // ❌ FALLBACK TO JWT SECRET - BAD!
  return crypto.createHash('sha256').update(key).digest();
}
```

### Attack Scenario
1. Attacker compromises JWT secret (logs, .env leak, etc.)
2. Attacker can forge JWT tokens (known risk)
3. **NEW:** Attacker can also decrypt Google Drive OAuth tokens
4. Attacker gains access to school's Google Drive files

### Required Fix
```typescript
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    if (config.env === 'production') {
      throw new Error(
        'CRITICAL: ENCRYPTION_KEY must be set in production. ' +
        'Generate with: openssl rand -hex 32'
      );
    }
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  return crypto.createHash('sha256').update(key).digest();
}
```

### Effort: 1-2 hours

---

## Issue 4: Auth Session Deletion Lacks schoolId Filter (HIGH)

### Location
- `apps/backend/src/routes/auth.routes.ts:204-222`
- `apps/backend/src/services/token.service.ts:164-174`

### Current Problem
```typescript
// token.service.ts - NO schoolId filter
export async function revokeSession(
  userId: string,
  tokenId: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      id: tokenId,
      userId,
      // ❌ NO schoolId filter!
    },
  });
}
```

### Attack Scenario
1. User A from School A knows User B's userId/tokenId
2. User A calls DELETE /auth/sessions/:sessionId
3. Could potentially revoke User B's session from School B

### Required Fix
```typescript
export async function revokeSession(
  userId: string,
  schoolId: string,  // ✅ ADD THIS
  tokenId: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      id: tokenId,
      userId,
      user: { schoolId },  // ✅ CRITICAL: Multi-tenancy filter
    },
  });
}

// Update route:
await tokenService.revokeSession(
  req.user!.userId,
  req.user!.schoolId,  // ✅ Pass schoolId
  req.params.sessionId
);
```

### Effort: 2-3 hours

---

## Issue 5: updateOverdueInvoices Cron Lacks schoolId (HIGH)

### Location
- `apps/backend/src/services/invoice.service.ts:1002-1016`

### Current Problem
```typescript
export async function updateOverdueInvoices(): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: {
      status: 'SENT',
      dueDate: { lt: now },
      // ❌ NO schoolId filter - updates ALL schools!
    },
    data: { status: 'OVERDUE' },
  });
  return result.count;
}
```

### Impact
- Single query updates invoices across ALL schools
- Violates multi-tenancy isolation principle
- Could expose business data across schools
- No per-school audit trail

### Required Fix
```typescript
export async function updateOverdueInvoicesForSchool(
  schoolId: string
): Promise<number> {
  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: {
      schoolId,  // ✅ CRITICAL: Multi-tenancy filter
      status: 'SENT',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });

  return result.count;
}

// In cron job, iterate per school:
const schools = await prisma.school.findMany({ where: { isActive: true } });
for (const school of schools) {
  await updateOverdueInvoicesForSchool(school.id);
}
```

### Effort: 2-3 hours

---

## Priority Order for Fixes

| Priority | Issue | Risk | Effort |
|----------|-------|------|--------|
| P0 | Issue 2: Token Revocation | Security - Revoked users can still access | 6-8 hrs |
| P0 | Issue 1: Stripe Webhook | Financial - Payment fraud | 4-6 hrs |
| P1 | Issue 3: Encryption Key | Security - OAuth token exposure | 1-2 hrs |
| P1 | Issue 4: Session Deletion | Multi-tenancy violation | 2-3 hrs |
| P1 | Issue 5: Overdue Cron | Multi-tenancy violation | 2-3 hrs |

**Total Effort: 15-22 hours**

---

## Key Files to Modify

1. `apps/backend/src/services/stripe.service.ts`
2. `apps/backend/src/services/invoice.service.ts`
3. `apps/backend/src/services/token.service.ts`
4. `apps/backend/src/middleware/authenticate.ts`
5. `apps/backend/src/utils/crypto.ts`
6. `apps/backend/src/routes/auth.routes.ts`
7. `apps/backend/src/routes/payment.routes.ts`
8. `apps/backend/prisma/schema.prisma` (for RevokedToken model)

---

## Test Requirements

For each fix, add tests to verify:
1. Multi-tenancy isolation (School A cannot affect School B)
2. Happy path still works
3. Error scenarios handled correctly
4. Edge cases covered

---

## Compliance Impact

- **GDPR:** Cross-school data access violations
- **Privacy Act:** School data isolation breaches
- **PCI-DSS:** Payment security vulnerabilities
- **COPPA:** Potential child data exposure

All issues must be fixed before production launch.
