/**
 * Migration: Create Refresh Tokens Table
 *
 * This migration creates the refresh_tokens table for JWT refresh token management
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if table already exists (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'refresh_tokens'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    // Create refresh_tokens table
    await queryInterface.createTable("refresh_tokens", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      device_info: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create indexes (idempotent)
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user" 
        ON "refresh_tokens" ("user_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_hash" 
        ON "refresh_tokens" ("token_hash");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }

  // Add comments
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for JWT authentication';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if table exists before dropping (idempotent)
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'refresh_tokens'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("refresh_tokens");
  }
}

