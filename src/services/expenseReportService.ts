/**
 * Expense Report Service
 * Handles expense data aggregation and reporting
 */

import { Expense, ExpenseCategory, Employee, Department } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";

export interface ExpenseByCategory {
  categoryId: string;
  categoryName: string;
  expenseCount: number;
  totalAmount: number;
  averageAmount: number;
  percentage: number;
}

export interface ExpenseByDepartment {
  departmentId: string;
  departmentName: string;
  expenseCount: number;
  totalAmount: number;
  averageAmount: number;
  percentage: number;
}

export interface ExpenseMonthlyTrend {
  month: string;
  totalAmount: number;
  expenseCount: number;
  averageAmount: number;
}

export interface TopSpender {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  expenseCount: number;
  totalAmount: number;
  averageAmount: number;
}

/**
 * Get expenses grouped by category
 */
export async function getExpenseByCategory(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  categoryId?: string
): Promise<ExpenseByCategory[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const whereClause: any = {
      tenantId,
      expenseDate: { [Op.between]: [startDateStr, endDateStr] },
      status: { [Op.in]: ["approved", "paid"] },
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: ExpenseCategory,
          as: "category",
          required: true,
        },
      ],
    });

    // Group by category
    const categoryData = new Map<string, {
      categoryId: string;
      categoryName: string;
      expenseCount: number;
      totalAmount: number;
    }>();

    let grandTotal = 0;

    for (const expense of expenses) {
      const category = expense.get("category") as ExpenseCategory;
      if (!category) continue;

      const catId = category.id;
      if (!categoryData.has(catId)) {
        categoryData.set(catId, {
          categoryId: catId,
          categoryName: category.name,
          expenseCount: 0,
          totalAmount: 0,
        });
      }

      const data = categoryData.get(catId)!;
      data.expenseCount += 1;
      const amount = parseFloat(expense.amount.toString()) || 0;
      data.totalAmount += amount;
      grandTotal += amount;
    }

    return Array.from(categoryData.values())
      .map((data) => ({
        ...data,
        averageAmount: data.totalAmount / data.expenseCount,
        percentage: grandTotal > 0 ? (data.totalAmount / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error: any) {
    logger.error("Error getting expenses by category:", error);
    throw error;
  }
}

/**
 * Get expenses grouped by department
 */
export async function getExpenseByDepartment(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  departmentId?: string
): Promise<ExpenseByDepartment[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const whereClause: any = {
      tenantId,
      expenseDate: { [Op.between]: [startDateStr, endDateStr] },
      status: { [Op.in]: ["approved", "paid"] },
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: Department,
          as: "department",
          required: false,
        },
      ],
    });

    // Group by department
    const departmentData = new Map<string, {
      departmentId: string;
      departmentName: string;
      expenseCount: number;
      totalAmount: number;
    }>();

    let grandTotal = 0;

    for (const expense of expenses) {
      const department = expense.get("department") as Department | null;
      const deptId = department?.id || "no-department";
      const deptName = department?.name || "No Department";

      if (!departmentData.has(deptId)) {
        departmentData.set(deptId, {
          departmentId: deptId,
          departmentName: deptName,
          expenseCount: 0,
          totalAmount: 0,
        });
      }

      const data = departmentData.get(deptId)!;
      data.expenseCount += 1;
      const amount = parseFloat(expense.amount.toString()) || 0;
      data.totalAmount += amount;
      grandTotal += amount;
    }

    return Array.from(departmentData.values())
      .map((data) => ({
        ...data,
        averageAmount: data.totalAmount / data.expenseCount,
        percentage: grandTotal > 0 ? (data.totalAmount / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error: any) {
    logger.error("Error getting expenses by department:", error);
    throw error;
  }
}

/**
 * Get monthly expense trends
 */
export async function getExpenseMonthlyTrends(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<ExpenseMonthlyTrend[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const expenses = await Expense.findAll({
      where: {
        tenantId,
        expenseDate: { [Op.between]: [startDateStr, endDateStr] },
        status: { [Op.in]: ["approved", "paid"] },
      },
    });

    // Group by month
    const monthlyData = new Map<string, {
      expenseCount: number;
      totalAmount: number;
    }>();

    for (const expense of expenses) {
      const expenseDateStr = expense.expenseDate instanceof Date
        ? expense.expenseDate.toISOString().split("T")[0]
        : expense.expenseDate;
      const month = expenseDateStr.slice(0, 7); // YYYY-MM

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          expenseCount: 0,
          totalAmount: 0,
        });
      }

      const data = monthlyData.get(month)!;
      data.expenseCount += 1;
      const amount = parseFloat(expense.amount.toString()) || 0;
      data.totalAmount += amount;
    }

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        totalAmount: data.totalAmount,
        expenseCount: data.expenseCount,
        averageAmount: data.totalAmount / data.expenseCount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error: any) {
    logger.error("Error getting expense monthly trends:", error);
    throw error;
  }
}

/**
 * Get top spenders
 */
export async function getTopSpenders(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<TopSpender[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const expenses = await Expense.findAll({
      where: {
        tenantId,
        expenseDate: { [Op.between]: [startDateStr, endDateStr] },
        status: { [Op.in]: ["approved", "paid"] },
      },
      include: [
        {
          model: Employee,
          as: "employee",
          required: true,
          include: [
            {
              model: Department,
              as: "department",
              required: false,
            },
          ],
        },
      ],
    });

    // Group by employee
    const employeeData = new Map<string, {
      employeeId: string;
      employeeName: string;
      departmentName?: string;
      expenseCount: number;
      totalAmount: number;
    }>();

    for (const expense of expenses) {
      const employee = expense.get("employee") as Employee;
      if (!employee) continue;

      const department = employee.get("department") as Department | null;
      const empId = employee.id;

      if (!employeeData.has(empId)) {
        employeeData.set(empId, {
          employeeId: empId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          departmentName: department?.name,
          expenseCount: 0,
          totalAmount: 0,
        });
      }

      const data = employeeData.get(empId)!;
      data.expenseCount += 1;
      const amount = parseFloat(expense.amount.toString()) || 0;
      data.totalAmount += amount;
    }

    return Array.from(employeeData.values())
      .map((data) => ({
        ...data,
        averageAmount: data.totalAmount / data.expenseCount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  } catch (error: any) {
    logger.error("Error getting top spenders:", error);
    throw error;
  }
}

