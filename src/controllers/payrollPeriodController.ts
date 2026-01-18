/**
 * Payroll Period Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PayrollPeriod, Payroll, Employee, LoanRepayment, PayrollItem, Payslip, EmployeeSalaryComponent, SalaryComponent } from "../models";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import { calculateEmployeePayroll, getActiveLoansForPeriod } from "../services/payrollCalculationService";

/**
 * Get all payroll periods
 */
export async function getPayrollPeriods(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { status, periodType, page = 1, limit = 30 } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (periodType) {
      whereClause.periodType = periodType;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: periods } = await PayrollPeriod.findAndCountAll({
      where: whereClause,
      order: [["startDate", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      periods,
      total: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error: any) {
    logger.error("Get payroll periods error:", error);
    res.status(500).json({ error: "Failed to get payroll periods" });
  }
}

/**
 * Get single payroll period
 */
export async function getPayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: Payroll,
          as: "payrolls",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "firstName", "lastName", "employeeNumber"],
            },
          ],
        },
      ],
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    res.json({ period });
  } catch (error: any) {
    logger.error("Get payroll period error:", error);
    res.status(500).json({ error: "Failed to get payroll period" });
  }
}

/**
 * Calculate preview of employees with active salary components for a period
 */
async function calculatePeriodPreview(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ employeeCount: number }> {
  const periodStartStr = periodStart.toISOString().split("T")[0];
  const periodEndStr = periodEnd.toISOString().split("T")[0];

  // Get all active employees
  const activeEmployees = await Employee.findAll({
    where: {
      tenantId,
      status: "active",
    },
    attributes: ["id"],
  });

  let employeesWithSalary = 0;

  // For each employee, check if they have active salary components for the period
  for (const employee of activeEmployees) {
    const activeComponents = await EmployeeSalaryComponent.findOne({
      where: {
        employeeId: employee.id,
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

    if (activeComponents) {
      employeesWithSalary++;
    }
  }

  logger.debug(
    `Period preview: ${employeesWithSalary} out of ${activeEmployees.length} active employees have salary components for period ${periodStartStr} to ${periodEndStr}`
  );

  return { employeeCount: employeesWithSalary };
}

/**
 * Create payroll period
 */
export async function createPayrollPeriod(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { name, periodType, startDate, endDate, payDate } = req.body;

    // Check for overlapping periods
    const overlapping = await PayrollPeriod.findOne({
      where: {
        tenantId,
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
        status: { [Op.ne]: "locked" },
      },
    });

    if (overlapping) {
      res.status(400).json({ error: "Period overlaps with existing period" });
      return;
    }

    // Calculate preview of employees with active salary components
    const preview = await calculatePeriodPreview(
      tenantId,
      new Date(startDate),
      new Date(endDate)
    );

    const period = await PayrollPeriod.create({
      tenantId,
      name,
      periodType,
      startDate,
      endDate,
      payDate,
      status: "draft",
      totalEmployees: preview.employeeCount, // Set preview count
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      createdBy: req.user.id,
    });

    logger.info(
      `Created payroll period ${period.id} with preview: ${preview.employeeCount} employees with active salary components`
    );

    res.status(201).json({ period });
  } catch (error: any) {
    logger.error("Create payroll period error:", error);
    res.status(500).json({ error: "Failed to create payroll period" });
  }
}

/**
 * Update payroll period
 */
export async function updatePayrollPeriod(
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
    const { name, periodType, startDate, endDate, payDate } = req.body;

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status === "locked" || period.status === "paid") {
      res.status(400).json({ error: "Cannot update locked or paid period" });
      return;
    }

    await period.update({
      name,
      periodType,
      startDate,
      endDate,
      payDate,
      updatedBy: req.user.id,
    });

    res.json({ period });
  } catch (error: any) {
    logger.error("Update payroll period error:", error);
    res.status(500).json({ error: "Failed to update payroll period" });
  }
}

/**
 * Process payroll for period
 */
