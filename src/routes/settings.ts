/**
 * Settings Routes
 */

import { Router } from "express";
import * as systemSettingController from "../controllers/systemSettingController";
import * as statutoryRateController from "../controllers/statutoryRateController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { param, body, query } from "express-validator";
import { handleValidationErrors } from "../middleware/validator";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private
 */
router.get("/", systemSettingController.getSettings);

/**
 * @route   GET /api/settings/statutory-rates
 * @desc    Get all statutory rates
 * @access  Private
 */
router.get(
  "/statutory-rates",
  [
    query("country").optional().isString().withMessage("Country must be a string"),
    handleValidationErrors,
  ],
  statutoryRateController.getStatutoryRates
);

/**
 * @route   POST /api/settings/statutory-rates
 * @desc    Create statutory rate
 * @access  Private (requires settings:manage permission)
 */
router.post(
  "/statutory-rates",
  requirePermission("settings:manage"),
  [
    body("rateType")
      .isIn(["PAYE", "NSSF", "NHIF"])
      .withMessage("Rate type must be PAYE, NSSF, or NHIF"),
    body("effectiveFrom").isISO8601().withMessage("Effective from date must be a valid date"),
    body("effectiveTo").optional().isISO8601().withMessage("Effective to date must be a valid date"),
    body("country").optional().isString().withMessage("Country must be a string"),
    body("config").isObject().withMessage("Config must be an object"),
    handleValidationErrors,
  ],
  statutoryRateController.createStatutoryRate
);

/**
 * @route   PUT /api/settings/statutory-rates/:id
 * @desc    Update statutory rate
 * @access  Private (requires settings:manage permission)
 */
router.put(
  "/statutory-rates/:id",
  requirePermission("settings:manage"),
  [
    param("id").isUUID().withMessage("Invalid rate ID"),
    body("effectiveFrom").optional().isISO8601().withMessage("Effective from date must be a valid date"),
    body("effectiveTo").optional().isISO8601().withMessage("Effective to date must be a valid date"),
    body("config").optional().isObject().withMessage("Config must be an object"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    handleValidationErrors,
  ],
  statutoryRateController.updateStatutoryRate
);

/**
 * @route   DELETE /api/settings/statutory-rates/:id
 * @desc    Delete statutory rate
 * @access  Private (requires settings:manage permission)
 */
router.delete(
  "/statutory-rates/:id",
  requirePermission("settings:manage"),
  [param("id").isUUID().withMessage("Invalid rate ID"), handleValidationErrors],
  statutoryRateController.deleteStatutoryRate
);

/**
 * @route   GET /api/settings/:key
 * @desc    Get setting by key
 * @access  Private
 * @note    This route must come after specific routes like /statutory-rates
 */
router.get(
  "/:key",
  [param("key").notEmpty().withMessage("Setting key is required"), handleValidationErrors],
  systemSettingController.getSetting
);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update setting
 * @access  Private (requires settings:manage permission)
 */
router.put(
  "/:key",
  requirePermission("settings:manage"),
  [
    param("key").notEmpty().withMessage("Setting key is required"),
    body("value").notEmpty().withMessage("Setting value is required"),
    handleValidationErrors,
  ],
  systemSettingController.updateSetting
);

export default router;

