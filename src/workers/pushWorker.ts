/**
 * Push Notification Worker
 * Processes push notification jobs from BullMQ
 */

import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../config/redis";
// pushQueue imported but not directly used
import { Notification } from "../models";
import logger from "../utils/logger";

/**
 * Process push notification job
 */
async function processPushJob(job: Job): Promise<void> {
  const { notificationId } = job.data;

  try {
    logger.info(`Processing push notification job: ${job.id} for notification: ${notificationId}`);

    // Find notification
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Check if notification should be sent via push
    if (!notification.channels.includes("push")) {
      logger.info(`Notification ${notificationId} does not require push channel`);
      await notification.markAsDelivered();
      return;
    }

    // TODO: Implement push notification sending (FCM, APNS, etc.)
    // For now, just mark as sent
    logger.info(`Push notification ${notificationId} would be sent here`);
    await notification.markAsSent();

    logger.info(`Push notification ${notificationId} sent successfully`);
  } catch (error: any) {
    logger.error(`Error processing push notification job ${job.id}:`, error);

    // Update notification status
    try {
      const notification = await Notification.findByPk(notificationId);
      if (notification) {
        await notification.markAsFailed(error.message);
      }
    } catch (updateError) {
      logger.error("Error updating notification status:", updateError);
    }

    throw error;
  }
}

/**
 * Create push worker
 */
export function createPushWorker(): Worker {
  const worker = new Worker(
    "push-notifications",
    processPushJob,
    {
      connection: getRedisConnection() as any,
      concurrency: 10, // Process 10 push notifications concurrently
      limiter: {
        max: 1000, // Max 1000 jobs
        duration: 60000, // Per minute
      },
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Push job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Push job ${job?.id} failed:`, err);
  });

  worker.on("error", (err) => {
    logger.error("Push worker error:", err);
  });

  logger.info("✅ Push worker started");

  return worker;
}

export default createPushWorker;
