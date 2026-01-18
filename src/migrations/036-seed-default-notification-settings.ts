/**
 * Migration: Seed Default Notification Settings
 * Populates default notification settings from environment variables
 */

import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if settings already exist (idempotent check)
  const existingSettings = await queryInterface.sequelize.query(`
    SELECT key FROM system_settings 
    WHERE tenant_id IS NULL AND key LIKE 'notification:%';
  `);

  const existingKeys = (existingSettings[0] as any[]).map((row: any) => row.key);
  const requiredKeys = [
    "notification:redis",
    "notification:smtp",
    "notification:preferences",
    "notification:bullmq",
  ];

  // Only insert missing settings
  const missingKeys = requiredKeys.filter((key) => !existingKeys.includes(key));
  if (missingKeys.length === 0) {
    // All settings already exist, skip seeding
    return;
  }

  // Get default values from environment or use defaults
  const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB || "0", 10),
  };

  const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  };

  const preferences = {
    expiryDays: parseInt(process.env.NOTIFICATION_EXPIRY_DAYS || "30", 10),
    maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || "3", 10),
    cleanupInterval: parseInt(
      process.env.NOTIFICATION_CLEANUP_INTERVAL || "86400000",
      10
    ),
  };

  const bullmqConfig = {
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

  // Build settings map
  const settingsMap: Record<string, any> = {
    "notification:redis": {
      value: redisConfig,
      description: "Redis configuration for BullMQ and Socket.IO",
    },
    "notification:smtp": {
      value: smtpConfig,
      description: "SMTP configuration for email notifications",
    },
    "notification:preferences": {
      value: preferences,
      description: "Notification system preferences (expiry, retries, cleanup)",
    },
    "notification:bullmq": {
      value: bullmqConfig,
      description: "BullMQ queue configuration (concurrency and rate limiting)",
    },
  };

  // Insert only missing settings using raw SQL (idempotent)
  // Using raw SQL because Sequelize's bulkInsert doesn't properly handle JSONB objects
  for (const key of missingKeys) {
    try {
      const setting = settingsMap[key];
      const valueJson = JSON.stringify(setting.value);
      const id = uuidv4();
      
      // Use parameterized query to safely insert JSONB values
      await queryInterface.sequelize.query(
        `
        INSERT INTO "system_settings" 
        ("id", "tenant_id", "key", "value", "description", "category", "updated_at")
        VALUES ($1, NULL, $2, $3::jsonb, $4, 'notifications', NOW())
        ON CONFLICT DO NOTHING;
      `,
        {
          bind: [id, key, valueJson, setting.description || null],
        }
      );
    } catch (error: any) {
      // If it fails due to unique constraint, that's okay - settings already exist
      if (
        !error?.message?.includes("unique") &&
        !error?.message?.includes("duplicate") &&
        !error?.message?.includes("violates unique constraint")
      ) {
        throw error;
      }
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove seeded notification settings
  await queryInterface.sequelize.query(`
    DELETE FROM system_settings 
    WHERE tenant_id IS NULL 
    AND key IN (
      'notification:redis',
      'notification:smtp',
      'notification:preferences',
      'notification:bullmq'
    );
  `);
}
