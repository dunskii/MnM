# Critical Security Fixes - Implementation Plan

**Date:** 2025-12-27
**Priority:** P0 - CRITICAL - Must Fix Before Production
**Total Effort:** 15-22 hours

---

## Executive Summary

This plan addresses 5 critical security vulnerabilities identified in the Music 'n Me platform security audit. All issues violate the core multi-tenancy principle from CLAUDE.md:

> **ALWAYS filter by schoolId in every database query to prevent data leakage**

---

## Implementation Phases

| Phase | Issue | Severity | Effort | Files |
|-------|-------|----------|--------|-------|
| 1 | Encryption Key Fix | HIGH | 1-2 hrs | `crypto.ts`, `config/index.ts` |
| 2 | Session Deletion schoolId | HIGH | 2-3 hrs | `token.service.ts`, `auth.routes.ts` |
| 3 | Overdue Invoice Cron | HIGH | 2-3 hrs | `invoice.service.ts` |
| 4 | Stripe Webhook schoolId | CRITICAL | 4-6 hrs | `stripe.service.ts`, `invoice.service.ts` |
| 5 | Token Revocation | CRITICAL | 6-8 hrs | `authenticate.ts`, `token.service.ts`, `schema.prisma` |
| 6 | Testing | P1 | 4-6 hrs | New test files |
| 7 | Documentation | P2 | 1-2 hrs | `docs/`, `.env.example` |

---

## Phase 1: Encryption Key Fix (Issue 3)

**Estimated Time:** 1-2 hours | **Risk:** LOW

### Problem
`crypto.ts` falls back to JWT secret if ENCRYPTION_KEY not set. If JWT secret leaks, attacker can decrypt Google Drive OAuth tokens.

### Files to Modify

#### 1.1 `apps/backend/src/utils/crypto.ts` (Lines 57-64)

**Current:**
```typescript
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || config.jwt.secret;
  return crypto.createHash('sha256').update(key).digest();
}
```

**New:**
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
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  if (key.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be at least 32 characters. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  return crypto.createHash('sha256').update(key).digest();
}
```

#### 1.2 `apps/backend/src/config/index.ts`

Add ENCRYPTION_KEY to required environment variables validation.

#### 1.3 `.env.example` files

Add:
```env
# SECURITY: Encryption key for sensitive data
# Generate with: openssl rand -hex 32
# CRITICAL: Must be different from JWT_SECRET
ENCRYPTION_KEY=
```

---

## Phase 2: Session Deletion schoolId Fix (Issue 4)

**Estimated Time:** 2-3 hours | **Risk:** LOW

### Problem
`revokeSession()` doesn't filter by schoolId - could allow cross-school session revocation.

### Files to Modify

#### 2.1 `apps/backend/src/services/token.service.ts`

**Update `revokeSession` function:**
```typescript
export async function revokeSession(
  userId: string,
  schoolId: string,  // ADD THIS
  tokenId: string
): Promise<void> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      id: tokenId,
      userId,
      user: { schoolId },  // CRITICAL: Multi-tenancy filter
    },
  });

  if (result.count === 0) {
    console.warn(
      `[Token Service] Session revocation failed - no matching session. ` +
      `userId=${userId}, schoolId=${schoolId}, tokenId=${tokenId}`
    );
  }
}
```

**Update `getActiveSessions` function:**
```typescript
export async function getActiveSessions(
  userId: string,
  schoolId: string  // ADD THIS
): Promise<{ id: string; createdAt: Date; expiresAt: Date }[]> {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      user: { schoolId },  // CRITICAL: Multi-tenancy filter
      expiresAt: { gte: new Date() },
    },
    select: { id: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  });
}
```

#### 2.2 `apps/backend/src/routes/auth.routes.ts`

**Update DELETE /sessions/:sessionId:**
```typescript
await tokenService.revokeSession(
  req.user!.userId,
  req.user!.schoolId,  // ADD THIS
  req.params.sessionId
);
```

**Update GET /sessions:**
```typescript
const sessions = await tokenService.getActiveSessions(
  req.user!.userId,
  req.user!.schoolId  // ADD THIS
);
```

---

## Phase 3: Overdue Invoice Cron Fix (Issue 5)

**Estimated Time:** 2-3 hours | **Risk:** MEDIUM

### Problem
`updateOverdueInvoices()` updates ALL schools without filtering - violates multi-tenancy.

### Files to Modify

#### 3.1 `apps/backend/src/services/invoice.service.ts`

**Add new per-school function:**
```typescript
export async function updateOverdueInvoicesForSchool(
  schoolId: string
): Promise<{ count: number; invoiceIds: string[] }> {
  const now = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      schoolId,  // CRITICAL: Multi-tenancy filter
      status: 'SENT',
      dueDate: { lt: now },
    },
    select: { id: true, invoiceNumber: true },
  });

  if (overdueInvoices.length === 0) {
    return { count: 0, invoiceIds: [] };
  }

  const invoiceIds = overdueInvoices.map(inv => inv.id);

  const result = await prisma.invoice.updateMany({
    where: {
      id: { in: invoiceIds },
      schoolId,  // Defense in depth
    },
    data: { status: 'OVERDUE' },
  });

  console.log(
    `[Invoice Service] Marked ${result.count} invoices as OVERDUE for school ${schoolId}`
  );

  return { count: result.count, invoiceIds };
}

