// ===========================================
// Queue Configuration (Bull + Redis)
// ===========================================
// Background job processing for Google Drive sync and email notifications
// Uses Bull queue backed by Redis

import Bull from 'bull';
import { config } from './index';

// Sync result structure from job processor
interface SyncJobResultItem {
  syncedFolders?: number;
  totalFolders?: number;
}

// ===========================================
// QUEUE INSTANCES
// ===========================================

/**
 * Email notification queue
 * Handles transactional emails with retry logic
 */
export const emailNotificationQueue = new Bull('email-notifications', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000, // 3 seconds initial delay
    },
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 25, // Keep last 25 failed jobs
  },
});

/**
 * Google Drive sync queue
 * Handles periodic and on-demand folder synchronization
 */
export const googleDriveSyncQueue = new Bull('google-drive-sync', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
});

// ===========================================
// QUEUE EVENT HANDLERS
// ===========================================

// Email notification queue events
emailNotificationQueue.on('error', (error) => {
  console.error('[Queue] Email notification queue error:', error);
});

emailNotificationQueue.on('failed', (job, error) => {
  console.error(`[Queue] Email job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
});

emailNotificationQueue.on('completed', (job) => {
  console.log(`[Queue] Email job ${job.id} completed: ${job.data.type}`);
});

emailNotificationQueue.on('stalled', (job) => {
  console.warn(`[Queue] Email job ${job.id} has stalled`);
});

// Google Drive sync queue events
googleDriveSyncQueue.on('error', (error) => {
  console.error('[Queue] Google Drive sync queue error:', error);
});

googleDriveSyncQueue.on('failed', (job, error) => {
  console.error(`[Queue] Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
});

googleDriveSyncQueue.on('completed', (job, result) => {
  if (result && typeof result === 'object' && 'syncedFolders' in result) {
    console.log(
      `[Queue] Job ${job.id} completed. Synced ${result.syncedFolders}/${result.totalFolders} folders.`
    );
  } else if (Array.isArray(result)) {
    const totalSynced = result.reduce((sum: number, r: SyncJobResultItem) => sum + (r.syncedFolders || 0), 0);
    const totalFolders = result.reduce((sum: number, r: SyncJobResultItem) => sum + (r.totalFolders || 0), 0);
    console.log(`[Queue] Job ${job.id} completed. Synced ${totalSynced}/${totalFolders} folders across ${result.length} schools.`);
  }
});

googleDriveSyncQueue.on('stalled', (job) => {
  console.warn(`[Queue] Job ${job.id} has stalled`);
});

// ===========================================
// QUEUE HEALTH CHECK
// ===========================================

/**
 * Check if the queue is connected and healthy
 */
export async function isQueueHealthy(): Promise<boolean> {
  try {
    await googleDriveSyncQueue.isReady();
    return true;
  } catch {
    return false;
  }
}

interface QueueStatsResult {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Get Google Drive sync queue stats for monitoring
 */
export async function getQueueStats(): Promise<QueueStatsResult> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    googleDriveSyncQueue.getWaitingCount(),
    googleDriveSyncQueue.getActiveCount(),
    googleDriveSyncQueue.getCompletedCount(),
    googleDriveSyncQueue.getFailedCount(),
    googleDriveSyncQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Get email notification queue stats for monitoring
 */
export async function getEmailQueueStats(): Promise<QueueStatsResult> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailNotificationQueue.getWaitingCount(),
    emailNotificationQueue.getActiveCount(),
    emailNotificationQueue.getCompletedCount(),
    emailNotificationQueue.getFailedCount(),
    emailNotificationQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

/**
 * Close all queue connections gracefully
 */
export async function closeQueues(): Promise<void> {
  console.log('[Queue] Closing queues...');
  await Promise.all([
    emailNotificationQueue.close(),
    googleDriveSyncQueue.close(),
  ]);
  console.log('[Queue] Queues closed.');
}
