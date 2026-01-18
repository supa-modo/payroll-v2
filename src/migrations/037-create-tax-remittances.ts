/**
 * Migration: Create Tax Remittances Table
 * Tracks tax remittances (PAYE, NSSF, NHIF) for payroll periods
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tax_remittances'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("tax_remittances", {
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
      payroll_period_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "payroll_periods", key: "id" },
        onDelete: "CASCADE",
      },
      tax_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [["PAYE", "NSSF", "NHIF"]],
        },
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      remitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      remitted_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      remittance_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "remitted"]],
        },
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
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create indexes
    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_period_tax_type" 
        ON "tax_remittances" ("payroll_period_id", "tax_type");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_tax_remittances_tenant" 
        ON "tax_remittances" ("tenant_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_tax_remittances_period" 
        ON "tax_remittances" ("payroll_period_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_tax_remittances_status" 
        ON "tax_remittances" ("status");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_tax_remittances_due_date" 
        ON "tax_remittances" ("due_date");
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
      AND table_name = 'tax_remittances'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("tax_remittances");
  }
}