export async function updateAllOverdueInvoices(): Promise<{
  totalCount: number;
  bySchool: Record<string, number>;
}> {
  const schools = await prisma.school.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const bySchool: Record<string, number> = {};
  let totalCount = 0;

  for (const school of schools) {
    try {
      const result = await updateOverdueInvoicesForSchool(school.id);
      bySchool[school.name] = result.count;
      totalCount += result.count;
    } catch (error) {
      console.error(`[Invoice Service] Failed for school ${school.name}:`, error);
    }
  }

  return { totalCount, bySchool };
}
```

**Deprecate old function:**
```typescript
/** @deprecated Use updateAllOverdueInvoices() instead */
export async function updateOverdueInvoices(): Promise<number> {
  console.warn('[Invoice Service] DEPRECATED: Use updateAllOverdueInvoices()');
  const result = await updateAllOverdueInvoices();
  return result.totalCount;
}
```

---

## Phase 4: Stripe Webhook schoolId Validation (Issue 1)

**Estimated Time:** 4-6 hours | **Risk:** HIGH

### Problem
Webhook handlers don't validate schoolId - could allow payment fraud.

### Files to Modify

#### 4.1 `apps/backend/src/services/invoice.service.ts`

**Update `recordStripePayment`:**
```typescript
export async function recordStripePayment(
  schoolId: string,  // ADD THIS
  invoiceId: string,
  amount: number,
  stripePaymentId: string
): Promise<Payment> {
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId,  // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    console.error(
      `[Invoice Service] SECURITY: Invoice not found or school mismatch. ` +
      `invoiceId=${invoiceId}, schoolId=${schoolId}`
    );
    throw new AppError('Invoice not found', 404);
  }

  // ... rest of function unchanged
}
```

#### 4.2 `apps/backend/src/services/stripe.service.ts`

**Update `handleInvoicePaymentComplete`:**
```typescript
const invoice = await prisma.invoice.findFirst({
  where: {
    id: invoiceId,
    schoolId,  // CRITICAL: Multi-tenancy validation
  },
  select: { id: true, total: true, amountPaid: true },
});

if (!invoice) {
  console.error(
    `[Stripe Webhook] SECURITY: Invoice not found or school mismatch. ` +
    `invoiceId=${invoiceId}, schoolId=${schoolId}`
  );
  return;
}
```

**Update `handleCheckoutComplete`:**
```typescript
const meetAndGreet = await prisma.meetAndGreet.findFirst({
  where: {
    id: meetAndGreetId,
    schoolId,  // CRITICAL: Multi-tenancy validation
  },
});

