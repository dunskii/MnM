// ===========================================
// Drive Rate Limiter & Cache Unit Tests
// ===========================================
// Tests for rate limiting and caching utilities

import {
  checkRateLimit,
  getRateLimitRemaining,
  resetRateLimit,
  getFromCache,
  setInCache,
  getFolderCacheKey,
  getFileCacheKey,
  invalidateSchoolCache,
  invalidateFolderCache,
  clearCache,
  getCacheStats,
} from '../../../src/utils/driveRateLimiter';

describe('Drive Rate Limiter & Cache', () => {
  const testSchoolId = 'test-school-123';

  beforeEach(() => {
    // Reset state before each test
    resetRateLimit(testSchoolId);
    clearCache();
  });

  // ===========================================
  // Rate Limiter Tests
  // ===========================================

  describe('Rate Limiter', () => {
    it('should allow requests under the limit', () => {
      // Should not throw for the first 100 requests
      for (let i = 0; i < 50; i++) {
        expect(() => checkRateLimit(testSchoolId)).not.toThrow();
      }
    });

    it('should throw 429 when rate limit is exceeded', () => {
      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        checkRateLimit(testSchoolId);
      }

      // The 101st request should throw
      expect(() => checkRateLimit(testSchoolId)).toThrow('Google Drive API rate limit exceeded');
    });

    it('should report remaining requests correctly', () => {
      expect(getRateLimitRemaining(testSchoolId)).toBe(100);

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        checkRateLimit(testSchoolId);
      }

      expect(getRateLimitRemaining(testSchoolId)).toBe(90);
    });

    it('should reset rate limit correctly', () => {
      // Make some requests
      for (let i = 0; i < 50; i++) {
        checkRateLimit(testSchoolId);
      }

      expect(getRateLimitRemaining(testSchoolId)).toBe(50);

      // Reset
      resetRateLimit(testSchoolId);

      expect(getRateLimitRemaining(testSchoolId)).toBe(100);
    });

    it('should track rate limits separately per school', () => {
      const school1 = 'school-1';
      const school2 = 'school-2';

      // Make 50 requests for school 1
      for (let i = 0; i < 50; i++) {
        checkRateLimit(school1);
      }

      // Make 30 requests for school 2
      for (let i = 0; i < 30; i++) {
        checkRateLimit(school2);
      }

      expect(getRateLimitRemaining(school1)).toBe(50);
      expect(getRateLimitRemaining(school2)).toBe(70);

      // Reset for cleanup
      resetRateLimit(school1);
      resetRateLimit(school2);
    });
  });

  // ===========================================
  // Cache Tests
  // ===========================================

  describe('Cache', () => {
    it('should generate correct folder cache keys', () => {
      const key1 = getFolderCacheKey('school-1', undefined, undefined);
      const key2 = getFolderCacheKey('school-1', 'parent-123', undefined);
      const key3 = getFolderCacheKey('school-1', 'parent-123', 'search query');

      expect(key1).toBe('folders:school-1:root:');
      expect(key2).toBe('folders:school-1:parent-123:');
      expect(key3).toBe('folders:school-1:parent-123:search query');
    });

    it('should generate correct file cache keys', () => {
      const key = getFileCacheKey('school-1', 'folder-123');
      expect(key).toBe('files:school-1:folder-123');
    });

    it('should store and retrieve cached data', () => {
      const testData = [{ id: '1', name: 'Test Folder' }];
      const cacheKey = 'test-key';

      // Should return null for cache miss
      expect(getFromCache(cacheKey)).toBeNull();

      // Store data
      setInCache(cacheKey, testData);

      // Should return cached data
      expect(getFromCache(cacheKey)).toEqual(testData);
    });

    it('should expire cached data after TTL', async () => {
      const testData = { test: 'data' };
      const cacheKey = 'expiring-key';
      const shortTTL = 50; // 50ms

      setInCache(cacheKey, testData, shortTTL);

      // Should be available immediately
      expect(getFromCache(cacheKey)).toEqual(testData);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be expired
      expect(getFromCache(cacheKey)).toBeNull();
    });

    it('should invalidate all cache entries for a school', () => {
      const school1 = 'school-1';
      const school2 = 'school-2';

      // Add entries for both schools
      setInCache(getFolderCacheKey(school1, undefined, undefined), ['data1']);
      setInCache(getFolderCacheKey(school1, 'parent', undefined), ['data2']);
      setInCache(getFileCacheKey(school1, 'folder'), ['data3']);
      setInCache(getFolderCacheKey(school2, undefined, undefined), ['data4']);

      const statsBefore = getCacheStats();
      expect(statsBefore.size).toBe(4);

      // Invalidate school 1
      invalidateSchoolCache(school1);

      const statsAfter = getCacheStats();
      expect(statsAfter.size).toBe(1); // Only school 2 entry remains
      expect(getFromCache(getFolderCacheKey(school2, undefined, undefined))).toEqual(['data4']);
    });

    it('should invalidate specific folder cache', () => {
      const schoolId = 'school-1';
      const folderId = 'folder-123';

      // Add entries
      setInCache(getFileCacheKey(schoolId, folderId), ['files']);
      setInCache(getFileCacheKey(schoolId, 'other-folder'), ['other-files']);

      expect(getCacheStats().size).toBe(2);

      // Invalidate specific folder
      invalidateFolderCache(schoolId, folderId);

      expect(getCacheStats().size).toBe(1);
      expect(getFromCache(getFileCacheKey(schoolId, folderId))).toBeNull();
      expect(getFromCache(getFileCacheKey(schoolId, 'other-folder'))).toEqual(['other-files']);
    });

    it('should clear all cache entries', () => {
      setInCache('key1', 'value1');
      setInCache('key2', 'value2');
      setInCache('key3', 'value3');

      expect(getCacheStats().size).toBe(3);

      clearCache();

      expect(getCacheStats().size).toBe(0);
    });

    it('should return cache statistics', () => {
      setInCache('key1', 'value1');
      setInCache('key2', 'value2');

      const stats = getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });

  // ===========================================
  // Edge Case Tests
  // ===========================================

  describe('Edge Cases', () => {
    it('should handle empty cache gracefully', () => {
      expect(getFromCache('non-existent-key')).toBeNull();
      expect(getCacheStats().size).toBe(0);
    });

    it('should handle rate limit for new school', () => {
      const newSchool = 'brand-new-school';
      expect(getRateLimitRemaining(newSchool)).toBe(100);
      checkRateLimit(newSchool);
      expect(getRateLimitRemaining(newSchool)).toBe(99);
      resetRateLimit(newSchool);
    });

    it('should handle complex cached data structures', () => {
      const complexData = {
        folders: [
          { id: '1', name: 'Folder 1', files: ['a.pdf', 'b.doc'] },
          { id: '2', name: 'Folder 2', files: [] },
        ],
        metadata: { total: 2, lastSync: new Date().toISOString() },
      };

      setInCache('complex-key', complexData);
      const retrieved = getFromCache('complex-key');

      expect(retrieved).toEqual(complexData);
    });

    it('should handle invalidation of non-existent entries', () => {
      // Should not throw
      expect(() => invalidateSchoolCache('non-existent-school')).not.toThrow();
      expect(() => invalidateFolderCache('non-existent-school', 'non-existent-folder')).not.toThrow();
    });
  });
});
