import { Response } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/auth";
import {
  AuditLog,
  Department,
  Employee,
  EmployeeLoan,
  Expense,
  PayrollPeriod,
} from "../models";
import { requireTenantId } from "../utils/tenant";

interface EmployeesByTypeRow {
  employmentType: string | null;
  count: string | number;
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);

    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      employeesByTypeRows,
      pendingLoans,
      pendingExpenses,
      recentActivity,
      latestPeriods,
      currentPeriod,
    ] = await Promise.all([
      Employee.count({ where: { tenantId } }),
      Employee.count({ where: { tenantId, status: "active" } }),
      Department.count({ where: { tenantId } }),
      Employee.findAll({
        where: { tenantId },
        attributes: ["employmentType", [Employee.sequelize!.fn("COUNT", Employee.sequelize!.col("id")), "count"]],
        group: ["employmentType"],
        raw: true,
      }),
      EmployeeLoan.count({ where: { tenantId, status: "pending" } }),
      Expense.count({ where: { tenantId, status: { [Op.in]: ["submitted", "pending_manager", "pending_finance"] } } }),
      AuditLog.findAll({
        where: { tenantId },
        order: [["createdAt", "DESC"]],
        limit: 10,
        attributes: ["id", "action", "entityType", "entityId", "createdAt"],
      }),
      PayrollPeriod.findAll({
        where: { tenantId },
        order: [["startDate", "DESC"]],
        limit: 8,
        attributes: ["id", "name", "startDate", "totalGross", "totalNet"],
      }),
      PayrollPeriod.findOne({
        where: { tenantId },
        order: [["startDate", "DESC"]],
      }),
    ]);

    const employeesByType = (employeesByTypeRows as unknown as EmployeesByTypeRow[]).reduce<Record<string, number>>(
      (acc, row) => {
        const employmentType = row.employmentType;
        const count = row.count;
        if (!employmentType) return acc;
        acc[employmentType] = Number(count);
        return acc;
      },
      {},
    );

    const payrollTrend = latestPeriods
      .slice()
      .reverse()
      .map((p) => ({
        id: p.id,
        period: p.name,
        month: new Date(p.startDate).toLocaleDateString("en-KE", { month: "short" }),
        gross: Number(p.totalGross || 0),
        net: Number(p.totalNet || 0),
      }));

    res.json({
      totalEmployees,
      totalDepartments,
      activeEmployees,
      employeesByType,
      currentPeriod,
      pendingApprovals: {
        loans: pendingLoans,
        expenses: pendingExpenses,
      },
      recentActivity,
      departmentPayroll: [],
      payrollTrend,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load dashboard stats", details: error?.message });
  }
}
