/**
 * Cleanup Notifications Job
 * Removes expired notifications and old data
 */

import { Notification, Op } from "../models";
import { cleanupQueue } from "../queues";
import logger from "../utils/logger";
import { getNotificationPreferences } from "../services/notificationConfigService";

/**
 * Clean up expired notifications
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const deleted = await Notification.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${deleted} expired notifications`);
    return deleted;
  } catch (error: any) {
    logger.error("Error cleaning up expired notifications:", error);
    return 0;
  }
}

/**
 * Clean up old read notifications (older than specified days)
 */
export async function cleanupOldReadNotifications(days: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await Notification.destroy({
      where: {
        readAt: {
          [Op.ne]: null,
        },
        createdAt: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${deleted} old read notifications (older than ${days} days)`);
    return deleted;
  } catch (error: any) {
    logger.error("Error cleaning up old read notifications:", error);
    return 0;
  }
}

/**
 * Schedule cleanup job
 */
export async function scheduleCleanupJob(): Promise<void> {
  const prefs = await getNotificationPreferences();
  const CLEANUP_INTERVAL = prefs.cleanupInterval;
  
  // Schedule recurring cleanup job
  cleanupQueue.add(
    "cleanup-notifications",
    {},
    {
      repeat: {
        every: CLEANUP_INTERVAL,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  logger.info(`Scheduled cleanup job to run every ${CLEANUP_INTERVAL / 1000 / 60} minutes`);
}

/**
 * Process cleanup job
 */
export async function processCleanupJob(): Promise<void> {
  try {
    logger.info("Starting notification cleanup job...");

    const expired = await cleanupExpiredNotifications();
    const oldRead = await cleanupOldReadNotifications();

    logger.info(`Cleanup job completed: ${expired} expired, ${oldRead} old read notifications removed`);
  } catch (error: any) {
    logger.error("Error processing cleanup job:", error);
    throw error;
  }
}

// Create worker for cleanup queue
export async function createCleanupWorker() {
  const { Worker } = await import("bullmq");
  const { getRedisConnection } = await import("../config/redis");

  const worker = new Worker(
    "cleanup-jobs",
    async (job) => {
      if (job.name === "cleanup-notifications") {
        await processCleanupJob();
      }
    },
    {
      connection: getRedisConnection() as any,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Cleanup job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Cleanup job ${job?.id} failed:`, err);
  });

  logger.info("✅ Cleanup worker started");

  return worker;
}

export default {
  cleanupExpiredNotifications,
  cleanupOldReadNotifications,
  scheduleCleanupJob,
  processCleanupJob,
  createCleanupWorker,
};
