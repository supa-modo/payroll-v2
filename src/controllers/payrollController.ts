/**
 * Payroll Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Payroll, PayrollPeriod, Employee, PayrollItem } from "../models";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import { trackChange } from "../services/dataChangeHistoryService";

/**
 * Get all payrolls for a period
 */
export async function getPayrolls(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { periodId } = req.params;

    // If periodId is not provided (e.g., called from /api/payrolls), return error
    if (!periodId) {
      res.status(400).json({ error: "Period ID is required" });
      return;
    }

    // Verify period belongs to tenant
    const period = await PayrollPeriod.findOne({
      where: {
        id: periodId,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: periodId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "jobTitle"],
        },
        {
          model: PayrollItem,
          as: "items",
        },
      ],
      order: [[{ model: Employee, as: "employee" }, "lastName", "ASC"]],
    });

    res.json({ payrolls });
  } catch (error: any) {
    logger.error("Get payrolls error:", error);
    res.status(500).json({ error: "Failed to get payrolls" });
  }
}

/**
 * Get single payroll
 */
export async function getPayroll(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;

    const payroll = await Payroll.findOne({
      where: {
        id,
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
        },
        {
          model: Employee,
          as: "employee",
        },
        {
          model: PayrollItem,
          as: "items",
        },
      ],
    });

    if (!payroll) {
      res.status(404).json({ error: "Payroll not found" });
      return;
    }

    // Verify tenant access
    const period = payroll.get("payrollPeriod") as PayrollPeriod;
    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ payroll });
  } catch (error: any) {
    logger.error("Get payroll error:", error);
    res.status(500).json({ error: "Failed to get payroll" });
  }
}

/**
 * Update payroll (before approval)
 */
export async function updatePayroll(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;
    const { paymentMethod, bankAccount, mpesaPhone } = req.body;

    const payroll = await Payroll.findOne({
      where: {
        id,
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
        },
      ],
    });

    if (!payroll) {
      res.status(404).json({ error: "Payroll not found" });
      return;
    }

    // Verify tenant access
    const period = payroll.get("payrollPeriod") as PayrollPeriod;
    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (period.status === "locked" || period.status === "paid") {
      res.status(400).json({ error: "Cannot update payroll for locked or paid period" });
      return;
    }

    // Track changes
    if (paymentMethod !== undefined && payroll.paymentMethod !== paymentMethod) {
      await trackChange({
        tenantId,
        entityType: "Payroll",
        entityId: payroll.id,
        fieldName: "paymentMethod",
        oldValue: payroll.paymentMethod,
        newValue: paymentMethod,
        changedBy: req.user.id,
      });
    }

    await payroll.update({
      paymentMethod,
      bankAccount,
      mpesaPhone,
    });

    res.json({ payroll });
  } catch (error: any) {
    logger.error("Update payroll error:", error);
    res.status(500).json({ error: "Failed to update payroll" });
  }
}

/**
 * Approve individual payroll
 */
export async function approvePayroll(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;

    const payroll = await Payroll.findOne({
      where: {
        id,
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
        },
      ],
    });

    if (!payroll) {
      res.status(404).json({ error: "Payroll not found" });
      return;
    }

    // Verify tenant access
    const period = payroll.get("payrollPeriod") as PayrollPeriod;
    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (payroll.status !== "pending") {
      res.status(400).json({ error: "Payroll must be in pending status" });
      return;
    }

    await payroll.update({
      status: "approved",
    });

    res.json({ payroll });
  } catch (error: any) {
    logger.error("Approve payroll error:", error);
    res.status(500).json({ error: "Failed to approve payroll" });
  }
}

/**
 * Mark payroll as paid
 */
export async function markPayrollAsPaid(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;
    const { paymentReference } = req.body;

    const payroll = await Payroll.findOne({
      where: {
        id,
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
        },
      ],
    });

    if (!payroll) {
      res.status(404).json({ error: "Payroll not found" });
      return;
    }

    // Verify tenant access
    const period = payroll.get("payrollPeriod") as PayrollPeriod;
    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (payroll.status !== "approved") {
      res.status(400).json({ error: "Payroll must be approved before marking as paid" });
      return;
    }

    await payroll.update({
      status: "paid",
      paidAt: new Date(),
      paymentReference,
    });

    res.json({ payroll });
  } catch (error: any) {
    logger.error("Mark payroll as paid error:", error);
    res.status(500).json({ error: "Failed to mark payroll as paid" });
  }
}

