import { sequelize } from "../config/database";
import { Tenant, User, Department } from "../models";
import logger from "../utils/logger";

const seed = async () => {
  try {
    await sequelize.authenticate();
    // Sync to ensure tables exist
    await sequelize.sync({ alter: true });

    logger.info("🌱 Starting seed...");

    // 1. Create Tenant
    const tenantData = {
      name: "Acme Corporation",
      slug: "acme-corp",
      email: "admin@acme.com",
      settings: {},
      isActive: true,
    };

    const [tenant, created] = await Tenant.findOrCreate({
      where: { slug: tenantData.slug },
      defaults: tenantData,
    });

    if (created) {
      logger.info("✅ Tenant created:", tenant.name);
    } else {
      logger.info("ℹ️ Tenant already exists:", tenant.name);
    }

    // 2. Create Admin User
    const adminData = {
      tenantId: tenant.id,
      email: "admin@acme.com",
      password: "password123", // Will be hashed by hooks
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isEmailVerified: true,
      isActive: true,
    };

    const existingUser = await User.findOne({
      where: { email: adminData.email, tenantId: tenant.id },
    });

    if (!existingUser) {
      const adminUser = await User.create(adminData);
      logger.info("✅ Admin user created:", adminUser.email);
    } else {
      logger.info("ℹ️ Admin user already exists:", adminData.email);
    }

    // 3. Create Sample Departments
    const departments = [
      {
        name: "Finance",
        description: "Finance and Accounting Department",
        tenantId: tenant.id,
      },
      {
        name: "Human Resources",
        description: "HR Department",
        tenantId: tenant.id,
      },
      {
        name: "Engineering",
        description: "Software Engineering Department",
        tenantId: tenant.id,
      },
    ];

    for (const deptData of departments) {
      const [dept, deptCreated] = await Department.findOrCreate({
        where: { name: deptData.name, tenantId: tenant.id },
        defaults: deptData,
      });

      if (deptCreated) {
        logger.info("✅ Department created:", dept.name);
      }
    }

    logger.info("✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seed();

