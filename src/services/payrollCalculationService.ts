/**
 * Payroll Calculation Service
 * Handles all payroll calculation logic
 */

import { Employee, EmployeeSalaryComponent, SalaryComponent, EmployeeLoan } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";

export interface PayrollCalculationResult {
  grossPay: number;
  taxableIncome: number;
  statutoryDeductions: {
    paye: number;
    nssf: number;
    nhif: number;
  };
  internalDeductions: number;
  totalDeductions: number;
  netPay: number;
  components: Array<{
    componentId: string;
    componentName: string;
    type: string;
    amount: number;
  }>;
}

/**
 * Calculate gross pay for an employee for a specific period
 */
export async function calculateGrossPay(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  try {
    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    // Get active salary components for the period
    // A component is active if:
    // - It starts before or during the period (effectiveFrom <= periodEnd)
    // - It hasn't ended before the period starts (effectiveTo IS NULL OR effectiveTo >= periodStart)
    const salaryComponents = await EmployeeSalaryComponent.findAll({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: periodEndStr },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: periodStartStr } },
        ],
      },
      include: [
        {
          model: SalaryComponent,
          as: "salaryComponent",
          required: true,
          where: {
            type: "earning",
            isActive: true,
          },
        },
      ],
    });

    logger.info(
      `Found ${salaryComponents.length} earning components for employee ${employeeId} in period ${periodStartStr} to ${periodEndStr}`
    );

    let grossPay = 0;

    for (const esc of salaryComponents) {
      const component = esc.get("salaryComponent") as SalaryComponent;
      const amount = parseFloat(esc.amount.toString());

      if (component.calculationType === "fixed") {
        grossPay += amount;
        logger.debug(
          `Added fixed component ${component.name}: ${amount} (Total: ${grossPay})`
        );
      } else if (component.calculationType === "percentage") {
        // For percentage calculations, we need the base amount
        // This is a simplified version - in production, you'd need to handle percentageOf references
        if (component.percentageValue) {
          // Calculate percentage of gross pay (recursive calculation)
          // For now, use the component's default amount or the employee's base salary
          const baseAmount = component.defaultAmount
            ? parseFloat(component.defaultAmount.toString())
            : amount;
          const percentageAmount = (baseAmount * component.percentageValue) / 100;
          grossPay += percentageAmount;
          logger.debug(
            `Added percentage component ${component.name}: ${percentageAmount} (${component.percentageValue}% of ${baseAmount}, Total: ${grossPay})`
          );
        }
      }
    }

    logger.info(
      `Calculated gross pay for employee ${employeeId}: ${grossPay}`
    );

    return grossPay;
  } catch (error: any) {
    logger.error(`Error calculating gross pay for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Calculate statutory deductions (PAYE, NSSF, NHIF)
 */
export async function calculateStatutoryDeductions(
  grossPay: number,
  taxableIncome: number,
  employee: Employee
): Promise<{ paye: number; nssf: number; nhif: number }> {
  const { calculateAllStatutoryDeductions } = await import("./statutoryCalculationService");
  return calculateAllStatutoryDeductions(grossPay, taxableIncome, employee);
}

/**
 * Calculate internal deductions (loans, advances, etc.)
 */
export async function calculateInternalDeductions(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  try {
    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    // Get deduction components
    // A component is active if:
    // - It starts before or during the period (effectiveFrom <= periodEnd)
    // - It hasn't ended before the period starts (effectiveTo IS NULL OR effectiveTo >= periodStart)
    const deductionComponents = await EmployeeSalaryComponent.findAll({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: periodEndStr },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: periodStartStr } },
        ],
      },
      include: [
        {
          model: SalaryComponent,
          as: "salaryComponent",
          required: true,
          where: {
            type: "deduction",
            isActive: true,
            isStatutory: false, // Only non-statutory deductions
          },
        },
      ],
    });

    logger.info(
      `Found ${deductionComponents.length} non-statutory deduction components for employee ${employeeId} in period ${periodStartStr} to ${periodEndStr}`
    );

    let totalDeductions = 0;

    for (const esc of deductionComponents) {
      const component = esc.get("salaryComponent") as SalaryComponent;
      const amount = parseFloat(esc.amount.toString());
      totalDeductions += amount;
      logger.debug(
        `Added deduction component ${component.name}: ${amount} (Total: ${totalDeductions})`
      );
    }

    // Calculate loan deductions
    const loanDeductions = await calculateLoanDeductions(employeeId, periodStart, periodEnd);
    if (loanDeductions > 0) {
      logger.info(
        `Loan deductions for employee ${employeeId}: ${loanDeductions}`
      );
    }
    totalDeductions += loanDeductions;

    logger.info(
      `Total internal deductions for employee ${employeeId}: ${totalDeductions}`
    );

    return totalDeductions;
  } catch (error: any) {
    logger.error(`Error calculating internal deductions for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Calculate net pay
 */
export function calculateNetPay(
  grossPay: number,
  statutoryDeductions: { paye: number; nssf: number; nhif: number },
  internalDeductions: number
): number {
  const totalDeductions =
    statutoryDeductions.paye +
    statutoryDeductions.nssf +
    statutoryDeductions.nhif +
    internalDeductions;

  return Math.max(0, grossPay - totalDeductions);
}

/**
 * Calculate complete payroll for an employee
 */
export async function calculateEmployeePayroll(
  employee: Employee,
  periodStart: Date,
  periodEnd: Date
): Promise<PayrollCalculationResult> {
  try {
    // Calculate gross pay
    const grossPay = await calculateGrossPay(employee.id, periodStart, periodEnd);

    // Calculate taxable income (gross pay minus non-taxable components)
    const taxableIncome = await calculateTaxableIncome(employee.id, periodStart, periodEnd, grossPay);

    // Calculate statutory deductions
    const statutoryDeductions = await calculateStatutoryDeductions(grossPay, taxableIncome, employee);

    // Calculate internal deductions
    const internalDeductions = await calculateInternalDeductions(
      employee.id,
      periodStart,
      periodEnd
    );

    // Calculate net pay
    const netPay = calculateNetPay(grossPay, statutoryDeductions, internalDeductions);

    // Get component breakdown
    const components = await getComponentBreakdown(employee.id, periodStart, periodEnd);

    return {
      grossPay,
      taxableIncome,
      statutoryDeductions,
      internalDeductions,
      totalDeductions:
        statutoryDeductions.paye +
        statutoryDeductions.nssf +
        statutoryDeductions.nhif +
        internalDeductions,
      netPay,
      components,
    };
  } catch (error: any) {
    logger.error(`Error calculating payroll for employee ${employee.id}:`, error);
    throw error;
  }
}

/**
 * Calculate taxable income (gross pay minus non-taxable components)
 */
async function calculateTaxableIncome(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date,
  grossPay: number
): Promise<number> {
  try {
    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    // Get non-taxable earning components
    const nonTaxableComponents = await EmployeeSalaryComponent.findAll({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: periodEndStr },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: periodStartStr } },
        ],
      },
      include: [
        {
          model: SalaryComponent,
          as: "salaryComponent",
          required: true,
          where: {
            type: "earning",
            isTaxable: false,
            isActive: true,
          },
        },
      ],
    });

    let nonTaxableAmount = 0;
    for (const esc of nonTaxableComponents) {
      nonTaxableAmount += parseFloat(esc.amount.toString());
    }

    return Math.max(0, grossPay - nonTaxableAmount);
  } catch (error: any) {
    logger.error(`Error calculating taxable income for employee ${employeeId}:`, error);
    return grossPay; // Fallback to gross pay if error
  }
}

