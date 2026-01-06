/**
 * Server Entry Point
 */

import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { testConnection } from "./config/database";
import logger from "./utils/logger";
import "./models"; // Import models to register associations

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

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(Number(PORT), HOST, () => {
      logger.info("Server running", {
        host: HOST,
        port: PORT,
        database: dbConnected ? "Connected" : "Disconnected",
      });
    });

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully...");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully...");
      process.exit(0);
    });
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

