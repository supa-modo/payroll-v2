/**
 * Migration: Update System Settings for Global Settings Support
 * Makes tenantId nullable and adds category field for global/system-wide settings
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_settings'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    // Drop the old unique constraint
    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "unique_setting_key";
      `);
    } catch (error: any) {
      // Ignore if doesn't exist
    }

    // Make tenant_id nullable
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE "system_settings" 
        ALTER COLUMN "tenant_id" DROP NOT NULL;
      `);
    } catch (error: any) {
      if (!error?.message?.includes("does not exist") && !error?.message?.includes("already")) {
        throw error;
      }
    }

    // Add category column
    try {
      await queryInterface.addColumn("system_settings", "category", {
        type: DataTypes.STRING(100),
        allowNull: true,
      });
    } catch (error: any) {
      if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
        throw error;
      }
    }

    // Create new unique index that allows null tenant_id for global settings
    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_setting_key_global" 
        ON "system_settings" ("tenant_id", "key") 
        WHERE "tenant_id" IS NOT NULL;
      `);
    } catch (error: any) {
      // Ignore if already exists
    }

    // Create unique index for global settings (where tenant_id IS NULL)
    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_global_setting_key" 
        ON "system_settings" ("key") 
        WHERE "tenant_id" IS NULL;
      `);
    } catch (error: any) {
      // Ignore if already exists
    }

    // Create index on category for filtering
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_system_settings_category" 
        ON "system_settings" ("category");
      `);
    } catch (error: any) {
      // Ignore if already exists
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_settings'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    // Drop indexes
    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "idx_system_settings_category";
      `);
    } catch (error: any) {
      // Ignore
    }

    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "unique_global_setting_key";
      `);
    } catch (error: any) {
      // Ignore
    }

    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "unique_setting_key_global";
      `);
    } catch (error: any) {
      // Ignore
    }

    // Remove category column
    try {
      await queryInterface.removeColumn("system_settings", "category");
    } catch (error: any) {
      // Ignore
    }

    // Make tenant_id NOT NULL again (this might fail if there are null values)
    try {
      // First, delete any global settings
      await queryInterface.sequelize.query(`
        DELETE FROM "system_settings" WHERE "tenant_id" IS NULL;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE "system_settings" 
        ALTER COLUMN "tenant_id" SET NOT NULL;
      `);
    } catch (error: any) {
      // Ignore if fails
    }

    // Recreate original unique index
    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_setting_key" 
        ON "system_settings" ("tenant_id", "key");
      `);
    } catch (error: any) {
      // Ignore
    }
  }
}
