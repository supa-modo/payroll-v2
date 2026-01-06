/**
 * Migration: Create Data Change History Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'data_change_history'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("data_change_history", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "tenants", key: "id" },
        onDelete: "CASCADE",
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      field_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      old_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      changed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      change_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_data_change_history_entity" 
        ON "data_change_history" ("entity_type", "entity_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_data_change_history_tenant" 
        ON "data_change_history" ("tenant_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'data_change_history'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("data_change_history");
  }
}

