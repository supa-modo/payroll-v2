/**
 * Migration: Create Loan Repayments Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'loan_repayments'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("loan_repayments", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      loan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "employee_loans", key: "id" },
        onDelete: "CASCADE",
      },
      payroll_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "payrolls", key: "id" },
        onDelete: "SET NULL",
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      repayment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      payment_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      balance_after: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
        CREATE INDEX IF NOT EXISTS "idx_loan_repayments_loan" 
        ON "loan_repayments" ("loan_id");
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
      AND table_name = 'loan_repayments'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("loan_repayments");
  }
}


