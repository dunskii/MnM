# Study: Replace 7 instances of `any` type with proper types

**Date:** 2025-12-27
**Status:** Research Complete
**Priority:** Medium (Post-MVP improvement)

---

## Overview

The codebase review identified 7 instances of the `any` type in the backend that should be replaced with proper TypeScript types. Using `any` defeats TypeScript's type safety and can lead to runtime errors that could be caught at compile time.

---

## Identified Instances

### Instance 1: googleDriveSync.job.ts:69

**File:** `apps/backend/src/jobs/googleDriveSync.job.ts`
**Line:** 69

**Current Code:**
```typescript
} catch (error: any) {
  const duration = Date.now() - startTime;
  console.error(`[SyncJob] Job ${job.id} failed after ${duration}ms:`, error.message);
  throw error; // Re-throw to trigger retry
}
```

**Problem:** Accessing `error.message` without type checking

**Fix:**
```typescript
} catch (error: unknown) {
  const duration = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[SyncJob] Job ${job.id} failed after ${duration}ms:`, errorMessage);
  throw error; // Re-throw to trigger retry
}
```

---

### Instance 2: queue.ts:92-93

**File:** `apps/backend/src/config/queue.ts`
**Lines:** 92-93

**Current Code:**
```typescript
const totalSynced = result.reduce((sum: number, r: any) => sum + (r.syncedFolders || 0), 0);
const totalFolders = result.reduce((sum: number, r: any) => sum + (r.totalFolders || 0), 0);
```

**Problem:** Array element type is `any`

**Fix - Add interface at top of file:**
```typescript
interface SyncResultItem {
  syncedFolders?: number;
  totalFolders?: number;
}

// Then in the handler:
const totalSynced = result.reduce((sum: number, r: SyncResultItem) => sum + (r.syncedFolders || 0), 0);
const totalFolders = result.reduce((sum: number, r: SyncResultItem) => sum + (r.totalFolders || 0), 0);
```

---

### Instance 3: email.service.ts:217

**File:** `apps/backend/src/services/email.service.ts`
**Line:** 217

**Current Code:**
```typescript
} catch (error: any) {
  lastError = error;
  console.error(`Email send attempt ${attempt} failed:`, error.message);

  // Don't retry on client errors (4xx)
  if (error.code >= 400 && error.code < 500) {
    break;
  }
```

**Problem:** Accessing `error.code` and `error.message` without type safety

**Fix - Add SendGrid error interface and type guard:**
```typescript
// Add at top of file with other interfaces
interface SendGridError extends Error {
  code?: number;
}

// Update the catch block:
} catch (error: unknown) {
  const sendGridError = error as SendGridError;
  lastError = sendGridError instanceof Error ? sendGridError : new Error(String(error));
  console.error(`Email send attempt ${attempt} failed:`, lastError.message);

  // Don't retry on client errors (4xx) - SendGrid returns error.code for HTTP status
  if (sendGridError.code && sendGridError.code >= 400 && sendGridError.code < 500) {
    break;
  }
```

---

### Instance 4: googleDriveFile.service.ts:84

**File:** `apps/backend/src/services/googleDriveFile.service.ts`
**Line:** 84

**Current Code:**
```typescript
const where: any = {
  schoolId, // CRITICAL: Multi-tenancy filter
  deletedInDrive: filters.includeDeleted ? undefined : false,
};
```

**Problem:** Using `any` for Prisma where clause loses type safety

**Fix:**
```typescript
import { Prisma } from '@prisma/client';

// Change to:
const where: Prisma.GoogleDriveFileWhereInput = {
  schoolId, // CRITICAL: Multi-tenancy filter
  deletedInDrive: filters.includeDeleted ? undefined : false,
};
```

---

### Instance 5: googleDriveFile.service.ts:330

**File:** `apps/backend/src/services/googleDriveFile.service.ts`
**Line:** 330

**Current Code:**
```typescript
} catch (error: any) {
  // Continue if file already deleted from Drive (404)
  if (error.code !== 404 && !error.message?.includes('404')) {
    throw error;
  }
}
```

**Problem:** Accessing `error.code` and `error.message` without type safety

**Fix - Add Google Drive error interface:**
```typescript
// Add interface at top of file (or in a types file)
interface GoogleDriveError extends Error {
  code?: number;
}

