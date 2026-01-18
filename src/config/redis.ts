/**
 * Redis Configuration
 * Handles Redis connections for BullMQ and Socket.IO
 * Uses settings service with env var fallback
 */

import dotenv from "dotenv";
import Redis from "ioredis";
import logger from "../utils/logger";
import { getRedisConfig } from "../services/notificationConfigService";

dotenv.config();

let redisConnection: Redis | null = null;
let redisPubSub: Redis | null = null;

/**
 * Get Redis configuration (from settings or env vars)
 */
async function getRedisConfiguration() {
  try {
    const config = await getRedisConfig();
    return {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    };
  } catch (error) {
    logger.warn("Failed to get Redis config from settings, using env vars:", error);
    // Fallback to env vars
    return {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    };
  }
}

/**
 * Initialize Redis connections
 */
export async function initializeRedisConnections(): Promise<void> {
  if (redisConnection && redisPubSub) {
    return; // Already initialized
  }

  const redisConfig = await getRedisConfiguration();

  // Create Redis connection for BullMQ
  redisConnection = new Redis({
    ...redisConfig,
    db: redisConfig.db,
    enableReadyCheck: true,
    maxRetriesPerRequest: null, // BullMQ handles retries
  });

  // Create Redis connection for Socket.IO
  redisPubSub = new Redis({
    ...redisConfig,
    db: redisConfig.db + 1,
    enableReadyCheck: true,
  });

  setupEventHandlers();
}

/**
 * Setup event handlers for Redis connections
 */
function setupEventHandlers() {
  if (!redisConnection || !redisPubSub) return;

  // Event handlers for BullMQ Redis connection
  redisConnection.on("connect", () => {
    logger.info("Redis (BullMQ) connection established");
  });

  redisConnection.on("error", (error) => {
    logger.error("Redis (BullMQ) connection error:", error);
  });

  redisConnection.on("close", () => {
    logger.warn("Redis (BullMQ) connection closed");
  });

  // Event handlers for Socket.IO Redis connection
  redisPubSub.on("connect", () => {
    logger.info("Redis (Pub/Sub) connection established");
  });

  redisPubSub.on("error", (error) => {
    logger.error("Redis (Pub/Sub) connection error:", error);
  });

  redisPubSub.on("close", () => {
    logger.warn("Redis (Pub/Sub) connection closed");
  });
}

/**
 * Get Redis connection for BullMQ (lazy initialization)
 */
export function getRedisConnection(): Redis {
  if (!redisConnection) {
    // Initialize synchronously with env vars as fallback
    const config = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    };
    redisConnection = new Redis(config);
    setupEventHandlers();
  }
  return redisConnection;
}

/**
 * Get Redis connection for Socket.IO (lazy initialization)
 */
export function getRedisPubSub(): Redis {
  if (!redisPubSub) {
    // Initialize synchronously with env vars as fallback
    const config = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0", 10) + 1,
      enableReadyCheck: true,
    };
    redisPubSub = new Redis(config);
    setupEventHandlers();
  }
  return redisPubSub;
}

// Export for backward compatibility (will be initialized lazily)
// Note: These are getter functions, not the actual connections
// Using different names to avoid redeclaration errors
export { getRedisConnection as redisConnection, getRedisPubSub as redisPubSub };

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const conn = getRedisConnection();
    const pubsub = getRedisPubSub();
    await conn.ping();
    await pubsub.ping();
    logger.info("✅ Redis connections established successfully");
    return true;
  } catch (error) {
    logger.error("❌ Unable to connect to Redis:", error);
    return false;
  }
}

/**
 * Gracefully close Redis connections
 */
export async function closeRedisConnections(): Promise<void> {
  try {
    const promises: Promise<string>[] = [];
    if (redisConnection) {
      promises.push(redisConnection.quit());
    }
    if (redisPubSub) {
      promises.push(redisPubSub.quit());
    }
    await Promise.all(promises);
    redisConnection = null;
    redisPubSub = null;
    logger.info("Redis connections closed gracefully");
  } catch (error) {
    logger.error("Error closing Redis connections:", error);
  }
}

export default {
  getRedisConnection,
  getRedisPubSub,
  initializeRedisConnections,
  testRedisConnection,
  closeRedisConnections,
};
