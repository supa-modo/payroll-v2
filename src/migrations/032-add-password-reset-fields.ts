/**
 * Migration: Add Password Reset Fields
 * Adds password reset token and expiry fields to users table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if password_reset_token column exists (idempotent)
  const tokenColumnExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'password_reset_token'
    );
  `);

  if (!(tokenColumnExists[0][0] as any).exists) {
    await queryInterface.addColumn("users", "password_reset_token", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  }

  // Check if password_reset_expires column exists (idempotent)
  const expiresColumnExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'password_reset_expires'
    );
  `);

  if (!(expiresColumnExists[0][0] as any).exists) {
    await queryInterface.addColumn("users", "password_reset_expires", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  // Check if index already exists (idempotent)
  const indexExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND indexname = 'idx_users_password_reset_token'
    );
  `);

  if (!(indexExists[0][0] as any).exists) {
    // Add index on password_reset_token for faster lookups
    // Using raw SQL to create partial index
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_password_reset_token" 
      ON "users" ("password_reset_token") 
      WHERE "password_reset_token" IS NOT NULL;
    `);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Check if index exists before removing
  const indexExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND indexname = 'idx_users_password_reset_token'
    );
  `);

  if ((indexExists[0][0] as any).exists) {
    await queryInterface.removeIndex("users", "idx_users_password_reset_token");
  }

  // Check if columns exist before removing
  const expiresColumnExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'password_reset_expires'
    );
  `);

  if ((expiresColumnExists[0][0] as any).exists) {
    await queryInterface.removeColumn("users", "password_reset_expires");
  }

  const tokenColumnExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'password_reset_token'
    );
  `);

  if ((tokenColumnExists[0][0] as any).exists) {
    await queryInterface.removeColumn("users", "password_reset_token");
  }
}

