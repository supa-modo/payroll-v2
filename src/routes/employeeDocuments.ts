/**
 * Employee Document Routes
 */

import { Router } from "express";
import * as documentController from "../controllers/employeeDocumentController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { uploadSingle } from "../middleware/upload";
import { body, handleValidationErrors } from "../middleware/validator";

const router = Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route   GET /api/employees/:employeeId/documents
 * @desc    Get all documents for employee
 * @access  Private
 */
router.get(
  "/:employeeId/documents",
  requirePermission("employee:read"),
  documentController.getDocuments
);

/**
 * @route   POST /api/employees/:employeeId/documents
 * @desc    Upload document
 * @access  Private
 */
router.post(
  "/:employeeId/documents",
  [
    requirePermission("employee:update"),
    uploadSingle("document"),
    body("documentType").optional(),
    body("documentName").optional(),
    body("expiryDate")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Invalid expiry date format (expected YYYY-MM-DD)"),
    handleValidationErrors,
  ],
  documentController.uploadDocument
);

/**
 * @route   GET /api/employees/:employeeId/documents/:id
 * @desc    Get document details
 * @access  Private
 */
router.get(
  "/:employeeId/documents/:id",
  requirePermission("employee:read"),
  documentController.getDocument
);

/**
 * @route   GET /api/employees/:employeeId/documents/:id/download
 * @desc    Download document file
 * @access  Private
 */
router.get(
  "/:employeeId/documents/:id/download",
  requirePermission("employee:read"),
  documentController.downloadDocument
);

/**
 * @route   PUT /api/employees/:employeeId/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
router.put(
  "/:employeeId/documents/:id",
  [
    requirePermission("employee:update"),
    body("documentType").optional(),
    body("documentName").optional(),
    body("expiryDate")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Invalid expiry date format (expected YYYY-MM-DD)"),
    handleValidationErrors,
  ],
  documentController.updateDocument
);

/**
 * @route   DELETE /api/employees/:employeeId/documents/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete(
  "/:employeeId/documents/:id",
  requirePermission("employee:update"),
  documentController.deleteDocument
);

/**
 * @route   POST /api/employees/:employeeId/documents/:id/verify
 * @desc    Verify document
 * @access  Private
 */
router.post(
  "/:employeeId/documents/:id/verify",
  requirePermission("employee:update"),
  documentController.verifyDocument
);

export default router;

