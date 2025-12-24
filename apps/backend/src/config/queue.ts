// ===========================================
// Queue Configuration (Bull + Redis)
// ===========================================
// Background job processing for Google Drive sync
// Uses Bull queue backed by Redis

import Bull from 'bull';
import { config } from './index';

// ===========================================
// QUEUE INSTANCES
// ===========================================

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
    const totalSynced = result.reduce((sum: number, r: any) => sum + (r.syncedFolders || 0), 0);
    const totalFolders = result.reduce((sum: number, r: any) => sum + (r.totalFolders || 0), 0);
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

/**
 * Get queue stats for monitoring
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    googleDriveSyncQueue.getWaitingCount(),
    googleDriveSyncQueue.getActiveCount(),
    googleDriveSyncQueue.getCompletedCount(),
    googleDriveSyncQueue.getFailedCount(),
    googleDriveSyncQueue.getDelayedCount(),
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
  await googleDriveSyncQueue.close();
  console.log('[Queue] Queues closed.');
}
