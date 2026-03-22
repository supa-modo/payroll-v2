import dotenv from "dotenv";
import { sequelize } from "../config/database";
import { User } from "../models";
import logger from "../utils/logger";

dotenv.config();

export async function bootstrapSystemAdmin() {
  const email = process.env.SYSTEM_ADMIN_EMAIL;
  const password = process.env.SYSTEM_ADMIN_PASSWORD;
  const firstName = process.env.SYSTEM_ADMIN_FIRST_NAME || "System";
  const lastName = process.env.SYSTEM_ADMIN_LAST_NAME || "Admin";

  if (!email || !password) {
    logger.error("SYSTEM_ADMIN_EMAIL and SYSTEM_ADMIN_PASSWORD must be set");
    process.exit(1);
  }

  await sequelize.authenticate();

  const [user, created] = await User.findOrCreate({
    where: {
      email,
      tenantId: null,
    },
    defaults: {
      email,
      password,
      firstName,
      lastName,
      role: "super_admin",
      isSystemAdmin: true,
      isActive: true,
      isEmailVerified: true,
      tenantId: null,
    },
  });

  if (!created) {
    // Ensure flags are correct if user already existed
    user.isSystemAdmin = true;
    user.role = "super_admin";
    user.isActive = true;
    if (!user.firstName) user.firstName = firstName;
    if (!user.lastName) user.lastName = lastName;
    await user.save();
    logger.info(`Updated existing system admin user: ${email}`);
  } else {
    logger.info(`Created system admin user: ${email}`);
  }
}

if (require.main === module) {
  bootstrapSystemAdmin()
    .then(() => {
      logger.info("System admin bootstrap completed");
      process.exit(0);
    })
    .catch((err) => {
      logger.error("System admin bootstrap failed", err as Error);
      process.exit(1);
    });
}

