import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  assignEmployeeReliefs,
  createSalaryRelief,
  deleteSalaryRelief,
  getSalaryReliefs,
  updateSalaryRelief,
} from "../controllers/salaryReliefController";

const router = Router();

router.use(authenticateToken);

router.get("/", requirePermission("salary:configure"), getSalaryReliefs);
router.post("/", requirePermission("salary:configure"), createSalaryRelief);
router.put("/:id", requirePermission("salary:configure"), updateSalaryRelief);
router.delete("/:id", requirePermission("salary:configure"), deleteSalaryRelief);
router.post(
  "/employees/:employeeId",
  requirePermission("salary:assign"),
  assignEmployeeReliefs
);

export default router;
