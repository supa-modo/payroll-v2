/**
 * Migration: Add Composite Indexes for Notifications
 */

import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Composite index for common query pattern: user_id + tenant_id + expires_at + read_at
  try {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_user_tenant_expires_read" 
      ON "notifications" ("user_id", "tenant_id", "expires_at", "read_at");
    `);
  } catch (error: any) {
    if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
      throw error;
    }
  }

  // Index for admin queries: tenant_id + type + created_at
  try {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_tenant_type_created" 
      ON "notifications" ("tenant_id", "type", "created_at");
    `);
  } catch (error: any) {
    if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
      throw error;
    }
  }

  // Index for cleanup jobs: expires_at
  // Note: Cannot use NOW() in index predicate as it's not immutable
  // The index on expires_at alone is sufficient for efficient queries
  try {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_expires_at" 
      ON "notifications" ("expires_at");
    `);
  } catch (error: any) {
    if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_notifications_user_tenant_expires_read";
    `);
  } catch (error: any) {
    // Ignore errors during rollback
  }

  try {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_notifications_tenant_type_created";
    `);
  } catch (error: any) {
    // Ignore errors during rollback
  }

  try {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "idx_notifications_expires_at";
    `);
  } catch (error: any) {
    // Ignore errors during rollback
  }
}
