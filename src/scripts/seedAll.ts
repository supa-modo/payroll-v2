import dotenv from "dotenv";
import { sequelize } from "../config/database";
import seedRolesAndPermissions from "./seedRolesAndPermissions";
import { Tenant } from "../models";
import logger from "../utils/logger";
import "../migrations/run";
import { bootstrapSystemAdmin } from "./bootstrapSystemAdmin";

dotenv.config();

async function seedAll() {
  await sequelize.authenticate();

  // 1) Run migrations up via existing runner CLI (assumed already run before calling this in most flows)
  logger.info("Assuming migrations are up to date (run migrate:up beforehand).");

  // 2) Seed roles & permissions (system-wide)
  await seedRolesAndPermissions();

  // 3) Bootstrap system admin
  await bootstrapSystemAdmin();

  // 4) Optionally ensure at least one demo tenant exists (non-destructive)
  await Tenant.findOrCreate({
    where: { slug: "kenya-corp" },
    defaults: {
      name: "KENYA_CORP LTD",
      slug: "kenya-corp",
      email: "info@kenyacorp.co.ke",
      settings: {},
      isActive: true,
    },
  });
}

if (require.main === module) {
  seedAll()
    .then(() => {
      logger.info("Seed all completed");
      process.exit(0);
    })
    .catch((err) => {
      logger.error("Seed all failed", err as Error);
      process.exit(1);
    });
}

