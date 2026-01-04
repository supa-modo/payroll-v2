/**
 * Payroll Report Service
 * Handles payroll data aggregation and reporting
 */

import { Payroll, PayrollPeriod, Employee, Department } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";

export interface MonthlyPayrollSummary {
  month: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalPAYE: number;
  totalNSSF: number;
  totalNHIF: number;
}

export interface DepartmentalPayrollBreakdown {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalPAYE: number;
  totalNSSF: number;
  totalNHIF: number;
}

export interface TaxSummary {
  totalPAYE: number;
  totalNSSF: number;
  totalNHIF: number;
  totalStatutory: number;
  breakdown: Array<{
    month: string;
    paye: number;
    nssf: number;
    nhif: number;
  }>;
}

export interface EmployeePayrollHistory {
  periodId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  payDate: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  payeAmount: number;
  nssfAmount: number;
  nhifAmount: number;
  status: string;
}

export interface PayrollTrend {
  month: string;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
}

/**
 * Get monthly payroll summary
 */
export async function getMonthlyPayrollSummary(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyPayrollSummary[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get payrolls within date range
    const periods = await PayrollPeriod.findAll({
      where: {
        tenantId,
        startDate: { [Op.gte]: startDateStr },
        endDate: { [Op.lte]: endDateStr },
      },
    });

    const periodIds = periods.map((p) => p.id);

    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: { [Op.in]: periodIds },
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
          required: true,
        },
      ],
    });

    // Group by month
    const monthlyData = new Map<string, {
      employeeCount: Set<string>;
      totalGross: number;
      totalDeductions: number;
      totalNet: number;
      totalPAYE: number;
      totalNSSF: number;
      totalNHIF: number;
    }>();

    for (const payroll of payrolls) {
      const period = payroll.get("payrollPeriod") as PayrollPeriod;
      const month = new Date(period.startDate).toISOString().slice(0, 7); // YYYY-MM

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          employeeCount: new Set(),
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          totalPAYE: 0,
          totalNSSF: 0,
          totalNHIF: 0,
        });
      }

      const data = monthlyData.get(month)!;
      data.employeeCount.add(payroll.employeeId);
      data.totalGross += parseFloat(payroll.grossPay.toString());
      data.totalDeductions += parseFloat(payroll.totalDeductions.toString());
      data.totalNet += parseFloat(payroll.netPay.toString());
      data.totalPAYE += parseFloat(payroll.payeAmount?.toString() || "0");
      data.totalNSSF += parseFloat(payroll.nssfAmount?.toString() || "0");
      data.totalNHIF += parseFloat(payroll.nhifAmount?.toString() || "0");
    }

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        employeeCount: data.employeeCount.size,
        totalGross: data.totalGross,
        totalDeductions: data.totalDeductions,
        totalNet: data.totalNet,
        totalPAYE: data.totalPAYE,
        totalNSSF: data.totalNSSF,
        totalNHIF: data.totalNHIF,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error: any) {
    logger.error("Error getting monthly payroll summary:", error);
    throw error;
  }
}

/**
 * Get departmental payroll breakdown
 */
export async function getDepartmentalPayrollBreakdown(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  departmentId?: string
): Promise<DepartmentalPayrollBreakdown[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const whereClause: any = {
      tenantId,
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    // Get payroll periods first
    const periods = await PayrollPeriod.findAll({
      where: {
        tenantId,
        startDate: { [Op.gte]: startDateStr },
        endDate: { [Op.lte]: endDateStr },
      },
    });

    const periodIds = periods.map((p) => p.id);

    // Get payrolls with employee and department info
    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: { [Op.in]: periodIds },
      },
      include: [
        {
          model: Employee,
          as: "employee",
          where: whereClause,
          required: true,
          include: [
            {
              model: Department,
              as: "department",
              required: true,
            },
          ],
        },
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
          where: {
            startDate: { [Op.gte]: startDateStr },
            endDate: { [Op.lte]: endDateStr },
          },
          required: true,
        },
      ],
    });

    // Group by department
    const departmentData = new Map<string, {
      departmentId: string;
      departmentName: string;
      employeeCount: Set<string>;
      totalGross: number;
      totalDeductions: number;
      totalNet: number;
      totalPAYE: number;
      totalNSSF: number;
      totalNHIF: number;
    }>();

    for (const payroll of payrolls) {
      const employee = payroll.get("employee") as Employee;
      const department = employee.get("department") as Department;

      if (!department) continue;

      const deptId = department.id;
      if (!departmentData.has(deptId)) {
        departmentData.set(deptId, {
          departmentId: deptId,
          departmentName: department.name,
          employeeCount: new Set(),
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          totalPAYE: 0,
          totalNSSF: 0,
          totalNHIF: 0,
        });
      }

      const data = departmentData.get(deptId)!;
      data.employeeCount.add(payroll.employeeId);
      const grossPay = parseFloat(payroll.grossPay.toString()) || 0;
      const totalDeductions = parseFloat(payroll.totalDeductions.toString()) || 0;
      const netPay = parseFloat(payroll.netPay.toString()) || 0;
      const paye = parseFloat(payroll.payeAmount?.toString() || "0") || 0;
      const nssf = parseFloat(payroll.nssfAmount?.toString() || "0") || 0;
      const nhif = parseFloat(payroll.nhifAmount?.toString() || "0") || 0;
      
      data.totalGross += grossPay;
      data.totalDeductions += totalDeductions;
      data.totalNet += netPay;
      data.totalPAYE += paye;
      data.totalNSSF += nssf;
      data.totalNHIF += nhif;
    }

    return Array.from(departmentData.values())
      .map((data) => ({
        ...data,
        employeeCount: data.employeeCount.size,
      }))
      .sort((a, b) => b.totalGross - a.totalGross);
  } catch (error: any) {
    logger.error("Error getting departmental payroll breakdown:", error);
    throw error;
  }
}