if (!meetAndGreet) {
  console.error(
    `[Stripe Webhook] SECURITY: Meet & greet not found or school mismatch.`
  );
  return;
}
```

---

## Phase 5: Token Revocation Check (Issue 2)

**Estimated Time:** 6-8 hours | **Risk:** HIGH

### Problem
Access tokens remain valid after session revocation until JWT expiry.

### Files to Modify

#### 5.1 `apps/backend/prisma/schema.prisma`

**Add RevokedToken model:**
```prisma
model RevokedToken {
  id        String   @id @default(uuid())
  jti       String   @unique  // JWT ID claim
  userId    String
  schoolId  String
  revokedAt DateTime @default(now())
  expiresAt DateTime

  @@index([jti])
  @@index([expiresAt])
  @@index([userId])
}
```

#### 5.2 `apps/backend/src/utils/jwt.ts`

**Update `signAccessToken` to include JTI:**
```typescript
import { v4 as uuidv4 } from 'uuid';

export function signAccessToken(payload: JWTPayload): string {
  const jti = uuidv4();

  const tokenPayload = {
    ...payload,
    type: 'access',
    jti,  // ADD: JWT ID for revocation tracking
  };

  return jwt.sign(tokenPayload, config.jwt.secret, options);
}
```

#### 5.3 `apps/backend/src/middleware/authenticate.ts`

**Add revocation check after JWT verification:**
```typescript
// SECURITY: Check if token has been revoked
if (payload.jti) {
  const isRevoked = await prisma.revokedToken.findUnique({
    where: { jti: payload.jti },
  });

  if (isRevoked) {
    throw new AppError('Session has been revoked. Please log in again.', 401);
  }
}
```

#### 5.4 `apps/backend/src/services/token.service.ts`

**Add token revocation functions:**
```typescript
export async function revokeAccessToken(
  jti: string,
  userId: string,
  schoolId: string
): Promise<void> {
  const expiresInSeconds = parseExpiryToSeconds(config.jwt.accessExpiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  await prisma.revokedToken.create({
    data: { jti, userId, schoolId, expiresAt },
  });
}

export async function cleanupExpiredRevokedTokens(): Promise<number> {
  const result = await prisma.revokedToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
```

#### 5.5 Run Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_revoked_token_table
```

---

## Phase 6: Testing

**Estimated Time:** 4-6 hours

### New Test Files

1. **`tests/unit/security/crypto.test.ts`**
   - Encryption key validation
   - Encrypt/decrypt functionality

2. **`tests/integration/security/multitenancy-sessions.test.ts`**
   - Session listing only shows own school
   - Session deletion only affects own school

3. **`tests/integration/security/stripe-webhook.test.ts`**
   - Webhook with mismatched schoolId rejected
   - Valid webhook processes correctly

4. **`tests/integration/security/token-revocation.test.ts`**
   - Revoked access token rejected
   - Logout revokes all tokens
   - Cleanup job works correctly

---

## Phase 7: Documentation

**Estimated Time:** 1-2 hours

1. Update `docs/security-fixes.md` with fix details
2. Update `.env.example` files with ENCRYPTION_KEY
3. Update `PROGRESS.md` with completed fixes

---

## Deployment Checklist

- [ ] Apply Prisma migration (RevokedToken table)
- [ ] Generate new ENCRYPTION_KEY for production
- [ ] Deploy backend with all fixes
- [ ] Verify all existing tests pass
- [ ] Run new security tests
- [ ] Monitor authentication error rates
- [ ] Monitor webhook success rates

---

## Success Criteria

1. All 5 security issues addressed with proper schoolId filtering
2. All existing tests pass
3. New security tests added and passing
4. No regression in functionality
5. No significant performance impact (<10ms added latency)
6. ENCRYPTION_KEY required in production
7. Token revocation works immediately

---

## Risk Mitigation

- Keep deprecated function signatures for backward compatibility
- Database migration is additive (new table only)
- Can disable token revocation checking if performance issues
- Monitor API latency after deployment