export async function processPayrollPeriod(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      await transaction.rollback();
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
      transaction,
    });

    if (!period) {
      await transaction.rollback();
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status !== "draft" && period.status !== "pending_approval") {
      await transaction.rollback();
      res.status(400).json({ error: "Period cannot be processed in current status" });
      return;
    }

    // Update status to processing within transaction
    await period.update(
      {
        status: "processing",
        processedBy: req.user.id,
      },
      { transaction }
    );

    // Get all active employees for the tenant
    const employees = await Employee.findAll({
      where: {
        tenantId,
        status: "active",
      },
      transaction,
    });

    logger.info(
      `Processing payroll period ${period.id}: Found ${employees.length} active employees`
    );

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let processedCount = 0;
    let skippedCount = 0;

    // Process payroll for each employee within transaction
    for (const employee of employees) {
      try {
        const calculation = await calculateEmployeePayroll(
          employee,
          new Date(period.startDate),
          new Date(period.endDate)
        );

        logger.debug(
          `Employee ${employee.id} (${employee.firstName} ${employee.lastName}): Gross=${calculation.grossPay}, Net=${calculation.netPay}`
        );

        // Check if payroll already exists
        let payroll = await Payroll.findOne({
          where: {
            payrollPeriodId: period.id,
            employeeId: employee.id,
          },
          transaction,
        });

        if (payroll) {
          // Update existing payroll within transaction
          await payroll.update(
            {
              grossPay: calculation.grossPay,
              totalEarnings: calculation.grossPay,
              totalDeductions: calculation.totalDeductions,
              netPay: calculation.netPay,
              payeAmount: calculation.statutoryDeductions.paye,
              nssfAmount: calculation.statutoryDeductions.nssf,
              nhifAmount: calculation.statutoryDeductions.nhif,
              status: "calculated",
            },
            { transaction }
          );
        } else {
          // Create new payroll within transaction
          payroll = await Payroll.create(
            {
              payrollPeriodId: period.id,
              employeeId: employee.id,
              grossPay: calculation.grossPay,
              totalEarnings: calculation.grossPay,
              totalDeductions: calculation.totalDeductions,
              netPay: calculation.netPay,
              payeAmount: calculation.statutoryDeductions.paye,
              nssfAmount: calculation.statutoryDeductions.nssf,
              nhifAmount: calculation.statutoryDeductions.nhif,
              status: "calculated",
            },
            { transaction }
          );
        }

        // Process loan repayments within transaction
        const activeLoans = await getActiveLoansForPeriod(
          employee.id,
          new Date(period.startDate),
          new Date(period.endDate)
        );

        for (const loan of activeLoans) {
          const monthlyDeduction = parseFloat(loan.monthlyDeduction.toString());
          const remainingBalance = parseFloat(loan.remainingBalance.toString());

          if (remainingBalance <= 0) {
            continue; // Skip fully paid loans
          }

          // Calculate deduction amount (monthly deduction or remaining balance, whichever is smaller)
          const deductionAmount = Math.min(monthlyDeduction, remainingBalance);
          const newBalance = remainingBalance - deductionAmount;
          const newTotalPaid = parseFloat(loan.totalPaid.toString()) + deductionAmount;

          // Create repayment record within transaction
          await LoanRepayment.create(
            {
              loanId: loan.id,
              payrollId: payroll.id,
              amount: deductionAmount,
              repaymentDate: period.endDate,
              paymentType: "payroll",
              balanceAfter: newBalance,
              notes: `Automatic deduction from payroll period ${period.name}`,
              createdBy: req.user.id,
            },
            { transaction }
          );

          // Update loan within transaction
          const updatedStatus = newBalance <= 0 ? "completed" : "active";
          await loan.update(
            {
              remainingBalance: newBalance,
              totalPaid: newTotalPaid,
              status: updatedStatus,
              updatedBy: req.user.id,
            },
            { transaction }
          );
        }

        totalGross += calculation.grossPay;
        totalDeductions += calculation.totalDeductions;
        totalNet += calculation.netPay;
        processedCount++;
      } catch (error: any) {
        logger.error(
          `Error processing payroll for employee ${employee.id} (${employee.firstName} ${employee.lastName}):`,
          error
        );
        skippedCount++;
        // Continue processing other employees even if one fails
        // Create a payroll record with 0 amounts for failed employees
        try {
          const existingPayroll = await Payroll.findOne({
            where: {
              payrollPeriodId: period.id,
              employeeId: employee.id,
            },
            transaction,
          });

          if (!existingPayroll) {
            await Payroll.create(
              {
                payrollPeriodId: period.id,
                employeeId: employee.id,
                grossPay: 0,
                totalEarnings: 0,
                totalDeductions: 0,
                netPay: 0,
                payeAmount: 0,
                nssfAmount: 0,
                nhifAmount: 0,
                status: "error",
              },
              { transaction }
            );
          }
        } catch (createError: any) {
          logger.error(
            `Failed to create error payroll record for employee ${employee.id}:`,
            createError
          );
        }
      }
    }

    logger.info(
      `Payroll processing complete: ${processedCount} processed, ${skippedCount} skipped, Total Gross=${totalGross}, Total Net=${totalNet}`
    );

    // Update period totals within transaction
    // Use processedCount instead of employees.length to only count successfully processed employees
    await period.update(
      {
        status: "pending_approval",
        totalEmployees: processedCount, // Count only successfully processed employees
        totalGross,
        totalDeductions,
        totalNet,
        processedAt: new Date(),
      },
      { transaction }
    );

    logger.info(
      `Updated payroll period ${period.id}: ${processedCount} employees, Gross=${totalGross}, Net=${totalNet}`
    );

    await transaction.commit();

    // Reload period to get updated data
    await period.reload();

    res.json({
      message: "Payroll processed successfully",
      period,
      summary: {
        totalEmployees: employees.length,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  } catch (error: any) {
    await transaction.rollback();
    logger.error("Process payroll period error:", error);
    res.status(500).json({ error: "Failed to process payroll period" });
  }
}

/**
 * Approve payroll period
 */
export async function approvePayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status !== "pending_approval") {
      res.status(400).json({ error: "Period must be in pending_approval status" });
      return;
    }

    await period.update({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: req.user.id,
    });

    res.json({ period });
  } catch (error: any) {
    logger.error("Approve payroll period error:", error);
    res.status(500).json({ error: "Failed to approve payroll period" });
  }
}

