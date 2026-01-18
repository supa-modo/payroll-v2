/**
 * Notification Config Service
 * Provides typed access to notification-related settings with env var fallback
 */

import {
  getGlobalSetting,
  setGlobalSetting,
} from "./settingsService";

/**
 * Redis Configuration Interface
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

/**
 * SMTP Configuration Interface
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from?: string;
}

/**
 * Notification Preferences Interface
 */
export interface NotificationPreferences {
  expiryDays: number;
  maxRetries: number;
  cleanupInterval: number;
}

/**
 * BullMQ Configuration Interface
 */
export interface BullMQConfig {
  concurrency: {
    email: number;
    push: number;
    sms: number;
  };
  limiter: {
    email: { max: number; duration: number };
    push: { max: number; duration: number };
    sms: { max: number; duration: number };
  };
}

/**
 * Get Redis configuration
 */
export async function getRedisConfig(): Promise<RedisConfig> {
  const config = await getGlobalSetting("notification:redis", null);

  if (config) {
    return config as RedisConfig;
  }

  // Fallback to environment variables
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
  };
}

/**
 * Set Redis configuration
 */
export async function setRedisConfig(
  config: RedisConfig,
  updatedBy?: string
): Promise<void> {
  await setGlobalSetting(
    "notification:redis",
    config,
    "Redis configuration for BullMQ and Socket.IO",
    "notifications",
    updatedBy
  );
}

/**
 * Get SMTP configuration
 */
export async function getSMTPConfig(): Promise<SMTPConfig> {
  const config = await getGlobalSetting("notification:smtp", null);

  if (config) {
    return config as SMTPConfig;
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };
}

/**
 * Set SMTP configuration
 */
export async function setSMTPConfig(
  config: SMTPConfig,
  updatedBy?: string
): Promise<void> {
  await setGlobalSetting(
    "notification:smtp",
    config,
    "SMTP configuration for email notifications",
    "notifications",
    updatedBy
  );
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const prefs = await getGlobalSetting("notification:preferences", null);

  if (prefs) {
    return prefs as NotificationPreferences;
  }

  // Fallback to environment variables
  return {
    expiryDays: parseInt(process.env.NOTIFICATION_EXPIRY_DAYS || "30", 10),
    maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || "3", 10),
    cleanupInterval: parseInt(
      process.env.NOTIFICATION_CLEANUP_INTERVAL || "86400000",
      10
    ),
  };
}

/**
 * Set notification preferences
 */
export async function setNotificationPreferences(
  prefs: NotificationPreferences,
  updatedBy?: string
): Promise<void> {
  await setGlobalSetting(
    "notification:preferences",
    prefs,
    "Notification system preferences (expiry, retries, cleanup)",
    "notifications",
    updatedBy
  );
}

/**
 * Get BullMQ configuration
 */
export async function getBullMQConfig(): Promise<BullMQConfig> {
  const config = await getGlobalSetting("notification:bullmq", null);

  if (config) {
    return config as BullMQConfig;
  }

  // Fallback to defaults
  return {
    concurrency: {
      email: 5,
      push: 10,
      sms: 5,
    },
    limiter: {
      email: { max: 100, duration: 60000 },
      push: { max: 1000, duration: 60000 },
      sms: { max: 100, duration: 60000 },
    },
  };
}

/**
 * Set BullMQ configuration
 */
export async function setBullMQConfig(
  config: BullMQConfig,
  updatedBy?: string
): Promise<void> {
  await setGlobalSetting(
    "notification:bullmq",
    config,
    "BullMQ queue configuration (concurrency and rate limiting)",
    "notifications",
    updatedBy
  );
}

/**
 * Get all notification configuration
 */
export async function getNotificationConfig(): Promise<{
  redis: RedisConfig;
  smtp: SMTPConfig;
  preferences: NotificationPreferences;
  bullmq: BullMQConfig;
}> {
  const [redis, smtp, preferences, bullmq] = await Promise.all([
    getRedisConfig(),
    getSMTPConfig(),
    getNotificationPreferences(),
    getBullMQConfig(),
  ]);

  return {
    redis,
    smtp,
    preferences,
    bullmq,
  };
}

/**
 * Set all notification configuration
 */
export async function setNotificationConfig(
  config: {
    redis?: RedisConfig;
    smtp?: SMTPConfig;
    preferences?: NotificationPreferences;
    bullmq?: BullMQConfig;
  },
  updatedBy?: string
): Promise<void> {
  const promises: Promise<void>[] = [];

  if (config.redis) {
    promises.push(setRedisConfig(config.redis, updatedBy));
  }

  if (config.smtp) {
    promises.push(setSMTPConfig(config.smtp, updatedBy));
  }

  if (config.preferences) {
    promises.push(setNotificationPreferences(config.preferences, updatedBy));
  }

  if (config.bullmq) {
    promises.push(setBullMQConfig(config.bullmq, updatedBy));
  }

  await Promise.all(promises);
}

export default {
  getRedisConfig,
  setRedisConfig,
  getSMTPConfig,
  setSMTPConfig,
  getNotificationPreferences,
  setNotificationPreferences,
  getBullMQConfig,
  setBullMQConfig,
  getNotificationConfig,
  setNotificationConfig,
};
