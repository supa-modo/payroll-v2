/**
 * Migration: Add System Admin Support
 * Adds isSystemAdmin field to users table to support system-wide administrators
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if column already exists (idempotent)
  const columnExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'is_system_admin'
    );
  `);

  if (!(columnExists[0][0] as any).exists) {
    // Add isSystemAdmin column to users table
    await queryInterface.addColumn("users", "is_system_admin", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  // Check if index already exists (idempotent)
  const indexExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND indexname = 'idx_users_is_system_admin'
    );
  `);

  if (!(indexExists[0][0] as any).exists) {
    // Add index for system admin queries
    await queryInterface.addIndex("users", ["is_system_admin"], {
      name: "idx_users_is_system_admin",
      where: {
        is_system_admin: true,
      },
    });
  }

  // Make tenantId nullable for system admins (idempotent - check current state)
  const tenantIdColumn = await queryInterface.sequelize.query(`
    SELECT is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'tenant_id'
  `);

  if (tenantIdColumn[0][0] && (tenantIdColumn[0][0] as any).is_nullable === "NO") {
    await queryInterface.changeColumn("users", "tenant_id", {
      type: DataTypes.UUID,
      allowNull: true, // System admins don't have tenantId
      references: {
        model: "tenants",
        key: "id",
      },
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if index exists before removing
  const indexExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND indexname = 'idx_users_is_system_admin'
    );
  `);

  if ((indexExists[0][0] as any).exists) {
    await queryInterface.removeIndex("users", "idx_users_is_system_admin");
  }

  // Check if column exists before removing
  const columnExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'is_system_admin'
    );
  `);

  if ((columnExists[0][0] as any).exists) {
    await queryInterface.removeColumn("users", "is_system_admin");
  }

  // Revert tenantId to NOT NULL (this might fail if system admins exist)
  const tenantIdColumn = await queryInterface.sequelize.query(`
    SELECT is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'tenant_id'
  `);

  if (tenantIdColumn[0][0] && (tenantIdColumn[0][0] as any).is_nullable === "YES") {
    // Check if there are any NULL tenant_ids
    const nullTenantIds = await queryInterface.sequelize.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE tenant_id IS NULL
    `);

    if ((nullTenantIds[0][0] as any).count === "0") {
      await queryInterface.changeColumn("users", "tenant_id", {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
      });
    }
  }
}

