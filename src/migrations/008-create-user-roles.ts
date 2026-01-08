/**
 * Migration: Create User Roles Junction Table
 *
 * This migration creates the user_roles junction table for RBAC
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if table already exists (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    // Create user_roles table
    await queryInterface.createTable("user_roles", {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "roles",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true,
        primaryKey: true,
        references: {
          model: "departments",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      assigned_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
    });

    // Create indexes (idempotent)
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_user_roles_user_role" 
        ON "user_roles" ("user_id", "role_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_user_roles_user" 
        ON "user_roles" ("user_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_user_roles_role" 
        ON "user_roles" ("role_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }

  // Add comments
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE user_roles IS 'Junction table linking users to roles, optionally scoped to departments';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if table exists before dropping (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("user_roles");
  }
}


