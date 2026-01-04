/**
 * Payroll Period Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PayrollPeriod, Payroll, Employee, LoanRepayment } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import { calculateEmployeePayroll, getActiveLoansForPeriod } from "../services/payrollCalculationService";

/**
 * Get all payroll periods
 */
export async function getPayrollPeriods(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { status, periodType, page = 1, limit = 30 } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (periodType) {
      whereClause.periodType = periodType;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: periods } = await PayrollPeriod.findAndCountAll({
      where: whereClause,
      order: [["startDate", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      periods,
      total: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error: any) {
    logger.error("Get payroll periods error:", error);
    res.status(500).json({ error: "Failed to get payroll periods" });
  }
}

/**
 * Get single payroll period
 */
export async function getPayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: Payroll,
          as: "payrolls",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "firstName", "lastName", "employeeNumber"],
            },
          ],
        },
      ],
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    res.json({ period });
  } catch (error: any) {
    logger.error("Get payroll period error:", error);
    res.status(500).json({ error: "Failed to get payroll period" });
  }
}

/**
 * Create payroll period
 */
export async function createPayrollPeriod(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { name, periodType, startDate, endDate, payDate } = req.body;

    // Check for overlapping periods
    const overlapping = await PayrollPeriod.findOne({
      where: {
        tenantId,
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
        status: { [Op.ne]: "locked" },
      },
    });

    if (overlapping) {
      res.status(400).json({ error: "Period overlaps with existing period" });
      return;
    }

    const period = await PayrollPeriod.create({
      tenantId,
      name,
      periodType,
      startDate,
      endDate,
      payDate,
      status: "draft",
      totalEmployees: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      createdBy: req.user.id,
    });

    res.status(201).json({ period });
  } catch (error: any) {
    logger.error("Create payroll period error:", error);
    res.status(500).json({ error: "Failed to create payroll period" });
  }
}

/**
 * Update payroll period
 */
export async function updatePayrollPeriod(
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
    const { name, periodType, startDate, endDate, payDate } = req.body;

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status === "locked" || period.status === "paid") {
      res.status(400).json({ error: "Cannot update locked or paid period" });
      return;
    }

    await period.update({
      name,
      periodType,
      startDate,
      endDate,
      payDate,
      updatedBy: req.user.id,
    });

    res.json({ period });
  } catch (error: any) {
    logger.error("Update payroll period error:", error);
    res.status(500).json({ error: "Failed to update payroll period" });
  }
}

/**
 * Process payroll for period
 */