/**
 * Lock payroll period
 */
export async function lockPayrollPeriod(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    if (period.status !== "approved") {
      res.status(400).json({ error: "Period must be approved before locking" });
      return;
    }

    await period.update({
      status: "locked",
      lockedAt: new Date(),
      lockedBy: req.user.id,
    });

    res.json({ period });
  } catch (error: any) {
    logger.error("Lock payroll period error:", error);
    res.status(500).json({ error: "Failed to lock payroll period" });
  }
}

/**
 * Get payroll period summary
 */
export async function getPayrollPeriodSummary(
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

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: Payroll,
          as: "payrolls",
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "firstName", "lastName", "employeeNumber", "departmentId"],
            },
          ],
        },
      ],
    });

    if (!period) {
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    const payrolls = period.get("payrolls") as Payroll[];

    res.json({
      period,
      summary: {
        totalEmployees: payrolls.length,
        totalGross: period.totalGross,
        totalDeductions: period.totalDeductions,
        totalNet: period.totalNet,
        payrolls: payrolls.map((p) => ({
          id: p.id,
          employee: p.get("employee"),
          grossPay: p.grossPay,
          totalDeductions: p.totalDeductions,
          netPay: p.netPay,
          status: p.status,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Get payroll period summary error:", error);
    res.status(500).json({ error: "Failed to get payroll period summary" });
  }
}

/**
 * Delete payroll period
 */
export async function deletePayrollPeriod(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      await transaction.rollback();
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;

    const period = await PayrollPeriod.findOne({
      where: {
        id,
        tenantId,
      },
      transaction,
    });

    if (!period) {
      await transaction.rollback();
      res.status(404).json({ error: "Payroll period not found" });
      return;
    }

    // Only allow deletion of draft periods
    if (period.status !== "draft") {
      await transaction.rollback();
      res.status(400).json({
        error: "Only draft payroll periods can be deleted",
      });
      return;
    }

    // Get all payrolls for this period
    const payrolls = await Payroll.findAll({
      where: {
        payrollPeriodId: id,
      },
      transaction,
    });

    const payrollIds = payrolls.map((p) => p.id);

    // Delete payslips
    if (payrollIds.length > 0) {
      await Payslip.destroy({
        where: {
          payrollId: { [Op.in]: payrollIds },
        },
        transaction,
      });

      // Delete payroll items
      await PayrollItem.destroy({
        where: {
          payrollId: { [Op.in]: payrollIds },
        },
        transaction,
      });
    }

    // Delete payrolls
    await Payroll.destroy({
      where: {
        payrollPeriodId: id,
      },
      transaction,
    });

    // Delete the period
    await period.destroy({ transaction });

    await transaction.commit();

    res.json({ message: "Payroll period deleted successfully" });
  } catch (error: any) {
    await transaction.rollback();
    logger.error("Delete payroll period error:", error);
    res.status(500).json({ error: "Failed to delete payroll period" });
  }
}