// Update catch block:
} catch (error: unknown) {
  const driveError = error as GoogleDriveError;
  // Continue if file already deleted from Drive (404)
  if (driveError.code !== 404 && !driveError.message?.includes('404')) {
    throw error;
  }
}
```

---

### Instance 6: meetAndGreet.service.ts:265

**File:** `apps/backend/src/services/meetAndGreet.service.ts`
**Line:** 265

**Current Code:**
```typescript
const where: any = { schoolId }; // CRITICAL: Multi-tenancy filter
```

**Problem:** Using `any` for Prisma where clause

**Fix:**
```typescript
import { Prisma } from '@prisma/client';

// Change to:
const where: Prisma.MeetAndGreetWhereInput = { schoolId }; // CRITICAL: Multi-tenancy filter
```

---

### Instance 7: googleDriveSync.service.ts:274

**File:** `apps/backend/src/services/googleDriveSync.service.ts`
**Line:** 274

**Current Code:**
```typescript
} catch (error: any) {
  console.error(`Failed to sync school ${schoolId}:`, error.message);
```

**Problem:** Accessing `error.message` without type safety

**Fix:**
```typescript
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to sync school ${schoolId}:`, errorMessage);
```

---

## Summary of Fixes

| # | File | Line | Type of Issue | Recommended Type |
|---|------|------|---------------|------------------|
| 1 | googleDriveSync.job.ts | 69 | catch error | `unknown` + type guard |
| 2 | queue.ts | 92-93 | array reduce | `SyncResultItem` interface |
| 3 | email.service.ts | 217 | catch error | `unknown` + `SendGridError` interface |
| 4 | googleDriveFile.service.ts | 84 | Prisma where | `Prisma.GoogleDriveFileWhereInput` |
| 5 | googleDriveFile.service.ts | 330 | catch error | `unknown` + `GoogleDriveError` interface |
| 6 | meetAndGreet.service.ts | 265 | Prisma where | `Prisma.MeetAndGreetWhereInput` |
| 7 | googleDriveSync.service.ts | 274 | catch error | `unknown` + type guard |

---

## Patterns to Apply

### Pattern 1: Catch Clause Type Safety

Always use `unknown` for catch clauses and type guard for error properties:

```typescript
// BAD
} catch (error: any) {
  console.error(error.message);
}

// GOOD
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(errorMessage);
}
```

### Pattern 2: External API Errors

For external APIs (SendGrid, Google Drive) that return custom error properties, create typed interfaces:

```typescript
interface ExternalServiceError extends Error {
  code?: number;
  status?: number;
  // Add other API-specific properties
}

} catch (error: unknown) {
  const serviceError = error as ExternalServiceError;
  if (serviceError.code === 404) {
    // Handle specific error
  }
}
```

### Pattern 3: Prisma Where Clauses

Always use Prisma's generated types for where clauses:

```typescript
import { Prisma } from '@prisma/client';

// For model-specific where clauses
const where: Prisma.LessonWhereInput = { schoolId };

// For dynamic where building
const where: Prisma.InvoiceWhereInput = {};
if (filters.status) {
  where.status = filters.status;
}
```

---

## Implementation Notes

1. **No breaking changes** - All fixes are internal type improvements
2. **Compile-time safety** - These changes catch errors at compile time vs runtime
3. **Prisma types are auto-generated** - Just import from `@prisma/client`
4. **Pattern consistency** - Apply these patterns to any future code

---

## Related Files

All these files already have proper multi-tenancy security with schoolId filtering. The `any` types are just a TypeScript strictness issue, not a security issue.

---

## Effort Estimate

- **Effort:** ~30 minutes for all 7 fixes
- **Risk:** Low - no functional changes
- **Testing:** Run `npm run build` to verify TypeScript compilation

---

**Next Steps:** Ready to implement these fixes when approved.
