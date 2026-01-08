/**
 * Migration: Create Payroll Items Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'payroll_items'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("payroll_items", {
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
      salary_component_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "salary_components", key: "id" },
        onDelete: "SET NULL",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      calculation_details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_payroll_items_payroll" 
        ON "payroll_items" ("payroll_id");
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
      AND table_name = 'payroll_items'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("payroll_items");
  }
}


