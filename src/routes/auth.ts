/**
 * Authentication Routes
 */

import { Router } from "express";
import * as authController from "../controllers/authController";
import { body, handleValidationErrors } from "../middleware/validator";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new tenant and admin user
 * @access  Public
 */
router.post(
  "/register",
  [
    body("organizationName")
      .notEmpty()
      .withMessage("Organization name is required"),
    body("organizationSlug")
      .notEmpty()
      .withMessage("Organization slug is required")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug must contain only lowercase letters, numbers, and hyphens"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    handleValidationErrors,
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get access + refresh tokens
 * @access  Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token)
 */
router.post("/refresh", authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticateToken, authController.getCurrentUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    handleValidationErrors,
  ],
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    handleValidationErrors,
  ],
  authController.resetPassword
);

/**
 * @route   POST /api/auth/onboarding/complete
 * @desc    Mark onboarding as complete
 * @access  Private
 */
router.post(
  "/onboarding/complete",
  authenticateToken,
  authController.completeOnboarding
);

export default router;

