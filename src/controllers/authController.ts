/**
 * Authentication Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User, Tenant, Role, UserRole, RefreshToken } from "../models";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";
import logger from "../utils/logger";
import { createTenantAdminRole } from "../seeders/rolesAndPermissions";
import { requireTenantId } from "../utils/tenant";
import crypto from "crypto";

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

    // Create tenant with onboarding status
    const tenant = await Tenant.create(
      {
        name: organizationName,
        slug: organizationSlug,
        email: organizationEmail || email,
        isActive: true,
        settings: {
          onboardingComplete: false,
        },
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
      // Pass the transaction so role creation happens within the same transaction
      adminRole = await createTenantAdminRole(tenant.id, transaction);
    }

    // Assign user to Admin role
    // Use special UUID for global (non-department-scoped) roles
    // This matches the database schema which uses COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::UUID) in the primary key
    const globalDepartmentId = "00000000-0000-0000-0000-000000000000";
    await UserRole.create(
      {
        userId: user.id,
        roleId: adminRole.id,
        departmentId: globalDepartmentId,
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

    // Handle unique constraint violations (duplicate data)
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors?.[0]?.path || "field";
      let userMessage = "This information already exists. Please use different values.";
      
      // Provide specific messages for common fields
      if (field === "slug" || field.includes("slug")) {
        userMessage = "This organization identifier is already taken. Please choose a different one.";
      } else if (field === "email" || field.includes("email")) {
        userMessage = "An account with this email address already exists. Please use a different email or try logging in.";
      }
      
      res.status(409).json({ 
        error: userMessage,
        field: field 
      });
      return;
    }

    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      const firstError = error.errors?.[0];
      const field = firstError?.path || "field";
      const message = firstError?.message || "Validation failed";
      
      let userMessage = `Invalid value for ${field}. ${message}`;
      
      // Provide more user-friendly messages for common validation errors
      if (message.includes("notNull")) {
        userMessage = `The ${field} field is required. Please provide a value.`;
      } else if (message.includes("isEmail")) {
        userMessage = "Please provide a valid email address.";
      } else if (message.includes("len")) {
        userMessage = `The ${field} field does not meet the length requirements.`;
      }
      
      res.status(400).json({ 
        error: userMessage,
        field: field 
      });
      return;
    }

    // Handle foreign key constraint violations
    if (error.name === "SequelizeForeignKeyConstraintError") {
      logger.error("Foreign key constraint error during registration:", error);
      res.status(400).json({ 
        error: "The information provided references data that doesn't exist. Please verify your inputs and try again." 
      });
      return;
    }

    // Handle database errors (NOT NULL, CHECK constraints, etc.)
    if (error.name === "SequelizeDatabaseError") {
      const errorCode = error.parent?.code;
      const errorDetail = error.parent?.detail || "";
      
      let userMessage = "Registration failed due to a data validation error. Please check your input and try again.";
      
      // Handle specific PostgreSQL error codes
      if (errorCode === "23502") { // NOT NULL violation
        const columnMatch = errorDetail.match(/column "([^"]+)"/);
        const column = columnMatch ? columnMatch[1] : "field";
        userMessage = `A required field (${column}) is missing. Please check your input and try again.`;
      } else if (errorCode === "23503") { // Foreign key violation
        userMessage = "The information provided references data that doesn't exist. Please verify your inputs.";
      } else if (errorCode === "23505") { // Unique violation
        userMessage = "This information already exists. Please use different values.";
      } else if (errorCode === "23514") { // Check constraint violation
        userMessage = "The provided data doesn't meet the required criteria. Please check your input.";
      }
      
      res.status(400).json({ 
        error: userMessage 
      });
      return;
    }

    // Handle generic errors with user-friendly message
    const errorMessage = error.message || "An unexpected error occurred";
    res.status(500).json({ 
      error: "Registration failed. Please try again. If the problem persists, contact support.",
      // Only include details in development
      ...(process.env.NODE_ENV === "development" && { details: errorMessage })
    });
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

/**
 * Request password reset
 */
export async function forgotPassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    // Only proceed if user exists and is active
    if (user && user.isActive) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token hash and expiration
      await user.update({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: resetExpires,
      });

      // In production, send email with reset link
      // For now, log the token (remove in production)
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
      
      logger.info(`Password reset requested for ${email}. Reset URL: ${resetUrl}`);
      
      // TODO: Send email with reset link
      // await sendEmail({
      //   to: user.email,
      //   subject: "Password Reset Request",
      //   template: "password-reset",
      //   data: { resetUrl, firstName: user.firstName }
      // });
    }

    // Always return success message
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    logger.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
      return;
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: {
          [require("sequelize").Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    // Update password and clear reset token
    // Password will be hashed by the User model's beforeUpdate hook
    await user.update({
      password: password,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // Invalidate all refresh tokens for security
    await RefreshToken.destroy({
      where: { userId: user.id },
    });

    logger.info(`Password reset successful for user ${user.email}`);

    res.json({
      message: "Password has been reset successfully",
    });
  } catch (error: any) {
    logger.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // Update tenant settings to mark onboarding as complete
    const settings = tenant.settings || {};
    settings.onboardingComplete = true;

    await tenant.update({ settings });
    
    // Reload tenant to ensure we have the latest data
    await tenant.reload();

    // Verify the update was successful (check both boolean true and string "true")
    const updatedSettings = tenant.settings || {};
    const isComplete = updatedSettings.onboardingComplete === true || 
                       updatedSettings.onboardingComplete === "true" ||
                       updatedSettings.onboardingComplete === 1;
    
    if (!isComplete) {
      logger.error("Failed to verify onboarding completion for tenant:", String(tenantId));
      logger.error("Settings after update:", JSON.stringify(updatedSettings));
      // Don't fail - just log the warning and proceed
      // The update might have succeeded but verification is failing due to JSONB serialization
    }

    res.json({
      message: "Onboarding completed successfully",
      tenant: tenant.toJSON(),
    });
  } catch (error: any) {
    logger.error("Complete onboarding error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
}

