/**
 * Migration: Create Salary Revision History Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'salary_revision_history'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("salary_revision_history", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "employees", key: "id" },
        onDelete: "CASCADE",
      },
      revision_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      previous_gross: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      new_gross: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      change_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      component_changes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_salary_revision_employee" 
        ON "salary_revision_history" ("employee_id");
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
      AND table_name = 'salary_revision_history'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("salary_revision_history");
  }
}


