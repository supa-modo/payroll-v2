/**
 * Migration: Create Salary Components Table
 *
 * This migration creates the salary_components table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if table already exists (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'salary_components'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    // Create salary_components table
    await queryInterface.createTable("salary_components", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
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
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      calculation_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      default_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      percentage_of: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "salary_components",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      percentage_value: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      is_taxable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      is_statutory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      statutory_type: {
        type: DataTypes.STRING(20),
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
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_component_code" 
        ON "salary_components" ("tenant_id", "code");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_salary_components_tenant" 
        ON "salary_components" ("tenant_id") 
        WHERE "is_active" = true;
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }

  // Add comments
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE salary_components IS 'Salary components (earnings and deductions)';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if table exists before dropping (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'salary_components'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("salary_components");
  }
}

