/**
 * Tax Remittance Service
 * Handles tax remittance tracking and management
 */

import { TaxRemittance, PayrollPeriod, Payroll, PayrollItem } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface RemittanceDueDateConfig {
  payeDays: number;
  nssfDays: number;
  nhifDays: number;
  shifDays: number;
  housingLevyDays: number;
}

/**
 * Calculate remittance due date based on tax type and period end date
 */
export function calculateRemittanceDueDate(
  periodEndDate: Date,
  taxType: "PAYE" | "NSSF" | "NHIF" | "SHIF" | "HOUSING_LEVY",
  config?: RemittanceDueDateConfig
): Date {
  const defaultConfig: RemittanceDueDateConfig = {
    payeDays: 9, // Usually 9th of following month
    nssfDays: 9,
    nhifDays: 9,
    shifDays: 9,
    housingLevyDays: 9,
  };

  const daysToAdd = config
    ? taxType === "PAYE"
      ? config.payeDays
      : taxType === "NSSF"
      ? config.nssfDays
      : taxType === "NHIF"
      ? config.nhifDays
      : taxType === "SHIF"
      ? config.shifDays
      : config.housingLevyDays
    : taxType === "PAYE"
    ? defaultConfig.payeDays
    : taxType === "NSSF"
    ? defaultConfig.nssfDays
    : taxType === "NHIF"
    ? defaultConfig.nhifDays
    : taxType === "SHIF"
    ? defaultConfig.shifDays
    : defaultConfig.housingLevyDays;

  // Get the first day of the month following the period end date
  const nextMonth = new Date(periodEndDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);

  // Add the specified days
  const dueDate = new Date(nextMonth);
  dueDate.setDate(dueDate.getDate() + daysToAdd - 1);

  return dueDate;
}

/**
 * Create remittance records for a payroll period
 */
export async function createRemittanceRecords(
  payrollPeriodId: string,
  tenantId: string
): Promise<TaxRemittance[]> {
  try {
    const period = await PayrollPeriod.findByPk(payrollPeriodId);
    if (!period) {
      throw new Error(`Payroll period ${payrollPeriodId} not found`);
    }

    // Get total tax amounts from payrolls
    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: period.id,
      },
    });

    let totalPAYE = 0;
    let totalNSSF = 0;
    let totalNHIF = 0;
    let totalSHIF = 0;
    let totalHousingLevy = 0;
    let employerNSSF = 0;
    let employerHousingLevy = 0;

    for (const payroll of payrolls) {
      totalPAYE += parseFloat(payroll.payeAmount?.toString() || "0");
      totalNSSF += parseFloat(payroll.nssfAmount?.toString() || "0");
      totalNHIF += parseFloat(payroll.nhifAmount?.toString() || "0");
      totalSHIF += parseFloat(payroll.shifAmount?.toString() || "0");
      totalHousingLevy += parseFloat(payroll.housingLevyAmount?.toString() || "0");
    }

    if (payrolls.length > 0) {
      const payrollIds = payrolls.map((p) => p.id);
      const employerItems = await PayrollItem.findAll({
        where: {
          payrollId: { [Op.in]: payrollIds },
          type: "employer_contrib",
          category: "statutory_employer",
        },
      });

      for (const item of employerItems) {
        const amount = parseFloat(item.amount?.toString() || "0");
        if (item.name === "Employer NSSF") {
          employerNSSF += amount;
        } else if (item.name === "Employer Housing Levy") {
          employerHousingLevy += amount;
        }
      }
    }

    // Combined remittance totals: employee + employer portions.
    totalNSSF += employerNSSF;
    totalHousingLevy += employerHousingLevy;

    const remittances: TaxRemittance[] = [];

    // Create remittance records for each tax type if amount > 0
    const periodEndDate = new Date(period.endDate);

    if (totalPAYE > 0) {
      const dueDate = calculateRemittanceDueDate(periodEndDate, "PAYE");
      const remittance = await TaxRemittance.create({
        tenantId,
        payrollPeriodId: period.id,
        taxType: "PAYE",
        amount: totalPAYE,
        dueDate,
        status: "pending",
      });
      remittances.push(remittance);
    }

    if (totalNSSF > 0) {
      const dueDate = calculateRemittanceDueDate(periodEndDate, "NSSF");
      const remittance = await TaxRemittance.create({
        tenantId,
        payrollPeriodId: period.id,
        taxType: "NSSF",
        amount: totalNSSF,
        dueDate,
        status: "pending",
        notes: JSON.stringify({
          employee: round2(totalNSSF - employerNSSF),
          employer: round2(employerNSSF),
        }),
      });
      remittances.push(remittance);
    }

    if (totalNHIF > 0) {
      const dueDate = calculateRemittanceDueDate(periodEndDate, "NHIF");
      const remittance = await TaxRemittance.create({
        tenantId,
        payrollPeriodId: period.id,
        taxType: "NHIF",
        amount: totalNHIF,
        dueDate,
        status: "pending",
      });
      remittances.push(remittance);
    }

    if (totalSHIF > 0) {
      const dueDate = calculateRemittanceDueDate(periodEndDate, "SHIF");
      const remittance = await TaxRemittance.create({
        tenantId,
        payrollPeriodId: period.id,
        taxType: "SHIF",
        amount: totalSHIF,
        dueDate,
        status: "pending",
      });
      remittances.push(remittance);
    }

    if (totalHousingLevy > 0) {
      const dueDate = calculateRemittanceDueDate(periodEndDate, "HOUSING_LEVY");
      const remittance = await TaxRemittance.create({
        tenantId,
        payrollPeriodId: period.id,
        taxType: "HOUSING_LEVY",
        amount: totalHousingLevy,
        dueDate,
        status: "pending",
        notes: JSON.stringify({
          employee: round2(totalHousingLevy - employerHousingLevy),
          employer: round2(employerHousingLevy),
        }),
      });
      remittances.push(remittance);
    }

    logger.info(
      `Created ${remittances.length} remittance records for payroll period ${payrollPeriodId}`
    );

    return remittances;
  } catch (error: any) {
    logger.error(`Error creating remittance records for period ${payrollPeriodId}:`, error);
    throw error;
  }
}

