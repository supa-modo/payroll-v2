/**
 * Employee Loan Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { EmployeeLoan, Employee, LoanRepayment } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Generate unique loan number
 */
async function generateLoanNumber(tenantId: string): Promise<string> {
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `LOAN-${today}-`;

  const count = await EmployeeLoan.count({
    where: {
      tenantId,
      loanNumber: { [Op.like]: `${prefix}%` },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}${sequence}`;
}

/**
 * Get all loans for tenant
 */
export async function getLoans(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const {
      employeeId,
      status,
      loanType,
      startDate,
      endDate,
      page = 1,
      limit = 30,
    } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (loanType) {
      whereClause.loanType = loanType;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = startDate;
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = endDate;
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: loans } = await EmployeeLoan.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "employeeNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      loans,
      total: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error: any) {
    logger.error("Get loans error:", error);
    res.status(500).json({ error: "Failed to get loans" });
  }
}

/**
 * Get single loan
 */
export async function getLoan(
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

    const loan = await EmployeeLoan.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
        },
        {
          model: LoanRepayment,
          as: "repayments",
          order: [["repaymentDate", "ASC"]],
        },
      ],
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    res.json({ loan });
  } catch (error: any) {
    logger.error("Get loan error:", error);
    res.status(500).json({ error: "Failed to get loan" });
  }
}

/**
 * Create new loan
 */
export async function createLoan(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const {
      employeeId,
      loanType,
      principalAmount,
      interestRate,
      repaymentStartDate,
      monthlyDeduction,
      reason,
    } = req.body;

    // Verify employee exists and belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(400).json({ error: "Employee not found" });
      return;
    }

    // Generate loan number
    const loanNumber = await generateLoanNumber(tenantId);

    // Calculate total amount with interest
    const principal = parseFloat(principalAmount.toString());
    const interest = parseFloat(interestRate.toString()) || 0;
    const totalAmount = principal * (1 + interest / 100);

    // Validate monthly deduction
    const monthly = parseFloat(monthlyDeduction.toString());
    if (monthly <= 0) {
      res.status(400).json({ error: "Monthly deduction must be greater than zero" });
      return;
    }

    const loan = await EmployeeLoan.create({
      tenantId,
      employeeId,
      loanType,
      loanNumber,
      principalAmount: principal,
      interestRate: interest,
      totalAmount,
      repaymentStartDate,
      monthlyDeduction: monthly,
      remainingBalance: totalAmount,
      totalPaid: 0,
      status: "pending",
      reason: reason || null,
      createdBy: req.user.id,
    });

    res.status(201).json({ loan });
  } catch (error: any) {
    logger.error("Create loan error:", error);
    res.status(500).json({ error: "Failed to create loan" });
  }
}

/**
 * Update loan
 */
export async function updateLoan(
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
    const {
      loanType,
      principalAmount,
      interestRate,
      repaymentStartDate,
      monthlyDeduction,
      reason,
    } = req.body;

    const loan = await EmployeeLoan.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "pending") {
      res.status(400).json({ error: "Can only update loans in pending status" });
      return;
    }

    // Recalculate total amount if principal or interest changed
    let totalAmount = loan.totalAmount;
    let remainingBalance = loan.remainingBalance;

    if (principalAmount || interestRate !== undefined) {
      const principal = principalAmount ? parseFloat(principalAmount.toString()) : parseFloat(loan.principalAmount.toString());
      const interest = interestRate !== undefined ? parseFloat(interestRate.toString()) : loan.interestRate;
      totalAmount = principal * (1 + interest / 100);
      remainingBalance = totalAmount; // Reset balance for pending loans
    }

    await loan.update({
      loanType: loanType || loan.loanType,
      principalAmount: principalAmount ? parseFloat(principalAmount.toString()) : loan.principalAmount,
      interestRate: interestRate !== undefined ? parseFloat(interestRate.toString()) : loan.interestRate,
      totalAmount,
      repaymentStartDate: repaymentStartDate || loan.repaymentStartDate,
      monthlyDeduction: monthlyDeduction ? parseFloat(monthlyDeduction.toString()) : loan.monthlyDeduction,
      remainingBalance,
      reason: reason !== undefined ? reason : loan.reason,
      updatedBy: req.user.id,
    });

    res.json({ loan });
  } catch (error: any) {
    logger.error("Update loan error:", error);
    res.status(500).json({ error: "Failed to update loan" });
  }
}

/**
 * Approve loan
 */
export async function approveLoan(
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

    const loan = await EmployeeLoan.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "pending") {
      res.status(400).json({ error: "Only pending loans can be approved" });
      return;
    }

    await loan.update({
      status: "active",
      approvedBy: req.user.id,
      approvedAt: new Date(),
      updatedBy: req.user.id,
    });

    res.json({ loan });
  } catch (error: any) {
    logger.error("Approve loan error:", error);
    res.status(500).json({ error: "Failed to approve loan" });
  }
}

/**
 * Complete loan
 */
export async function completeLoan(
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

    const loan = await EmployeeLoan.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "active") {
      res.status(400).json({ error: "Only active loans can be completed" });
      return;
    }

    if (parseFloat(loan.remainingBalance.toString()) > 0) {
      res.status(400).json({ error: "Loan must be fully paid before completion" });
      return;
    }

    await loan.update({
      status: "completed",
      updatedBy: req.user.id,
    });

    res.json({ loan });
  } catch (error: any) {
    logger.error("Complete loan error:", error);
    res.status(500).json({ error: "Failed to complete loan" });
  }
}

/**
 * Write off loan
 */
export async function writeOffLoan(
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
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: "Write-off reason is required" });
      return;
    }

    const loan = await EmployeeLoan.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "active") {
      res.status(400).json({ error: "Only active loans can be written off" });
      return;
    }

    await loan.update({
      status: "written_off",
      reason: reason,
      updatedBy: req.user.id,
    });

    res.json({ loan });
  } catch (error: any) {
    logger.error("Write off loan error:", error);
    res.status(500).json({ error: "Failed to write off loan" });
  }
}

