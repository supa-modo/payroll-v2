/**
 * Migration: Create Payslips Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'payslips'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("payslips", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      payroll_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "payrolls", key: "id" },
        onDelete: "CASCADE",
      },
      payslip_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      file_path: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      generated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      generated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      first_viewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      download_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_payslips_payroll" 
        ON "payslips" ("payroll_id");
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
      AND table_name = 'payslips'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("payslips");
  }
}

