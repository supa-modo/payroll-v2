/**
 * Loan Repayment Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { LoanRepayment, EmployeeLoan, Payroll, Employee } from "../models";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get repayment history for a loan
 */
export async function getLoanRepayments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { loanId } = req.params;

    // Verify loan belongs to tenant
    const loan = await EmployeeLoan.findOne({
      where: {
        id: loanId,
        tenantId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    const repayments = await LoanRepayment.findAll({
      where: {
        loanId,
      },
      include: [
        {
          model: Payroll,
          as: "payroll",
          attributes: ["id", "payrollPeriodId"],
          required: false,
        },
      ],
      order: [["repaymentDate", "ASC"]],
    });

    res.json({ repayments });
  } catch (error: any) {
    logger.error("Get loan repayments error:", error);
    res.status(500).json({ error: "Failed to get loan repayments" });
  }
}

/**
 * Create manual repayment
 */
export async function createLoanRepayment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { loanId } = req.params;
    const { amount, repaymentDate, notes } = req.body;

    // Verify loan belongs to tenant
    const loan = await EmployeeLoan.findOne({
      where: {
        id: loanId,
        tenantId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "active") {
      res.status(400).json({ error: "Can only record repayments for active loans" });
      return;
    }

    const repaymentAmount = parseFloat(amount.toString());
    const currentBalance = parseFloat(loan.remainingBalance.toString());

    if (repaymentAmount <= 0) {
      res.status(400).json({ error: "Repayment amount must be greater than zero" });
      return;
    }

    if (repaymentAmount > currentBalance) {
      res.status(400).json({ error: "Repayment amount cannot exceed remaining balance" });
      return;
    }

    const balanceAfter = currentBalance - repaymentAmount;
    const newTotalPaid = parseFloat(loan.totalPaid.toString()) + repaymentAmount;

    // Create repayment record
    const repayment = await LoanRepayment.create({
      loanId,
      amount: repaymentAmount,
      repaymentDate: repaymentDate || new Date().toISOString().split("T")[0],
      paymentType: "manual",
      balanceAfter,
      notes: notes || null,
      createdBy: req.user.id,
    });

    // Update loan
    const updatedStatus = balanceAfter <= 0 ? "completed" : loan.status;
    await loan.update({
      remainingBalance: balanceAfter,
      totalPaid: newTotalPaid,
      status: updatedStatus,
      updatedBy: req.user.id,
    });

    res.status(201).json({ repayment, loan });
  } catch (error: any) {
    logger.error("Create loan repayment error:", error);
    res.status(500).json({ error: "Failed to create loan repayment" });
  }
}

/**
 * Get repayments by payroll period
 */
export async function getRepaymentsByPayroll(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { payrollId } = req.params;

    // Verify payroll belongs to tenant (indirect check via loan)
    const repayments = await LoanRepayment.findAll({
      where: {
        payrollId,
      },
      include: [
        {
          model: EmployeeLoan,
          as: "loan",
          where: {
            tenantId,
          },
          required: true,
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "firstName", "lastName", "employeeNumber"],
            },
          ],
        },
      ],
      order: [["repaymentDate", "ASC"]],
    });

    res.json({ repayments });
  } catch (error: any) {
    logger.error("Get repayments by payroll error:", error);
    res.status(500).json({ error: "Failed to get repayments by payroll" });
  }
}

