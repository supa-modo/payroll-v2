/**
 * Authentication Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User, Tenant, Role, UserRole } from "../models";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";
import logger from "../utils/logger";
import { createTenantAdminRole } from "../seeders/rolesAndPermissions";

/**
 * Register a new tenant and admin user
 */
export async function register(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const transaction = await User.sequelize!.transaction();

  try {
    const {
      organizationName,
      organizationSlug,
      organizationEmail,
      firstName,
      lastName,
      email,
      password,
    } = req.body;

    // Validate required fields
    if (!organizationName || !organizationSlug || !email || !password) {
      await transaction.rollback();
      res.status(400).json({
        error: "Organization name, slug, email, and password are required",
      });
      return;
    }

    // Check if tenant with slug already exists
    const existingTenant = await Tenant.findOne({
      where: { slug: organizationSlug },
      transaction,
    });
    if (existingTenant) {
      await transaction.rollback();
      res.status(409).json({ error: "Organization slug already exists" });
      return;
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({
      where: { email },
      transaction,
    });
    if (existingUser) {
      await transaction.rollback();
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    // Create tenant
    const tenant = await Tenant.create(
      {
        name: organizationName,
        slug: organizationSlug,
        email: organizationEmail || email,
        isActive: true,
        settings: {},
      },
      { transaction }
    );

    // Create admin user
    const user = await User.create(
      {
        tenantId: tenant.id,
        email,
        password,
        firstName,
        lastName,
        role: "admin", // Legacy field, kept for backward compatibility
        isActive: true,
        isEmailVerified: false,
      },
      { transaction }
    );

    // Find or create "Admin" role for this tenant
    let adminRole = await Role.findOne({
      where: {
        tenantId: tenant.id,
        name: "Admin",
      },
      transaction,
    });

    if (!adminRole) {
      // Create tenant-specific Admin role with all permissions
      adminRole = await createTenantAdminRole(tenant.id);
    }

    // Assign user to Admin role
    await UserRole.create(
      {
        userId: user.id,
        roleId: adminRole.id,
        assignedBy: user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    res.status(201).json({
      message: "Registration successful",
      user: user.toJSON(),
      tenant: tenant.toJSON(),
      ...tokens,
    });
  } catch (error: any) {
    await transaction.rollback();
    logger.error("Registration error:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors?.[0]?.path || "field";
      res.status(409).json({ error: `${field} already exists` });
      return;
    }

    if (error.name === "SequelizeValidationError") {
      const message = error.errors?.[0]?.message || "Validation failed";
      res.status(400).json({ error: message });
      return;
    }

    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
}

/**
 * Login user
 */
export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include: [{ model: Tenant, as: "tenant" }],
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is inactive" });
      return;
    }

    // Verify password
    if (!(await user.validatePassword(password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      ...tokens,
    });
  } catch (error: any) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(payload.sub);

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Generate new access token
    const { generateAccessToken } = await import("../utils/jwt");
    const accessToken = generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    res.json({
      accessToken,
    });
  } catch (error: any) {
    logger.error("Refresh token error:", error);
    if (error.message === "Refresh token expired") {
      res.status(401).json({ error: "Refresh token expired" });
      return;
    }
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      include: [{ model: Tenant, as: "tenant" }],
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user: user.toJSON(),
    });
  } catch (error: any) {
    logger.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
}

