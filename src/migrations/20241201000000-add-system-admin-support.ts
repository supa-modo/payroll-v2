/**
 * Migration: Add System Admin Support
 * Adds isSystemAdmin field to users table to support system-wide administrators
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add isSystemAdmin column to users table
  await queryInterface.addColumn("users", "is_system_admin", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Add index for system admin queries
  await queryInterface.addIndex("users", ["is_system_admin"], {
    name: "idx_users_is_system_admin",
    where: {
      is_system_admin: true,
    },
  });

  // Make tenantId nullable for system admins
  await queryInterface.changeColumn("users", "tenant_id", {
    type: DataTypes.UUID,
    allowNull: true, // System admins don't have tenantId
    references: {
      model: "tenants",
      key: "id",
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove index
  await queryInterface.removeIndex("users", "idx_users_is_system_admin");

  // Remove isSystemAdmin column
  await queryInterface.removeColumn("users", "is_system_admin");

  // Revert tenantId to NOT NULL (this might fail if system admins exist)
  await queryInterface.changeColumn("users", "tenant_id", {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "tenants",
      key: "id",
    },
  });
}

