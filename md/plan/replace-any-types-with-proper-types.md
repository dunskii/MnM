# Implementation Plan: Replace 7 `any` Types with Proper Types

**Date:** 2025-12-27
**Priority:** Medium (Code Quality Improvement)
**Effort:** ~30 minutes
**Risk:** Low

---

## Overview

Replace 7 instances of the `any` type in the backend codebase with proper TypeScript types to improve type safety and catch potential runtime errors at compile time.

---

## Phase 1: Error Handling Types (5 instances)

### Task 1.1: Fix googleDriveSync.job.ts:69

**File:** `apps/backend/src/jobs/googleDriveSync.job.ts`
**Line:** 69

**Current:**
```typescript
} catch (error: any) {
  const duration = Date.now() - startTime;
  console.error(`[SyncJob] Job ${job.id} failed after ${duration}ms:`, error.message);
  throw error;
}
```

**Change to:**
```typescript
} catch (error: unknown) {
  const duration = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[SyncJob] Job ${job.id} failed after ${duration}ms:`, errorMessage);
  throw error;
}
```

**Success Criteria:** TypeScript compiles without errors

---

### Task 1.2: Fix email.service.ts:217

**File:** `apps/backend/src/services/email.service.ts`
**Lines:** 210, 217-224

**Step 1: Add interface after line 86 (after PaymentReceiptData interface):**
```typescript
interface SendGridError extends Error {
  code?: number;
  response?: {
    body?: unknown;
  };
}
```

**Step 2: Update line 210:**
```typescript
let lastError: Error | null = null;
```

**Step 3: Update catch block (lines 217-224):**
```typescript
} catch (error: unknown) {
  const sendGridError = error as SendGridError;
  lastError = error instanceof Error ? error : new Error(String(error));
  console.error(`Email send attempt ${attempt} failed:`, lastError.message);

  // Don't retry on client errors (4xx) - SendGrid returns error.code for HTTP status
  if (sendGridError.code && sendGridError.code >= 400 && sendGridError.code < 500) {
    break;
  }
```

**Success Criteria:** TypeScript compiles, email sending still works correctly

---

### Task 1.3: Fix googleDriveFile.service.ts:330

**File:** `apps/backend/src/services/googleDriveFile.service.ts`
**Line:** 330

**Step 1: Add interface after line 45 (after FileWithDetails interface):**
```typescript
interface GoogleDriveApiError extends Error {
  code?: number;
}
```

**Step 2: Update catch block (lines 330-335):**
```typescript
} catch (error: unknown) {
  const driveError = error as GoogleDriveApiError;
  // Continue if file already deleted from Drive (404)
  if (driveError.code !== 404 && !driveError.message?.includes('404')) {
    throw error;
  }
}
```

**Success Criteria:** TypeScript compiles, file deletion still handles 404 gracefully

---

### Task 1.4: Fix googleDriveSync.service.ts:274

**File:** `apps/backend/src/services/googleDriveSync.service.ts`
**Line:** 274-275

**Current:**
```typescript
} catch (error: any) {
  console.error(`Failed to sync school ${schoolId}:`, error.message);
```

**Change to:**
```typescript
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to sync school ${schoolId}:`, errorMessage);
```

**Success Criteria:** TypeScript compiles, sync error handling works correctly

---

## Phase 2: Queue Types (1 instance)

### Task 2.1: Fix queue.ts:92-93

**File:** `apps/backend/src/config/queue.ts`
**Lines:** 86-96

**Step 1: Add interface after line 10 (after imports):**
```typescript
// Sync result structure from job processor
interface SyncJobResultItem {
  syncedFolders?: number;
  totalFolders?: number;
}
```

**Step 2: Update lines 92-93:**
```typescript
const totalSynced = result.reduce((sum: number, r: SyncJobResultItem) => sum + (r.syncedFolders || 0), 0);
const totalFolders = result.reduce((sum: number, r: SyncJobResultItem) => sum + (r.totalFolders || 0), 0);
```

**Success Criteria:** TypeScript compiles, queue logging shows correct counts

---

## Phase 3: Prisma Types (2 instances)

### Task 3.1: Fix googleDriveFile.service.ts:84

**File:** `apps/backend/src/services/googleDriveFile.service.ts`
**Line:** 84

**Step 1: Update import on line 11:**
```typescript
import { FileVisibility, UserRole, GoogleDriveFile, Prisma } from '@prisma/client';
```

**Step 2: Update line 84:**
```typescript
const where: Prisma.GoogleDriveFileWhereInput = {
  schoolId, // CRITICAL: Multi-tenancy filter
  deletedInDrive: filters.includeDeleted ? undefined : false,
};
```

**Success Criteria:** TypeScript compiles, file queries work correctly

---

### Task 3.2: Fix meetAndGreet.service.ts:265

**File:** `apps/backend/src/services/meetAndGreet.service.ts`
**Line:** 265

**Step 1: Check if Prisma is already imported, if not add to imports:**
```typescript
import { Prisma } from '@prisma/client';
```

**Step 2: Update line 265:**
```typescript
const where: Prisma.MeetAndGreetWhereInput = { schoolId }; // CRITICAL: Multi-tenancy filter
```

**Success Criteria:** TypeScript compiles, meet & greet queries work correctly

---

## Implementation Order

Execute in this order to minimize conflicts:

1. **Task 3.1** - googleDriveFile.service.ts:84 (Prisma import)
2. **Task 1.3** - googleDriveFile.service.ts:330 (error handling - same file)
3. **Task 3.2** - meetAndGreet.service.ts:265 (Prisma type)
4. **Task 1.2** - email.service.ts:217 (error handling)
5. **Task 1.4** - googleDriveSync.service.ts:274 (error handling)
6. **Task 1.1** - googleDriveSync.job.ts:69 (error handling)
7. **Task 2.1** - queue.ts:92-93 (interface)

---

## Verification Steps

### Step 1: TypeScript Compilation
```bash
cd apps/backend
npm run build
```
Expected: No TypeScript errors

### Step 2: Run Tests
```bash
npm run test
```
Expected: All existing tests pass

### Step 3: Manual Verification (Optional)
- Trigger a Google Drive sync to verify error handling
- Send a test email to verify SendGrid error handling
- Create a meet & greet to verify query works

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `apps/backend/src/jobs/googleDriveSync.job.ts` | 1 catch block |
| `apps/backend/src/config/queue.ts` | 1 interface + 2 lines |
| `apps/backend/src/services/email.service.ts` | 1 interface + 1 variable type + 1 catch block |
| `apps/backend/src/services/googleDriveFile.service.ts` | 1 import update + 1 interface + 2 type annotations |
| `apps/backend/src/services/meetAndGreet.service.ts` | 1 import (if needed) + 1 type annotation |
| `apps/backend/src/services/googleDriveSync.service.ts` | 1 catch block |

**Total: 6 files, ~15 lines changed**

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Type mismatch causing compile errors | Low | Low | Fix any compile errors immediately |
| Runtime behavior change | Very Low | Low | No functional changes, only type annotations |
| Test failures | Very Low | Low | Run test suite after changes |

---

## Rollback Plan

If issues occur, revert the specific file changes:
```bash
git checkout -- apps/backend/src/path/to/file.ts
```

---

## Success Criteria

- [ ] All 7 `any` types replaced with proper types
- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run test` passes with no failures
- [ ] No runtime behavior changes

---

## Agent Assignment

**Recommended Agent:** `backend-architect` or direct implementation

This is a straightforward refactoring task that can be implemented directly without specialized agent assistance.

---

**Ready for implementation.**
