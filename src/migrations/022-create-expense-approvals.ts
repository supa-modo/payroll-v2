/**
 * Migration: Create Expense Approvals Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_approvals'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("expense_approvals", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      expense_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "expenses", key: "id" },
        onDelete: "CASCADE",
      },
      approval_level: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      approver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      action: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      acted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_expense_approvals_expense" 
        ON "expense_approvals" ("expense_id");
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
      AND table_name = 'expense_approvals'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("expense_approvals");
  }
}


