import dotenv from "dotenv";
import { execSync } from "child_process";
import path from "path";

/**
 * Vitest global setup runs once per test run (as opposed to per-suite `beforeAll`).
 * We use it to migrate the test database before any suites execute.
 */
export default async function globalSetup(): Promise<void> {
  // Ensure `.env.test` is loaded for migration + runtime configuration.
  dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

  try {
    // Reset the test database so suites don't collide on unique constraints.
    // This script also runs migrations on the fresh database.
    execSync("npm run db:reset:test", {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });

    // Seed required fixture data (admin@fixture.local, tenant, salary components, etc.)
    execSync("npm run seed:fixtures:test", {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });

    // Seed RBAC so endpoints that require roles (like employee creation) work.
    execSync("npm run seed:rbac", {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });
  } catch (error) {
    // Let Vitest surface the failure with context.
    console.error("Failed to run migrations for tests", error);
    throw error;
  }
}

