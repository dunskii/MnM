// ===========================================
// Google Drive Rate Limiter & Cache
// ===========================================
// Prevents hitting Google Drive API quotas and improves performance
// Google Drive API limits: 12,000 queries per minute per user
// We use a conservative 100 requests per minute per school

import { AppError } from '../middleware/errorHandler';

// ===========================================
// TYPES
// ===========================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// ===========================================
// RATE LIMITER
// ===========================================

// Rate limit: 100 requests per minute per school (conservative to stay under Google's 12,000/min)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// In-memory rate limit store (per school)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check and update rate limit for a school's Google Drive API usage
 * @param schoolId - School ID to check rate limit for
 * @throws AppError if rate limit exceeded
 */
export function checkRateLimit(schoolId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(schoolId);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window or expired window
    rateLimitStore.set(schoolId, { count: 1, windowStart: now });
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    throw new AppError(
      `Google Drive API rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
      429
    );
  }

  entry.count++;
}

/**
 * Get remaining requests in current window
 */
export function getRateLimitRemaining(schoolId: string): number {
  const now = Date.now();
  const entry = rateLimitStore.get(schoolId);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    return RATE_LIMIT_MAX_REQUESTS;
  }

  return Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
}

/**
 * Reset rate limit for a school (useful for testing)
 */
export function resetRateLimit(schoolId: string): void {
  rateLimitStore.delete(schoolId);
}

// ===========================================
// CACHE
// ===========================================

// Default cache TTL: 5 minutes (as recommended in study doc)
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<unknown>>();

/**
 * Generate cache key for folder listings
 */
export function getFolderCacheKey(schoolId: string, parentId?: string, query?: string): string {
  return `folders:${schoolId}:${parentId || 'root'}:${query || ''}`;
}

/**
 * Generate cache key for file listings
 */
export function getFileCacheKey(schoolId: string, folderId: string): string {
  return `files:${schoolId}:${folderId}`;
}

/**
 * Get cached data if available and not expired
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set data in cache with TTL
 */
export function setInCache<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate cache entries for a school
 * Call this when folder mappings change
 */
export function invalidateSchoolCache(schoolId: string): void {
  const keysToDelete: string[] = [];

  for (const key of cacheStore.keys()) {
    if (key.includes(`:${schoolId}:`)) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    cacheStore.delete(key);
  }
}

/**
 * Invalidate a specific folder's file cache
 */
export function invalidateFolderCache(schoolId: string, folderId: string): void {
  const key = getFileCacheKey(schoolId, folderId);
  cacheStore.delete(key);
}

/**
 * Clear all cache entries (useful for testing)
 */
export function clearCache(): void {
  cacheStore.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}

// ===========================================
// CLEANUP
// ===========================================

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic cleanup of expired cache entries
 */
export function startCacheCleanup(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();

    // Cleanup expired cache entries
    for (const [key, entry] of cacheStore.entries()) {
      if (now > (entry as CacheEntry<unknown>).expiresAt) {
        cacheStore.delete(key);
      }
    }

    // Cleanup old rate limit entries
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Stop periodic cleanup (call on shutdown)
 */
export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
