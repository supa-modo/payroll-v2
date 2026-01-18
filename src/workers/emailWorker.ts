/**
 * Email Notification Worker
 * Processes email notification jobs from BullMQ
 */

import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../config/redis";
// emailQueue imported but not directly used
import { Notification } from "../models";
import { sendEmail } from "../services/emailService";
import logger from "../utils/logger";

/**
 * Process email notification job
 */
async function processEmailJob(job: Job): Promise<void> {
  const { notificationId } = job.data;

  try {
    logger.info(`Processing email notification job: ${job.id} for notification: ${notificationId}`);

    // Find notification
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Check if notification should be sent via email
    if (!notification.channels.includes("email")) {
      logger.info(`Notification ${notificationId} does not require email channel`);
      await notification.markAsDelivered();
      return;
    }

    // Send email
    await sendEmail(notification);

    // Mark as sent
    await notification.markAsSent();

    logger.info(`Email notification ${notificationId} sent successfully`);
  } catch (error: any) {
    logger.error(`Error processing email notification job ${job.id}:`, error);

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
 * Create email worker
 */
export function createEmailWorker(): Worker {
  const worker = new Worker(
    "email-notifications",
    processEmailJob,
    {
      connection: getRedisConnection() as any,
      concurrency: 5, // Process 5 emails concurrently
      limiter: {
        max: 100, // Max 100 jobs
        duration: 60000, // Per minute
      },
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Email job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err);
  });

  worker.on("error", (err) => {
    logger.error("Email worker error:", err);
  });

  logger.info("✅ Email worker started");

  return worker;
}

export default createEmailWorker;
