import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDashboardStats } from "../controllers/dashboardController";

const router = Router();

router.use(authenticateToken);
router.get("/stats", requirePermission("payroll:read"), getDashboardStats);

export default router;
