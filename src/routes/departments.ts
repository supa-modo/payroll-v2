/**
 * Department Routes
 */

import { Router } from "express";
import * as departmentController from "../controllers/departmentController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { body, handleValidationErrors } from "../middleware/validator";

const router = Router();

// Protect all routes
router.use(authenticateToken);
// Require department management permission
router.use(requirePermission("department:manage"));

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private
 */
router.get("/", departmentController.getDepartments);

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department
 * @access  Private
 */
router.get("/:id", departmentController.getDepartment);

/**
 * @route   POST /api/departments
 * @desc    Create department
 * @access  Private
 */
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Department name is required"),
    body("description").optional(),
    body("code").optional().isString().withMessage("Code must be a string"),
    body("managerId")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      })
      .withMessage("Invalid manager ID"),
    body("parentDepartmentId")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      })
      .withMessage("Invalid parent department ID"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    handleValidationErrors,
  ],
  departmentController.createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private
 */
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().withMessage("Department name cannot be empty"),
    body("description").optional(),
    body("code").optional().isString().withMessage("Code must be a string"),
    body("managerId")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      })
      .withMessage("Invalid manager ID"),
    body("parentDepartmentId")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      })
      .withMessage("Invalid parent department ID"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    handleValidationErrors,
  ],
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private
 */
router.delete("/:id", departmentController.deleteDepartment);

export default router;