/**
 * Get tax summary
 */
export async function getTaxSummary(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<TaxSummary> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const periods = await PayrollPeriod.findAll({
      where: {
        tenantId,
        startDate: { [Op.gte]: startDateStr },
        endDate: { [Op.lte]: endDateStr },
      },
    });

    const periodIds = periods.map((p) => p.id);

    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: { [Op.in]: periodIds },
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
          required: true,
        },
      ],
    });

    let totalPAYE = 0;
    let totalNSSF = 0;
    let totalNHIF = 0;

    const monthlyBreakdown = new Map<string, {
      paye: number;
      nssf: number;
      nhif: number;
    }>();

    for (const payroll of payrolls) {
      const period = payroll.get("payrollPeriod") as PayrollPeriod;
      const month = new Date(period.startDate).toISOString().slice(0, 7);

      const paye = parseFloat(payroll.payeAmount?.toString() || "0");
      const nssf = parseFloat(payroll.nssfAmount?.toString() || "0");
      const nhif = parseFloat(payroll.nhifAmount?.toString() || "0");

      totalPAYE += paye;
      totalNSSF += nssf;
      totalNHIF += nhif;

      if (!monthlyBreakdown.has(month)) {
        monthlyBreakdown.set(month, { paye: 0, nssf: 0, nhif: 0 });
      }

      const monthData = monthlyBreakdown.get(month)!;
      monthData.paye += paye;
      monthData.nssf += nssf;
      monthData.nhif += nhif;
    }

    return {
      totalPAYE,
      totalNSSF,
      totalNHIF,
      totalStatutory: totalPAYE + totalNSSF + totalNHIF,
      breakdown: Array.from(monthlyBreakdown.entries())
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  } catch (error: any) {
    logger.error("Error getting tax summary:", error);
    throw error;
  }
}

/**
 * Get employee payroll history
 */
export async function getEmployeePayrollHistory(
  tenantId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<EmployeePayrollHistory[]> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const periods = await PayrollPeriod.findAll({
      where: {
        tenantId,
        startDate: { [Op.gte]: startDateStr },
        endDate: { [Op.lte]: endDateStr },
      },
    });

    const periodIds = periods.map((p) => p.id);

    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: { [Op.in]: periodIds },
        employeeId,
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
          required: true,
        },
      ],
      order: [[{ model: PayrollPeriod, as: "payrollPeriod" }, "startDate", "DESC"]],
    });

    return payrolls.map((payroll) => {
      const period = payroll.get("payrollPeriod") as PayrollPeriod;
      return {
        periodId: period.id,
        periodName: period.name,
        startDate: period.startDate.toISOString().split("T")[0],
        endDate: period.endDate.toISOString().split("T")[0],
        payDate: period.payDate.toISOString().split("T")[0],
        grossPay: parseFloat(payroll.grossPay.toString()),
        totalDeductions: parseFloat(payroll.totalDeductions.toString()),
        netPay: parseFloat(payroll.netPay.toString()),
        payeAmount: parseFloat(payroll.payeAmount?.toString() || "0"),
        nssfAmount: parseFloat(payroll.nssfAmount?.toString() || "0"),
        nhifAmount: parseFloat(payroll.nhifAmount?.toString() || "0"),
        status: payroll.status,
      };
    });
  } catch (error: any) {
    logger.error("Error getting employee payroll history:", error);
    throw error;
  }
}

/**
 * Get payroll trends
 */
export async function getPayrollTrends(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<PayrollTrend[]> {
  try {
    const summary = await getMonthlyPayrollSummary(tenantId, startDate, endDate);

    return summary.map((item) => ({
      month: item.month,
      totalGross: item.totalGross,
      totalNet: item.totalNet,
      employeeCount: item.employeeCount,
    }));
  } catch (error: any) {
    logger.error("Error getting payroll trends:", error);
    throw error;
  }
}

