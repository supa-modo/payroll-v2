/**
 * Migration: Create Employee Loans Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_loans'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("employee_loans", {
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
      loan_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      loan_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      principal_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      interest_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      repayment_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      monthly_deduction: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      remaining_balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_paid: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "pending",
        allowNull: false,
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
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_loan_number" 
        ON "employee_loans" ("tenant_id", "loan_number");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employee_loans_employee" 
        ON "employee_loans" ("employee_id");
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
      AND table_name = 'employee_loans'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("employee_loans");
  }
}

