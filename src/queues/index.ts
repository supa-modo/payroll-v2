/**
 * BullMQ Queue Configuration
 * Creates and manages queues for notification processing
 */

import { Queue, QueueOptions } from "bullmq";
import { getRedisConnection } from "../config/redis";
import logger from "../utils/logger";

/**
 * Queue options
 */
const queueOptions: QueueOptions = {
  connection: getRedisConnection() as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Email notification queue
 */
export const emailQueue = new Queue("email-notifications", queueOptions);

/**
 * Push notification queue
 */
export const pushQueue = new Queue("push-notifications", queueOptions);

/**
 * SMS notification queue
 */
export const smsQueue = new Queue("sms-notifications", queueOptions);

/**
 * Cleanup jobs queue
 */
export const cleanupQueue = new Queue("cleanup-jobs", queueOptions);

/**
 * Initialize queues
 */
export async function initializeQueues(): Promise<void> {
  try {
    // Clean up old jobs
    await Promise.all([
      emailQueue.clean(0, 1000, "completed"),
      pushQueue.clean(0, 1000, "completed"),
      smsQueue.clean(0, 1000, "completed"),
      cleanupQueue.clean(0, 1000, "completed"),
    ]);

    logger.info("✅ BullMQ queues initialized successfully");
  } catch (error) {
    logger.error("Error initializing queues:", error);
    throw error;
  }
}

/**
 * Close all queues
 */
export async function closeQueues(): Promise<void> {
  try {
    await Promise.all([
      emailQueue.close(),
      pushQueue.close(),
      smsQueue.close(),
      cleanupQueue.close(),
    ]);
    logger.info("BullMQ queues closed");
  } catch (error) {
    logger.error("Error closing queues:", error);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  email: { waiting: number; active: number; completed: number; failed: number };
  push: { waiting: number; active: number; completed: number; failed: number };
  sms: { waiting: number; active: number; completed: number; failed: number };
}> {
  const [emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  const [pushWaiting, pushActive, pushCompleted, pushFailed] = await Promise.all([
    pushQueue.getWaitingCount(),
    pushQueue.getActiveCount(),
    pushQueue.getCompletedCount(),
    pushQueue.getFailedCount(),
  ]);

  const [smsWaiting, smsActive, smsCompleted, smsFailed] = await Promise.all([
    smsQueue.getWaitingCount(),
    smsQueue.getActiveCount(),
    smsQueue.getCompletedCount(),
    smsQueue.getFailedCount(),
  ]);

  return {
    email: {
      waiting: emailWaiting,
      active: emailActive,
      completed: emailCompleted,
      failed: emailFailed,
    },
    push: {
      waiting: pushWaiting,
      active: pushActive,
      completed: pushCompleted,
      failed: pushFailed,
    },
    sms: {
      waiting: smsWaiting,
      active: smsActive,
      completed: smsCompleted,
      failed: smsFailed,
    },
  };
}

export default {
  emailQueue,
  pushQueue,
  smsQueue,
  cleanupQueue,
  initializeQueues,
  closeQueues,
  getQueueStats,
};
