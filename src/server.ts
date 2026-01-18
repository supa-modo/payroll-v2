/**
 * Server Entry Point
 */

import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { testConnection } from "./config/database";
import { testRedisConnection } from "./config/redis";
import logger from "./utils/logger";
import "./models"; // Import models to register associations
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { initializeRealtimeService } from "./services/realtimeService";
import socketAuth from "./middleware/socketAuth";
import { initializeQueues } from "./queues";
import createEmailWorker from "./workers/emailWorker";
import createPushWorker from "./workers/pushWorker";
import createSMSWorker from "./workers/smsWorker";

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

/**
 * Connect to database with retry logic
 */
async function connectDatabase(
  maxRetries: number = 3,
  delay: number = 5000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.info(`Attempting database connection (${attempt}/${maxRetries})...`);
    const connected = await testConnection();
    if (connected) {
      logger.info("Database connection established successfully");
      return true;
    }
    if (attempt < maxRetries) {
      logger.warn(
        `Database connection failed. Retrying in ${delay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  logger.warn(
    "Failed to connect to database after all retries. Server will start anyway, but database operations may fail."
  );
  return false;
}

async function startServer(): Promise<void> {
  try {
    logger.info("Starting Payroll Server...", {
      environment: process.env.NODE_ENV || "development",
      port: PORT,
      host: HOST,
    });

    // Try to connect to database
    const dbConnected = await connectDatabase(3, 5000);

    // Try to connect to Redis
    const redisConnected = await testRedisConnection();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = new HTTPServer(app);

    // Initialize Socket.IO
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Apply authentication middleware
    io.use(socketAuth);

    // Initialize real-time service
    initializeRealtimeService(io);

    // Socket.IO connection handling
    io.on("connection", (socket: any) => {
      logger.info(`Socket connected: ${socket.id} for user ${socket.userId}`);

      socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // Initialize BullMQ queues
    if (redisConnected) {
      await initializeQueues();

      // Start workers
      const emailWorker = createEmailWorker();
      const pushWorker = createPushWorker();
      const smsWorker = createSMSWorker();

      // Start cleanup worker and schedule job
      const { createCleanupWorker, scheduleCleanupJob } = await import("./jobs/cleanupNotifications");
      const cleanupWorker = await createCleanupWorker();
      await scheduleCleanupJob();

      // Store workers for graceful shutdown
      (global as any).workers = { emailWorker, pushWorker, smsWorker, cleanupWorker };
    }

    // Start server
    httpServer.listen(Number(PORT), HOST, () => {
      logger.info("Server running", {
        host: HOST,
        port: PORT,
        database: dbConnected ? "Connected" : "Disconnected",
        redis: redisConnected ? "Connected" : "Disconnected",
      });
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      logger.info("Shutting down gracefully...");
      
      // Close Socket.IO
      io.close();
      
      // Close workers
      if ((global as any).workers) {
        const { emailWorker, pushWorker, smsWorker, cleanupWorker } = (global as any).workers;
        await Promise.all([
          emailWorker?.close(),
          pushWorker?.close(),
          smsWorker?.close(),
          cleanupWorker?.close(),
        ]);
      }

      // Close queues
      const { closeQueues } = await import("./queues");
      await closeQueues();

      // Close Redis connections
      const { closeRedisConnections } = await import("./config/redis");
      await closeRedisConnections();

      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error: any) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

startServer().catch((error: any) => {
  logger.error("Fatal error during server startup", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

