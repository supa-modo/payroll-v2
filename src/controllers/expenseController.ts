/**
 * Expense Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Expense, ExpenseCategory, Employee, Department, ExpenseApproval } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Generate unique expense number
 */
async function generateExpenseNumber(tenantId: string): Promise<string> {
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `EXP-${today}-`;

  const count = await Expense.count({
    where: {
      tenantId,
      expenseNumber: { [Op.like]: `${prefix}%` },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}${sequence}`;
}

/**
 * Get all expenses for tenant
 */
export async function getExpenses(
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
      status,
      categoryId,
      employeeId,
      departmentId,
      startDate,
      endDate,
      page = 1,
      limit = 30,
    } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (startDate || endDate) {
      whereClause.expenseDate = {};
      if (startDate) {
        whereClause.expenseDate[Op.gte] = startDate;
      }
      if (endDate) {
        whereClause.expenseDate[Op.lte] = endDate;
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Check if user can only view their own expenses
    const canViewAll = req.user.permissions?.includes("expense:view");
    const canViewSelf = req.user.permissions?.includes("expense:view:self");
    
    if (!canViewAll && canViewSelf) {
      // User can only view their own expenses - find their employee record
      const userEmployee = await Employee.findOne({
        where: {
          userId: req.user.id,
          tenantId,
        },
      });
      
      if (userEmployee) {
        whereClause.employeeId = userEmployee.id;
      } else {
        // No employee record, return empty result
        res.json({
          expenses: [],
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
        });
        return;
      }
    }

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "userId"],
        },
        {
          model: ExpenseCategory,
          as: "category",
          attributes: ["id", "name", "code"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"],
          required: false,
        },
      ],
      order: [["expenseDate", "DESC"], ["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      expenses,
      total: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error: any) {
    logger.error("Get expenses error:", error);
    res.status(500).json({ error: "Failed to get expenses" });
  }
}

/**
 * Get single expense
 */
export async function getExpense(
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

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "userId"],
        },
        {
          model: ExpenseCategory,
          as: "category",
        },
        {
          model: Department,
          as: "department",
          required: false,
        },
      ],
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    // Check if user can view this expense
    const canViewAll = req.user.permissions?.includes("expense:view");
    const employee = expense.get("employee") as Employee | null;
    const isOwner = employee?.userId === req.user.id;
    
    if (!canViewAll) {
      const canViewSelf = req.user.permissions?.includes("expense:view:self");
      if (!canViewSelf || !isOwner) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    res.json({ expense });
  } catch (error: any) {
    logger.error("Get expense error:", error);
    res.status(500).json({ error: "Failed to get expense" });
  }
}

/**
 * Create new expense
 */
export async function createExpense(
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
      categoryId,
      departmentId,
      title,
      description,
      amount,
      currency,
      exchangeRate,
      expenseDate,
    } = req.body;

    // Verify category exists and belongs to tenant
    const category = await ExpenseCategory.findOne({
      where: {
        id: categoryId,
        tenantId,
        isActive: true,
      },
    });

    if (!category) {
      res.status(400).json({ error: "Invalid expense category" });
      return;
    }

    // Get employee (use specified employeeId or find employee by userId)
    let employeeId = req.body.employeeId;
    let employee: Employee | null = null;

    if (employeeId) {
      employee = await Employee.findOne({
        where: {
          id: employeeId,
          tenantId,
        },
      });

      if (!employee) {
        res.status(400).json({ error: "Specified employee not found or does not belong to your organization." });
        return;
      }
    } else {
      // Try to find employee by userId
      employee = await Employee.findOne({
        where: {
          userId: req.user.id,
          tenantId,
        },
      });

      if (!employee) {
        res.status(400).json({ 
          error: "Employee record not found. Please specify employeeId or ensure your user account is linked to an employee record." 
        });
        return;
      }
    }

    // Generate expense number
    const expenseNumber = await generateExpenseNumber(tenantId);

    // Calculate amount in base currency
    const rate = exchangeRate || 1;
    const amountInBaseCurrency = parseFloat(amount) * rate;

    const expense = await Expense.create({
      tenantId,
      employeeId: employee.id,
      categoryId,
      departmentId: departmentId || employee.departmentId || null,
      expenseNumber,
      title,
      description: description || null,
      amount,
      currency: currency || "KES",
      exchangeRate: rate,
      amountInBaseCurrency,
      expenseDate,
      status: "draft",
      hasReceipt: false,
      receiptVerified: false,
      createdBy: req.user.id,
    });

    res.status(201).json({ expense });
  } catch (error: any) {
    logger.error("Create expense error:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
}

/**
 * Update expense
 */
export async function updateExpense(
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
      categoryId,
      departmentId,
      title,
      description,
      amount,
      currency,
      exchangeRate,
      expenseDate,
    } = req.body;

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    if (expense.status !== "draft") {
      res.status(400).json({ error: "Can only update expenses in draft status" });
      return;
    }

    // Verify user owns the expense
    const employee = await Employee.findOne({
      where: {
        id: expense.employeeId,
        tenantId,
      },
    });

    const isOwner = employee?.userId === req.user.id;
    
    if (!isOwner) {
      res.status(403).json({ error: "You can only update your own expenses" });
      return;
    }

    // Calculate amount in base currency if amount or exchange rate changed
    let amountInBaseCurrency = expense.amountInBaseCurrency;
    if (amount || exchangeRate) {
      const finalAmount = amount ? parseFloat(amount.toString()) : parseFloat(expense.amount.toString());
      const finalRate = exchangeRate || expense.exchangeRate;
      amountInBaseCurrency = finalAmount * finalRate;
    }

    await expense.update({
      categoryId: categoryId || expense.categoryId,
      departmentId: departmentId !== undefined ? departmentId : expense.departmentId,
      title: title || expense.title,
      description: description !== undefined ? description : expense.description,
      amount: amount || expense.amount,
      currency: currency || expense.currency,
      exchangeRate: exchangeRate || expense.exchangeRate,
      amountInBaseCurrency,
      expenseDate: expenseDate || expense.expenseDate,
      updatedBy: req.user.id,
    });

    res.json({ expense });
  } catch (error: any) {
    logger.error("Update expense error:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
}

/**
 * Delete expense
 */
export async function deleteExpense(
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

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    if (expense.status !== "draft") {
      res.status(400).json({ error: "Can only delete expenses in draft status" });
      return;
    }

    // Verify user owns the expense
    const employee = await Employee.findOne({
      where: {
        id: expense.employeeId,
        tenantId,
      },
    });

    const isOwner = employee?.userId === req.user.id || expense.employeeId === req.user.id;
    
    if (!isOwner) {
      res.status(403).json({ error: "You can only delete your own expenses" });
      return;
    }

    await expense.destroy();

    res.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    logger.error("Delete expense error:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
}

/**
 * Submit expense for approval
 */
export async function submitExpense(
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

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: ExpenseCategory,
          as: "category",
        },
      ],
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    if (expense.status !== "draft") {
      res.status(400).json({ error: "Expense must be in draft status to submit" });
      return;
    }

    // Verify user owns the expense
    const employee = await Employee.findOne({
      where: {
        id: expense.employeeId,
        tenantId,
      },
    });

    const isOwner = employee?.userId === req.user.id || expense.employeeId === req.user.id;
    
    if (!isOwner) {
      res.status(403).json({ error: "You can only submit your own expenses" });
      return;
    }

    const category = expense.get("category") as ExpenseCategory;

    // Validate required fields
    if (!expense.title || !expense.amount || !expense.expenseDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Check if receipt is required
    if (category.requiresReceipt && !expense.hasReceipt) {
      res.status(400).json({ error: "Receipt is required for this expense category" });
      return;
    }

    // Determine next status based on category requirements
    let nextStatus: string;
    const amount = parseFloat(expense.amount.toString());

    // Check auto-approve threshold
    if (category.autoApproveBelow && amount <= parseFloat(category.autoApproveBelow.toString())) {
      nextStatus = "approved";
    } else if (category.requiresManagerApproval && category.requiresFinanceApproval) {
      nextStatus = "pending_manager";
    } else if (category.requiresManagerApproval) {
      nextStatus = "pending_manager";
    } else if (category.requiresFinanceApproval) {
      nextStatus = "pending_finance";
    } else {
      nextStatus = "approved";
    }

    await expense.update({
      status: nextStatus,
      submittedAt: new Date(),
    });

    res.json({ expense });
  } catch (error: any) {
    logger.error("Submit expense error:", error);
    res.status(500).json({ error: "Failed to submit expense" });
  }
}

/**
 * Approve expense
 */
export async function approveExpense(
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
    const { comments, approvalLevel } = req.body;

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: ExpenseCategory,
          as: "category",
        },
      ],
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const category = expense.get("category") as ExpenseCategory;

    // Determine approval level if not provided
    let level = approvalLevel;
    if (!level) {
      if (expense.status === "pending_manager") {
        level = "manager";
      } else if (expense.status === "pending_finance") {
        level = "finance";
      } else {
        res.status(400).json({ error: "Expense is not pending approval" });
        return;
      }
    }

    // Verify user has permission for this approval level
    if (level === "manager" && expense.status !== "pending_manager") {
      res.status(400).json({ error: "Expense is not pending manager approval" });
      return;
    }

    if (level === "finance" && expense.status !== "pending_finance") {
      res.status(400).json({ error: "Expense is not pending finance approval" });
      return;
    }

    // Create approval record
    await ExpenseApproval.create({
      expenseId: expense.id,
      approvalLevel: level,
      approverId: req.user.id,
      action: "approved",
      comments: comments || null,
      actedAt: new Date(),
    });

    // Determine next status
    let nextStatus: string;
    if (level === "manager" && category.requiresFinanceApproval) {
      nextStatus = "pending_finance";
    } else {
      nextStatus = "approved";
    }

    await expense.update({
      status: nextStatus,
    });

    res.json({ expense });
  } catch (error: any) {
    logger.error("Approve expense error:", error);
    res.status(500).json({ error: "Failed to approve expense" });
  }
}

/**
 * Reject expense
 */
export async function rejectExpense(
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
    const { reason, comments } = req.body;

    if (!reason) {
      res.status(400).json({ error: "Rejection reason is required" });
      return;
    }

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    if (!expense.status.includes("pending")) {
      res.status(400).json({ error: "Expense is not pending approval" });
      return;
    }

    // Determine approval level
    let level = "manager";
    if (expense.status === "pending_finance") {
      level = "finance";
    }

    // Create approval record
    await ExpenseApproval.create({
      expenseId: expense.id,
      approvalLevel: level,
      approverId: req.user.id,
      action: "rejected",
      comments: comments || null,
      actedAt: new Date(),
    });

    await expense.update({
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy: req.user.id,
    });

    res.json({ expense });
  } catch (error: any) {
    logger.error("Reject expense error:", error);
    res.status(500).json({ error: "Failed to reject expense" });
  }
}

/**
 * Mark expense as paid
 */
export async function markExpenseAsPaid(
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
    const { paymentReference, paymentMethod } = req.body;

    const expense = await Expense.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    if (expense.status !== "approved") {
      res.status(400).json({ error: "Expense must be approved before marking as paid" });
      return;
    }

    await expense.update({
      status: "paid",
      paidAt: new Date(),
      paidBy: req.user.id,
      paymentReference: paymentReference || null,
      paymentMethod: paymentMethod || null,
    });

    res.json({ expense });
  } catch (error: any) {
    logger.error("Mark expense as paid error:", error);
    res.status(500).json({ error: "Failed to mark expense as paid" });
  }
}

