// ===========================================
// Google Drive Sync Job
// ===========================================
// Processes sync jobs from Bull queue
// Handles scheduled and on-demand sync operations

import { Job } from 'bull';
import { googleDriveSyncQueue } from '../config/queue';
import * as syncService from '../services/googleDriveSync.service';
import { config } from '../config';

// ===========================================
// TYPES
// ===========================================

export interface SyncJobData {
  type: 'all' | 'school' | 'folder';
  schoolId?: string;
  folderId?: string;
}

// ===========================================
// JOB PROCESSOR
// ===========================================

/**
 * Process sync jobs from the queue
 */
googleDriveSyncQueue.process(async (job: Job<SyncJobData>) => {
  const { type, schoolId, folderId } = job.data;

  console.log(`[SyncJob] Processing job ${job.id}: ${type}`, { schoolId, folderId });

  const startTime = Date.now();

  try {
    let result;

    switch (type) {
      case 'all':
        // Sync all schools with Google Drive connected
        result = await syncService.syncAllSchools();
        break;

      case 'school':
        // Sync all folders for a specific school
        if (!schoolId) {
          throw new Error('schoolId required for school sync');
        }
        result = await syncService.syncSchoolFolders(schoolId);
        break;

      case 'folder':
        // Sync a specific folder
        if (!schoolId || !folderId) {
          throw new Error('schoolId and folderId required for folder sync');
        }
        result = await syncService.triggerFolderSync(schoolId, folderId);
        break;

      default:
        throw new Error(`Unknown sync type: ${type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[SyncJob] Job ${job.id} completed in ${duration}ms`);

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SyncJob] Job ${job.id} failed after ${duration}ms:`, error.message);
    throw error; // Re-throw to trigger retry
  }
});

// ===========================================
// SCHEDULE RECURRING SYNC
// ===========================================

/**
 * Schedule the recurring sync job
 * Runs every 15 minutes (or configured interval)
 */
export async function scheduleRecurringSync(): Promise<void> {
  // Remove existing repeatable jobs first
  const existingJobs = await googleDriveSyncQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await googleDriveSyncQueue.removeRepeatableByKey(job.key);
  }

  // Calculate cron pattern from config
  const intervalMinutes = config.googleDrive.syncIntervalMinutes;
  const cronPattern = `*/${intervalMinutes} * * * *`; // Every N minutes

  // Schedule new recurring job
  await googleDriveSyncQueue.add(
    { type: 'all' },
    {
      repeat: { cron: cronPattern },
      jobId: 'recurring-sync-all',
    }
  );

  console.log(`[SyncJob] Scheduled recurring Google Drive sync (every ${intervalMinutes} minutes)`);
}

/**
 * Stop the recurring sync job
 */
export async function stopRecurringSync(): Promise<void> {
  const existingJobs = await googleDriveSyncQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await googleDriveSyncQueue.removeRepeatableByKey(job.key);
  }
  console.log('[SyncJob] Stopped recurring Google Drive sync');
}

// ===========================================
// MANUAL SYNC HELPERS
// ===========================================

/**
 * Queue a school sync job
 * @param schoolId School ID to sync
 * @returns Job ID
 */
export async function queueSchoolSync(schoolId: string): Promise<string> {
  const job = await googleDriveSyncQueue.add(
    { type: 'school', schoolId },
    { priority: 2 } // Higher priority than recurring sync
  );
  console.log(`[SyncJob] Queued school sync job ${job.id} for school ${schoolId}`);
  return job.id.toString();
}

/**
 * Queue a folder sync job
 * @param schoolId School ID
 * @param folderId Folder ID to sync
 * @returns Job ID
 */
export async function queueFolderSync(schoolId: string, folderId: string): Promise<string> {
  const job = await googleDriveSyncQueue.add(
    { type: 'folder', schoolId, folderId },
    { priority: 1 } // Highest priority for manual triggers
  );
  console.log(`[SyncJob] Queued folder sync job ${job.id} for folder ${folderId}`);
  return job.id.toString();
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<{
  id: string;
  state: string;
  progress: number;
  failedReason?: string;
  finishedOn?: number;
  processedOn?: number;
} | null> {
  const job = await googleDriveSyncQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();

  return {
    id: job.id.toString(),
    state,
    progress: job.progress(),
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}

/**
 * Check if there's an active sync for a school
 */
export async function isSchoolSyncActive(schoolId: string): Promise<boolean> {
  const activeJobs = await googleDriveSyncQueue.getActive();
  return activeJobs.some(
    (job) =>
      (job.data.type === 'school' && job.data.schoolId === schoolId) ||
      job.data.type === 'all'
  );
}
