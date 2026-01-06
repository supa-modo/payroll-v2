/**
 * Migration: Create Payrolls Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'payrolls'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("payrolls", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      payroll_period_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "payroll_periods", key: "id" },
        onDelete: "CASCADE",
      },
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "employees", key: "id" },
        onDelete: "CASCADE",
      },
      payment_method: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      bank_account: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      mpesa_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      gross_pay: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_earnings: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_deductions: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      net_pay: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      paye_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },
      nssf_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },
      nhif_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "calculated",
        allowNull: false,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      payment_reference: {
        type: DataTypes.STRING(100),
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
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_employee_payroll" 
        ON "payrolls" ("payroll_period_id", "employee_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_payrolls_period" 
        ON "payrolls" ("payroll_period_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_payrolls_employee" 
        ON "payrolls" ("employee_id");
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
      AND table_name = 'payrolls'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("payrolls");
  }
}

