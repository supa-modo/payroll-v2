/**
 * Migration Runner
 *
 * This script runs database migrations up or down
 */

import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";
import { readdirSync } from "fs";
import { join } from "path";
import logger from "../utils/logger";
import { sequelize } from "../config/database";

/**
 * Get all migration files
 */
function getMigrationFiles(): string[] {
  const migrationsDir = join(__dirname);
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".ts") && file !== "run.ts")
    .sort();
}

/**
 * Run migrations up
 */
export async function migrateUp(): Promise<void> {
  try {
    console.log("🔄 Running migrations up...");

    const migrationFiles = getMigrationFiles();

    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);

      const migration = await import(join(__dirname, file));

      if (migration.up) {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✅ Migration ${file} completed`);
      } else {
        console.log(`⚠️ Migration ${file} has no 'up' function`);
      }
    }

    console.log("🎉 All migrations completed successfully!");
  } catch (error) {
    logger.error("Migration failed", error as Error);
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

/**
 * Run migrations down
 */
async function migrateDown(): Promise<void> {
  try {
    console.log("🔄 Running migrations down...");

    const migrationFiles = getMigrationFiles().reverse();

    for (const file of migrationFiles) {
      console.log(`📄 Rolling back migration: ${file}`);

      const migration = await import(join(__dirname, file));

      if (migration.down) {
        await migration.down(sequelize.getQueryInterface(), Sequelize);
        console.log(`✅ Migration ${file} rolled back`);
      } else {
        console.log(`⚠️ Migration ${file} has no 'down' function`);
      }
    }

    console.log("🎉 All migrations rolled back successfully!");
  } catch (error) {
    logger.error("Migration rollback failed", error as Error);
    console.error("❌ Migration rollback failed:", error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2];

  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    switch (command) {
      case "up":
        await migrateUp();
        break;
      case "down":
        await migrateDown();
        break;
      default:
        console.log("Usage: npm run migrate:up or npm run migrate:down");
        process.exit(1);
    }
  } catch (error) {
    logger.error("Database connection failed", error as Error);
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
// Only run migrations when this script is executed directly.
// (Importing it from other scripts like `dbReset.ts` should not trigger `main()`.)
if (require.main === module) {
  main();
}


