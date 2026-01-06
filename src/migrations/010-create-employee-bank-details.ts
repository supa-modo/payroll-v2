/**
 * Migration: Create Employee Bank Details Table
 *
 * This migration creates the employee_bank_details table for payment information
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if table already exists (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_bank_details'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    // Create employee_bank_details table
    await queryInterface.createTable("employee_bank_details", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      payment_method: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bank_branch: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      account_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      account_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      swift_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      mpesa_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      mpesa_name: {
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
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
    });

    // Create indexes (idempotent)
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_bank_details_employee" 
        ON "employee_bank_details" ("employee_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }

  // Add comments
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE employee_bank_details IS 'Bank and payment details for employees';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if table exists before dropping (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_bank_details'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("employee_bank_details");
  }
}

