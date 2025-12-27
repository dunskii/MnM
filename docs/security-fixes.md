# Security Fixes - Week 12

**Date:** 2025-12-27
**Status:** IMPLEMENTED
**Priority:** P0 - Critical

---

## Summary

This document describes 5 critical security vulnerabilities that were identified and fixed in the Music 'n Me platform. All issues violated the core multi-tenancy principle:

> **ALWAYS filter by `schoolId` in every database query to prevent data leakage**

---

## Issues Fixed

### Issue 1: Stripe Webhook Missing schoolId Validation (CRITICAL)

**Location:** `apps/backend/src/services/stripe.service.ts`

**Problem:** Webhook handlers didn't validate that the invoice/meetAndGreet belonged to the school specified in the Stripe metadata, allowing potential payment fraud.

**Fix:**
- Added `schoolId` validation in `handleInvoicePaymentComplete()` using `findFirst` with schoolId filter
- Added `schoolId` validation in `handleCheckoutComplete()` for meet & greet payments
- Added defense-in-depth `schoolId` filter on all payment-related database queries

**Files Changed:**
- `apps/backend/src/services/stripe.service.ts`
- `apps/backend/src/services/invoice.service.ts` (recordStripePayment)

---

### Issue 2: Token Revocation Not Checked (CRITICAL)

**Location:** `apps/backend/src/middleware/authenticate.ts`

**Problem:** Access tokens remained valid after session revocation until JWT expiry (up to 24 hours).

**Fix:**
- Added `RevokedToken` model to Prisma schema for token blacklisting
- Added `jti` (JWT ID) claim to all access tokens
- Added revocation check in `authenticate` middleware
- Created `revokeAccessToken()` and `cleanupExpiredRevokedTokens()` functions

**Files Changed:**
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/types/auth.types.ts`
- `apps/backend/src/utils/jwt.ts`
- `apps/backend/src/middleware/authenticate.ts`
- `apps/backend/src/services/token.service.ts`

**Migration Required:**
```bash
npx prisma migrate dev --name add_revoked_token_table
```

---

### Issue 3: Encryption Key Fallback to JWT Secret (HIGH)

**Location:** `apps/backend/src/utils/crypto.ts`

**Problem:** If `ENCRYPTION_KEY` wasn't set, the code fell back to using `JWT_SECRET`. If JWT secret leaked, attacker could also decrypt Google Drive OAuth tokens.

**Fix:**
- Removed fallback to JWT secret
- Made `ENCRYPTION_KEY` required in all environments
- Added key length validation (minimum 32 characters)
- Added to production environment validation

**Files Changed:**
- `apps/backend/src/utils/crypto.ts`
- `apps/backend/src/config/index.ts`
- `apps/backend/.env.example`

**Environment Variable Required:**
```bash
# Generate a secure encryption key
openssl rand -hex 32
```

---

### Issue 4: Session Deletion Missing schoolId Filter (HIGH)

**Location:** `apps/backend/src/services/token.service.ts`

**Problem:** `revokeSession()` and `getActiveSessions()` didn't filter by schoolId, potentially allowing cross-school session manipulation.

**Fix:**
- Added `schoolId` parameter to `revokeSession()`, `getActiveSessions()`, and `revokeOtherSessions()`
- Added `user: { schoolId }` filter to all session queries
- Updated route handlers to pass `req.user.schoolId`

**Files Changed:**
- `apps/backend/src/services/token.service.ts`
- `apps/backend/src/routes/auth.routes.ts`

---

### Issue 5: Overdue Invoice Cron Missing schoolId Filter (HIGH)

**Location:** `apps/backend/src/services/invoice.service.ts`

**Problem:** `updateOverdueInvoices()` updated ALL schools' invoices in a single query, violating multi-tenancy isolation.

**Fix:**
- Created `updateOverdueInvoicesForSchool(schoolId)` for per-school processing
- Created `updateAllOverdueInvoices()` that iterates through schools
- Deprecated old `updateOverdueInvoices()` function
- Added per-school logging for audit trail

**Files Changed:**
- `apps/backend/src/services/invoice.service.ts`

---

## Testing

New test files added:
- `tests/integration/security-fixes.test.ts` - Integration tests for multi-tenancy
- `tests/unit/security/crypto.test.ts` - Encryption key validation tests
- `tests/unit/services/invoice-overdue.test.ts` - Overdue invoice processing tests

---

## Deployment Checklist

Before deploying to production:

- [ ] Generate and set `ENCRYPTION_KEY` environment variable
- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Verify all existing tests pass
- [ ] Run new security tests
- [ ] Monitor authentication error rates post-deployment
- [ ] Monitor webhook success rates post-deployment

---

## Rollback Plan

If issues occur:

1. **Token Revocation:** Can be disabled by commenting out the revocation check in `authenticate.ts` (line 43-52)
2. **Encryption Key:** Set `ENCRYPTION_KEY` to the JWT secret temporarily (not recommended for production)
3. **Database:** The RevokedToken table is additive and can be safely ignored

---

## Compliance Impact

These fixes address:
- **GDPR:** Prevents cross-school data access
- **Privacy Act (Australia):** Ensures school data isolation
- **PCI-DSS:** Secures payment processing
- **COPPA:** Protects student data from unauthorized access
