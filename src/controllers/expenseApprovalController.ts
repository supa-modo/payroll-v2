/**
 * Expense Approval Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ExpenseApproval, Expense, User } from "../models";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get approval history for an expense
 */
export async function getExpenseApprovals(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { expenseId } = req.params;

    // Verify expense belongs to tenant
    const expense = await Expense.findOne({
      where: {
        id: expenseId,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const approvals = await ExpenseApproval.findAll({
      where: {
        expenseId,
      },
      include: [
        {
          model: User,
          as: "approver",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      order: [["actedAt", "ASC"]],
    });

    res.json({ approvals });
  } catch (error: any) {
    logger.error("Get expense approvals error:", error);
    res.status(500).json({ error: "Failed to get expense approvals" });
  }
}

