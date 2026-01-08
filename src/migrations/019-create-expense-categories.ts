/**
 * Migration: Create Expense Categories Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_categories'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("expense_categories", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      monthly_budget: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      requires_receipt: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      max_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      requires_manager_approval: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      requires_finance_approval: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      auto_approve_below: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      gl_account_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
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
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_category_code" 
        ON "expense_categories" ("tenant_id", "code");
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
      AND table_name = 'expense_categories'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("expense_categories");
  }
}