export async function processPayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status !== "draft" && period.status !== "pending_approval") {
      res.status(400).json({ error: "Period cannot be processed in current status" });
      return;
    }

    // Update status to processing
    await period.update({
      status: "processing",
      processedBy: req.user.id,
    });

    // Get all active employees for the tenant
    const employees = await Employee.findAll({
      where: {
        tenantId,
        status: "active",
      },
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    // Process payroll for each employee
    for (const employee of employees) {
      try {
        const calculation = await calculateEmployeePayroll(
          employee,
          new Date(period.startDate),
          new Date(period.endDate)
        );

        // Check if payroll already exists
        let payroll = await Payroll.findOne({
          where: {
            payrollPeriodId: period.id,
            employeeId: employee.id,
          },
        });

        if (payroll) {
          // Update existing payroll
          await payroll.update({
            grossPay: calculation.grossPay,
            totalEarnings: calculation.grossPay,
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,
            payeAmount: calculation.statutoryDeductions.paye,
            nssfAmount: calculation.statutoryDeductions.nssf,
            nhifAmount: calculation.statutoryDeductions.nhif,
            status: "pending",
          });
        } else {
          // Create new payroll
          payroll = await Payroll.create({
            payrollPeriodId: period.id,
            employeeId: employee.id,
            grossPay: calculation.grossPay,
            totalEarnings: calculation.grossPay,
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,
            payeAmount: calculation.statutoryDeductions.paye,
            nssfAmount: calculation.statutoryDeductions.nssf,
            nhifAmount: calculation.statutoryDeductions.nhif,
            status: "pending",
          });
        }

        // Process loan repayments
        const activeLoans = await getActiveLoansForPeriod(
          employee.id,
          new Date(period.startDate),
          new Date(period.endDate)
        );

        for (const loan of activeLoans) {
          const monthlyDeduction = parseFloat(loan.monthlyDeduction.toString());
          const remainingBalance = parseFloat(loan.remainingBalance.toString());

          if (remainingBalance <= 0) {
            continue; // Skip fully paid loans
          }

          // Calculate deduction amount (monthly deduction or remaining balance, whichever is smaller)
          const deductionAmount = Math.min(monthlyDeduction, remainingBalance);
          const newBalance = remainingBalance - deductionAmount;
          const newTotalPaid = parseFloat(loan.totalPaid.toString()) + deductionAmount;

          // Create repayment record
          await LoanRepayment.create({
            loanId: loan.id,
            payrollId: payroll.id,
            amount: deductionAmount,
            repaymentDate: period.endDate,
            paymentType: "payroll",
            balanceAfter: newBalance,
            notes: `Automatic deduction from payroll period ${period.name}`,
            createdBy: req.user.id,
          });

          // Update loan
          const updatedStatus = newBalance <= 0 ? "completed" : "active";
          await loan.update({
            remainingBalance: newBalance,
            totalPaid: newTotalPaid,
            status: updatedStatus,
            updatedBy: req.user.id,
          });
        }

        totalGross += calculation.grossPay;
        totalDeductions += calculation.totalDeductions;
        totalNet += calculation.netPay;
      } catch (error: any) {
        logger.error(`Error processing payroll for employee ${employee.id}:`, error);
        // Continue with next employee
      }
    }

    // Update period totals
    await period.update({
      status: "pending_approval",
      totalEmployees: employees.length,
      totalGross,
      totalDeductions,
      totalNet,
      processedAt: new Date(),
    });

    res.json({
      message: "Payroll processed successfully",
      period,
      summary: {
        totalEmployees: employees.length,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  } catch (error: any) {
    logger.error("Process payroll period error:", error);
    res.status(500).json({ error: "Failed to process payroll period" });
  }
}

/**
 * Approve payroll period
 */
export async function approvePayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status !== "pending_approval") {
      res.status(400).json({ error: "Period must be in pending_approval status" });
      return;
    }

    await period.update({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: req.user.id,
    });

    res.json({ period });
  } catch (error: any) {
    logger.error("Approve payroll period error:", error);
    res.status(500).json({ error: "Failed to approve payroll period" });
  }
}

/**
 * Lock payroll period
 */
export async function lockPayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status !== "approved") {
      res.status(400).json({ error: "Period must be approved before locking" });
      return;
    }

    await period.update({
      status: "locked",
      lockedAt: new Date(),
      lockedBy: req.user.id,
    });

    res.json({ period });
  } catch (error: any) {
    logger.error("Lock payroll period error:", error);
    res.status(500).json({ error: "Failed to lock payroll period" });
  }
}

/**
 * Get payroll period summary
 */
export async function getPayrollPeriodSummary(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: Payroll,
          as: "payrolls",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "firstName", "lastName", "employeeNumber", "departmentId"],
            },
          ],
        },
      ],
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    const payrolls = period.get("payrolls") as Payroll[];

    res.json({
      period,
      summary: {
        totalEmployees: payrolls.length,
        totalGross: period.totalGross,
        totalDeductions: period.totalDeductions,
        totalNet: period.totalNet,
        payrolls: payrolls.map((p) => ({
          id: p.id,
          employee: p.get("employee"),
          grossPay: p.grossPay,
          totalDeductions: p.totalDeductions,
          netPay: p.netPay,
          status: p.status,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Get payroll period summary error:", error);
    res.status(500).json({ error: "Failed to get payroll period summary" });
  }
}