/**
 * Get component breakdown for payroll
 */
async function getComponentBreakdown(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Array<{ componentId: string; componentName: string; type: string; amount: number }>> {
  try {
    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    const salaryComponents = await EmployeeSalaryComponent.findAll({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: periodEndStr },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: periodStartStr } },
        ],
      },
      include: [
        {
          model: SalaryComponent,
          as: "salaryComponent",
          required: true,
          where: {
            isActive: true,
          },
        },
      ],
    });

    return salaryComponents.map((esc) => {
      const component = esc.get("salaryComponent") as SalaryComponent;
      return {
        componentId: component.id,
        componentName: component.name,
        type: component.type,
        amount: parseFloat(esc.amount.toString()),
      };
    });
  } catch (error: any) {
    logger.error(`Error getting component breakdown for employee ${employeeId}:`, error);
    return [];
  }
}

/**
 * Calculate loan deductions for an employee
 */
async function calculateLoanDeductions(
  employeeId: string,
  _periodStart: Date,
  periodEnd: Date
): Promise<number> {
  try {
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    // Get active loans for employee where repayment should start in this period
    const activeLoans = await EmployeeLoan.findAll({
      where: {
        employeeId,
        status: "active",
        repaymentStartDate: { [Op.lte]: periodEndStr },
      },
    });

    let totalLoanDeduction = 0;

    for (const loan of activeLoans) {
      const monthlyDeduction = parseFloat(loan.monthlyDeduction.toString());
      const remainingBalance = parseFloat(loan.remainingBalance.toString());

      // Deduct the monthly amount or remaining balance, whichever is smaller
      const deduction = Math.min(monthlyDeduction, remainingBalance);
      totalLoanDeduction += deduction;
    }

    return totalLoanDeduction;
  } catch (error: any) {
    logger.error(`Error calculating loan deductions for employee ${employeeId}:`, error);
    return 0; // Return 0 on error to not break payroll processing
  }
}

/**
 * Get active loans for an employee that need repayment in a period
 */
export async function getActiveLoansForPeriod(
  employeeId: string,
  _periodStart: Date,
  periodEnd: Date
): Promise<EmployeeLoan[]> {
  try {
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    const activeLoans = await EmployeeLoan.findAll({
      where: {
        employeeId,
        status: "active",
        repaymentStartDate: { [Op.lte]: periodEndStr },
        remainingBalance: { [Op.gt]: 0 },
      },
    });

    return activeLoans;
  } catch (error: any) {
    logger.error(`Error getting active loans for employee ${employeeId}:`, error);
    return [];
  }
}

/**
 * Process payroll for entire period
 */
export async function processPayrollPeriod(periodId: string): Promise<void> {
  try {
    // This will be implemented in the PayrollPeriod controller
    // It will:
    // 1. Get all active employees
    // 2. Calculate payroll for each employee
    // 3. Create Payroll and PayrollItem records
    // 4. Update period status

    logger.info(`Processing payroll period ${periodId}`);
    // Implementation will be in the controller
  } catch (error: any) {
    logger.error(`Error processing payroll period ${periodId}:`, error);
    throw error;
  }
}

