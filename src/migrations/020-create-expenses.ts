/**
 * Migration: Create Expenses Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expenses'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("expenses", {
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
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "employees", key: "id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "expense_categories", key: "id" },
        onDelete: "RESTRICT",
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "departments", key: "id" },
        onDelete: "SET NULL",
      },
      expense_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "KES",
        allowNull: false,
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 1,
        allowNull: false,
      },
      amount_in_base_currency: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "draft",
        allowNull: false,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejected_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paid_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      payment_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      has_receipt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      receipt_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_expense_number" 
        ON "expenses" ("tenant_id", "expense_number") 
        WHERE "deleted_at" IS NULL;
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_expenses_tenant" 
        ON "expenses" ("tenant_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_expenses_deleted_at" 
        ON "expenses" ("deleted_at") 
        WHERE "deleted_at" IS NULL;
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
      AND table_name = 'expenses'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("expenses");
  }
}


