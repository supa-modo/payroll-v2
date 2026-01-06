/**
 * Migration: Create Employee Documents Table
 *
 * This migration creates the employee_documents table for document management
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if table already exists (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_documents'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    // Create employee_documents table
    await queryInterface.createTable("employee_documents", {
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
      document_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      document_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      verified_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      verified_at: {
        type: DataTypes.DATE,
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
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Create indexes (idempotent)
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_employee_documents" 
        ON "employee_documents" ("employee_id") 
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
    COMMENT ON TABLE employee_documents IS 'Documents associated with employees';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if table exists before dropping (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_documents'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("employee_documents");
  }
}

