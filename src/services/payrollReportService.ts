/**
 * Payroll Report Service
 * Handles payroll data aggregation and reporting
 */

import { Payroll, PayrollPeriod, Employee, Department } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { calculateRemittanceTotals } from "./taxRemittanceService";

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
  periodBreakdown: Array<{
    periodId: string;
    periodName: string;
    startDate: string;
    endDate: string;
    paye: number;
    nssf: number;
    nhif: number;
    status: string;
  }>;
  employeeBreakdown?: Array<{
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    paye: number;
    nssf: number;
    nhif: number;
  }>;
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    paye: number;
    nssf: number;
    nhif: number;
  }>;
  remittanceStatus: {
    pendingPAYE: number;
    pendingNSSF: number;
    pendingNHIF: number;
    remittedPAYE: number;
    remittedNSSF: number;
    remittedNHIF: number;
  };
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
  endDate: Date,
  includeEmployeeBreakdown: boolean = false
): Promise<TaxSummary> {
  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    logger.debug(
      `Getting tax summary for tenant ${tenantId}, date range: ${startDateStr} to ${endDateStr}`
    );

    // Fix date filtering: use overlap logic instead of strict containment
    // A period overlaps if: startDate <= endDateStr AND endDate >= startDateStr
    const periods = await PayrollPeriod.findAll({
      where: {
        tenantId,
        startDate: { [Op.lte]: endDateStr },
        endDate: { [Op.gte]: startDateStr },
        // Only include processed/locked payrolls
        status: { [Op.in]: ["approved", "locked", "paid"] },
      },
    });

    logger.debug(
      `Found ${periods.length} payroll periods in date range with status approved/locked/paid`
    );

    if (periods.length > 0) {
      logger.debug(
        `Periods found: ${periods.map((p) => `${p.name} (${p.status})`).join(", ")}`
      );
    }

    const periodIds = periods.map((p) => p.id);

    if (periodIds.length === 0) {
      logger.warn(
        `No payroll periods found for tax summary. Date range: ${startDateStr} to ${endDateStr}, Status: approved/locked/paid`
      );
      return {
        totalPAYE: 0,
        totalNSSF: 0,
        totalNHIF: 0,
        totalStatutory: 0,
        breakdown: [],
        periodBreakdown: [],
        departmentBreakdown: [],
        remittanceStatus: {
          pendingPAYE: 0,
          pendingNSSF: 0,
          pendingNHIF: 0,
          remittedPAYE: 0,
          remittedNSSF: 0,
          remittedNHIF: 0,
        },
      };
    }

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

    logger.debug(`Found ${payrolls.length} payroll records for tax summary`);

    if (payrolls.length > 0) {
      const samplePayroll = payrolls[0];
      logger.debug(
        `Sample payroll - PAYE: ${samplePayroll.payeAmount}, NSSF: ${samplePayroll.nssfAmount}, NHIF: ${samplePayroll.nhifAmount}`
      );
    }

    let totalPAYE = 0;
    let totalNSSF = 0;
    let totalNHIF = 0;

    const monthlyBreakdown = new Map<string, {
      paye: number;
      nssf: number;
      nhif: number;
    }>();

    const periodBreakdownMap = new Map<string, {
      periodId: string;
      periodName: string;
      startDate: string;
      endDate: string;
      status: string;
      paye: number;
      nssf: number;
      nhif: number;
    }>();

    const employeeBreakdownMap = new Map<string, {
      employeeId: string;
      employeeName: string;
      employeeNumber: string;
      paye: number;
      nssf: number;
      nhif: number;
    }>();

    const departmentBreakdownMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      paye: number;
      nssf: number;
      nhif: number;
    }>();

    for (const payroll of payrolls) {
      const period = payroll.get("payrollPeriod") as PayrollPeriod;
      const employee = payroll.get("employee") as Employee;
      const department = employee?.get("department") as Department | undefined;
      // Handle DATEONLY fields which are strings, not Date objects
      const startDate = period.startDate instanceof Date
        ? period.startDate
        : new Date(period.startDate);
      const month = startDate.toISOString().slice(0, 7);

      const paye = parseFloat(payroll.payeAmount?.toString() || "0");
      const nssf = parseFloat(payroll.nssfAmount?.toString() || "0");
      const nhif = parseFloat(payroll.nhifAmount?.toString() || "0");

      totalPAYE += paye;
      totalNSSF += nssf;
      totalNHIF += nhif;

      // Monthly breakdown
      if (!monthlyBreakdown.has(month)) {
        monthlyBreakdown.set(month, { paye: 0, nssf: 0, nhif: 0 });
      }
      const monthData = monthlyBreakdown.get(month)!;
      monthData.paye += paye;
      monthData.nssf += nssf;
      monthData.nhif += nhif;

      // Period breakdown
      if (!periodBreakdownMap.has(period.id)) {
        // Handle DATEONLY fields which are strings, not Date objects
        const startDateValue = period.startDate as any;
        const endDateValue = period.endDate as any;
        const startDateStr = startDateValue instanceof Date 
          ? startDateValue.toISOString().split("T")[0]
          : String(startDateValue);
        const endDateStr = endDateValue instanceof Date
          ? endDateValue.toISOString().split("T")[0]
          : String(endDateValue);
        
        periodBreakdownMap.set(period.id, {
          periodId: period.id,
          periodName: period.name,
          startDate: startDateStr,
          endDate: endDateStr,
          status: period.status,
          paye: 0,
          nssf: 0,
          nhif: 0,
        });
      }
      const periodData = periodBreakdownMap.get(period.id)!;
      periodData.paye += paye;
      periodData.nssf += nssf;
      periodData.nhif += nhif;

      // Employee breakdown (if requested)
      if (includeEmployeeBreakdown && employee) {
        const employeeKey = `${period.id}-${employee.id}`;
        if (!employeeBreakdownMap.has(employeeKey)) {
          employeeBreakdownMap.set(employeeKey, {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeNumber: employee.employeeNumber,
            paye: 0,
            nssf: 0,
            nhif: 0,
          });
        }
        const employeeData = employeeBreakdownMap.get(employeeKey)!;
        employeeData.paye += paye;
        employeeData.nssf += nssf;
        employeeData.nhif += nhif;
      }

      // Department breakdown
      if (department) {
        if (!departmentBreakdownMap.has(department.id)) {
          departmentBreakdownMap.set(department.id, {
            departmentId: department.id,
            departmentName: department.name,
            paye: 0,
            nssf: 0,
            nhif: 0,
          });
        }
        const deptData = departmentBreakdownMap.get(department.id)!;
        deptData.paye += paye;
        deptData.nssf += nssf;
        deptData.nhif += nhif;
      }
    }

    // Get remittance status from TaxRemittance records
    const remittanceStatus = await calculateRemittanceTotals(
      tenantId,
      startDate,
      endDate
    );

    logger.debug(
      `Tax summary totals - PAYE: ${totalPAYE}, NSSF: ${totalNSSF}, NHIF: ${totalNHIF}, Total: ${totalPAYE + totalNSSF + totalNHIF}`
    );
    logger.debug(
      `Remittance status - Pending: PAYE=${remittanceStatus.pendingPAYE}, NSSF=${remittanceStatus.pendingNSSF}, NHIF=${remittanceStatus.pendingNHIF}`
    );

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
      periodBreakdown: Array.from(periodBreakdownMap.values())
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
      employeeBreakdown: includeEmployeeBreakdown
        ? Array.from(employeeBreakdownMap.values())
        : undefined,
      departmentBreakdown: Array.from(departmentBreakdownMap.values())
        .sort((a, b) => a.departmentName.localeCompare(b.departmentName)),
      remittanceStatus,
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
      // Handle DATEONLY fields which are strings, not Date objects
      const startDateValue = period.startDate as any;
      const endDateValue = period.endDate as any;
      const payDateValue = period.payDate as any;
      const startDateStr = startDateValue instanceof Date
        ? startDateValue.toISOString().split("T")[0]
        : String(startDateValue);
      const endDateStr = endDateValue instanceof Date
        ? endDateValue.toISOString().split("T")[0]
        : String(endDateValue);
      const payDateStr = payDateValue instanceof Date
        ? payDateValue.toISOString().split("T")[0]
        : String(payDateValue);
      
      return {
        periodId: period.id,
        periodName: period.name,
        startDate: startDateStr,
        endDate: endDateStr,
        payDate: payDateStr,
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

