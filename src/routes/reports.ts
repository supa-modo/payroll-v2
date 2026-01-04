/**
 * Report Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { exportLimiter } from "../middleware/exportRateLimiter";
import { getPayrollReports, getExpenseReports, exportReport } from "../controllers/reportController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Payroll reports - require reports:view:payroll permission
router.get("/payroll", requirePermission("reports:view:payroll"), getPayrollReports);

// Expense reports - require reports:view:expenses permission
router.get("/expenses", requirePermission("reports:view:expenses"), getExpenseReports);

// Export reports - require reports:export permission and rate limiting
router.get("/export", exportLimiter, requirePermission("reports:export"), exportReport);

export default router;

