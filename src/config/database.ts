import dotenv from "dotenv";
import { Sequelize } from "sequelize";

// Load environment variables before reading them
dotenv.config();

/**
 * Database configuration for different environments
 */

const databaseConfig = {
  development: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "5433", 10),
    database: process.env.DB_NAME || "payroll_dev",
    username: process.env.DB_USER || "payroll",
    password: process.env.DB_PASSWORD || "payroll123",
    dialect: "postgres" as const,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: undefined as any,
  },
  test: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5433", 10),
    database: process.env.DB_NAME || "payroll_test",
    username: process.env.DB_USER || "payroll",
    password: process.env.DB_PASSWORD || "payroll123",
    dialect: "postgres" as const,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: undefined as any,
  },
  production: {
    host: process.env.DB_HOST || (() => {
      throw new Error("DB_HOST is required in production");
    })(),
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || (() => {
      throw new Error("DB_NAME is required in production");
    })(),
    username: process.env.DB_USER || (() => {
      throw new Error("DB_USER is required in production");
    })(),
    password: process.env.DB_PASSWORD || (() => {
      throw new Error("DB_PASSWORD is required in production");
    })(),
    dialect: "postgres" as const,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions:
      process.env.ENABLE_DB_SSL === "true"
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {
            ssl: false,
          },
  },
};

const env = (process.env.NODE_ENV || "development") as string;

const effectiveEnv: keyof typeof databaseConfig =
  env === "development" || env === "test" || env === "production"
    ? (env as keyof typeof databaseConfig)
    : "development";

const config = databaseConfig[effectiveEnv] || databaseConfig.development;

if (!config) {
  throw new Error(`Invalid database configuration for environment: ${env}`);
}

// Debug logging (remove in production)
if (process.env.NODE_ENV === "development") {
  console.log("🔍 Database Config:", {
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password ? "***" + config.password.slice(-3) : "not set",
  });
}

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    dialectOptions: config.dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
    return false;
  }
}

export default sequelize;

