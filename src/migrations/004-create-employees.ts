/**
 * Migration: Create Employees Table
 *
 * This migration creates the employees table for employee management
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if table already exists (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employees'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    // Create employees table
    await queryInterface.createTable("employees", {
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
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "departments",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      employee_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      middle_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      marital_status: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      photo_url: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      personal_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      work_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phone_primary: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      phone_secondary: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address_line1: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address_line2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      county: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "Kenya",
      },
      national_id: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      passport_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      kra_pin: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      nssf_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      nhif_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      employment_type: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      job_title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      job_grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      hire_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      probation_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      contract_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      termination_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      termination_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "active",
      },
      emergency_contact_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      emergency_contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      emergency_contact_relationship: {
        type: DataTypes.STRING(50),
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    });

    // Create indexes (idempotent)
    try {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "employees_tenant_number_unique" 
        ON "employees" ("tenant_id", "employee_number") 
        WHERE "deleted_at" IS NULL;
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employees_tenant" ON "employees" ("tenant_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employees_department" ON "employees" ("department_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employees_tenant_department" 
        ON "employees" ("tenant_id", "department_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employees_tenant_status" 
        ON "employees" ("tenant_id", "status");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employees_tenant_employment_type" 
        ON "employees" ("tenant_id", "employment_type");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employees_deleted_at" 
        ON "employees" ("deleted_at") 
        WHERE "deleted_at" IS NULL;
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }

  // Add comments
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE employees IS 'Employee records with personal and employment information';
    COMMENT ON COLUMN employees.employee_number IS 'Unique employee identifier within tenant';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if table exists before dropping (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employees'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("employees");
  }
}

