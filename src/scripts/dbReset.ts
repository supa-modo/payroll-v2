import dotenv from "dotenv";
import { Client } from "pg";
import { sequelize } from "../config/database";
import logger from "../utils/logger";
import { migrateUp } from "../migrations/run";

dotenv.config();

async function resetDatabase() {
  const dbName = process.env.DB_NAME || "payroll_dev";
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = parseInt(process.env.DB_PORT || "5433", 10);
  const user = process.env.DB_USER || "payroll";
  const password = process.env.DB_PASSWORD || "payroll123";

  const maintenanceClient = new Client({
    host,
    port,
    user,
    password,
    database: "postgres",
  });

  try {
    await maintenanceClient.connect();
    logger.info(`Dropping database ${dbName}...`);

    // Terminate existing connections
    await maintenanceClient.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
        AND pid <> pg_backend_pid();
      `,
      [dbName]
    );

    await maintenanceClient.query(`DROP DATABASE IF EXISTS "${dbName}";`);
    await maintenanceClient.query(`CREATE DATABASE "${dbName}";`);
    logger.info(`Database ${dbName} recreated successfully`);
  } catch (error) {
    logger.error("Error resetting database", error as Error);
    process.exit(1);
  } finally {
    await maintenanceClient.end();
  }

  // Run migrations up on the freshly created DB using shared runner
  try {
    await sequelize.authenticate();
    logger.info("Running migrations on fresh database...");
    await migrateUp();
  } catch (error) {
    logger.error("Error running migrations after reset", error as Error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  resetDatabase().then(() => {
    logger.info("DB reset completed");
    process.exit(0);
  });
}