/**
 * Mark remittance as remitted
 */
export async function markAsRemitted(
  remittanceId: string,
  remittedBy: string,
  remittanceReference: string,
  notes?: string
): Promise<TaxRemittance> {
  try {
    const remittance = await TaxRemittance.findByPk(remittanceId);
    if (!remittance) {
      throw new Error(`Remittance ${remittanceId} not found`);
    }

    if (remittance.status === "remitted") {
      throw new Error(`Remittance ${remittanceId} is already marked as remitted`);
    }

    await remittance.update({
      status: "remitted",
      remittedAt: new Date(),
      remittedBy,
      remittanceReference,
      notes: notes || remittance.notes,
    });

    logger.info(`Marked remittance ${remittanceId} as remitted`);
    return remittance;
  } catch (error: any) {
    logger.error(`Error marking remittance ${remittanceId} as remitted:`, error);
    throw error;
  }
}

/**
 * Get pending remittances
 */
export async function getPendingRemittances(
  tenantId: string,
  includeOverdue: boolean = true
): Promise<TaxRemittance[]> {
  try {
    const whereClause: any = {
      tenantId,
      status: "pending",
    };

    if (includeOverdue) {
      whereClause.dueDate = { [Op.lte]: new Date() };
    }

    return await TaxRemittance.findAll({
      where: whereClause,
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
          required: true,
        },
      ],
      order: [["dueDate", "ASC"]],
    });
  } catch (error: any) {
    logger.error("Error getting pending remittances:", error);
    throw error;
  }
}

/**
 * Get remittance history
 */
export async function getRemittanceHistory(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  taxType?: "PAYE" | "NSSF" | "NHIF" | "SHIF" | "HOUSING_LEVY"
): Promise<TaxRemittance[]> {
  try {
    const whereClause: any = {
      tenantId,
    };

    if (taxType) {
      whereClause.taxType = taxType;
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

    return await TaxRemittance.findAll({
      where: whereClause,
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  } catch (error: any) {
    logger.error("Error getting remittance history:", error);
    throw error;
  }
}

/**
 * Calculate remittance totals by tax type and status
 */
export async function calculateRemittanceTotals(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  pendingPAYE: number;
  pendingNSSF: number;
  pendingNHIF: number;
  pendingSHIF: number;
  pendingHOUSING_LEVY: number;
  remittedPAYE: number;
  remittedNSSF: number;
  remittedNHIF: number;
  remittedSHIF: number;
  remittedHOUSING_LEVY: number;
}> {
  try {
    const whereClause: any = {
      tenantId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = startDate;
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = endDate;
      }
    }

    const remittances = await TaxRemittance.findAll({
      where: whereClause,
    });

    const totals = {
      pendingPAYE: 0,
      pendingNSSF: 0,
      pendingNHIF: 0,
      pendingSHIF: 0,
      pendingHOUSING_LEVY: 0,
      remittedPAYE: 0,
      remittedNSSF: 0,
      remittedNHIF: 0,
      remittedSHIF: 0,
      remittedHOUSING_LEVY: 0,
    };

    for (const remittance of remittances) {
      const amount = parseFloat(remittance.amount.toString());
      const key = `${remittance.status}${remittance.taxType}` as keyof typeof totals;
      if (key in totals) {
        totals[key] += amount;
      }
    }

    return totals;
  } catch (error: any) {
    logger.error("Error calculating remittance totals:", error);
    throw error;
  }
}
