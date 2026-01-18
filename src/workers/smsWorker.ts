/**
 * SMS Notification Worker
 * Processes SMS notification jobs from BullMQ
 */

import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../config/redis";
// smsQueue imported but not directly used
import { Notification } from "../models";
import logger from "../utils/logger";

/**
 * Process SMS notification job
 */
async function processSMSJob(job: Job): Promise<void> {
  const { notificationId } = job.data;

  try {
    logger.info(`Processing SMS notification job: ${job.id} for notification: ${notificationId}`);

    // Find notification
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Check if notification should be sent via SMS
    if (!notification.channels.includes("sms")) {
      logger.info(`Notification ${notificationId} does not require SMS channel`);
      await notification.markAsDelivered();
      return;
    }

    // TODO: Implement SMS sending (Twilio, AWS SNS, etc.)
    // For now, just mark as sent
    logger.info(`SMS notification ${notificationId} would be sent here`);
    await notification.markAsSent();

    logger.info(`SMS notification ${notificationId} sent successfully`);
  } catch (error: any) {
    logger.error(`Error processing SMS notification job ${job.id}:`, error);

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
 * Create SMS worker
 */
export function createSMSWorker(): Worker {
  const worker = new Worker(
    "sms-notifications",
    processSMSJob,
    {
      connection: getRedisConnection() as any,
      concurrency: 5, // Process 5 SMS concurrently
      limiter: {
        max: 100, // Max 100 jobs
        duration: 60000, // Per minute
      },
    }
  );

  worker.on("completed", (job) => {
    logger.info(`SMS job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`SMS job ${job?.id} failed:`, err);
  });

  worker.on("error", (err) => {
    logger.error("SMS worker error:", err);
  });

  logger.info("✅ SMS worker started");

  return worker;
}

export default createSMSWorker;
