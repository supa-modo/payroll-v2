/**
 * Employee Salary Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  Employee,
  EmployeeSalaryComponent,
  SalaryComponent,
  SalaryRevisionHistory,
} from "../models";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get current salary structure for employee
 */
export async function getEmployeeSalary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    // Get current active salary components
    const salaryComponents = await EmployeeSalaryComponent.findAll({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: today },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: today } }],
      },
      include: [
        {
          model: SalaryComponent,
          as: "salaryComponent",
          required: true,
        },
      ],
      order: [
        [
          { model: SalaryComponent, as: "salaryComponent" },
          "displayOrder",
          "ASC",
        ],
        [{ model: SalaryComponent, as: "salaryComponent" }, "type", "ASC"],
      ],
    });

    // Calculate totals
    let totalEarnings = 0;
    let totalDeductions = 0;

    salaryComponents.forEach((esc) => {
      const component = esc.get("salaryComponent") as SalaryComponent;
      const amount = parseFloat(esc.amount.toString());
      if (component.type === "earning") {
        totalEarnings += amount;
      } else {
        totalDeductions += amount;
      }
    });

    res.json({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNumber: employee.employeeNumber,
      },
      salaryComponents: salaryComponents.map((esc) => ({
        id: esc.id,
        component: esc.get("salaryComponent"),
        amount: esc.amount,
        effectiveFrom: esc.effectiveFrom,
        effectiveTo: esc.effectiveTo,
      })),
      totals: {
        earnings: totalEarnings,
        deductions: totalDeductions,
        grossPay: totalEarnings,
        netPay: totalEarnings - totalDeductions,
      },
    });
  } catch (error: any) {
    logger.error("Get employee salary error:", error);
    res.status(500).json({ error: "Failed to get employee salary" });
  }
}

/**
 * Assign/update salary components for employee
 */
export async function assignSalaryComponents(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId } = req.params;
    const { components, effectiveFrom, reason } = req.body;

    if (!Array.isArray(components) || components.length === 0) {
      res
        .status(400)
        .json({ error: "At least one salary component is required" });
      return;
    }

    const transaction = await sequelize.transaction();

    try {
      // Verify employee belongs to tenant
      const employee = await Employee.findOne({
        where: {
          id: employeeId,
          tenantId,
        },
        transaction,
      });

      if (!employee) {
        await transaction.rollback();
        res.status(404).json({ error: "Employee not found" });
        return;
      }

      const effectiveDate =
        effectiveFrom || new Date().toISOString().split("T")[0];

      // Validate all components exist and belong to tenant
      const componentIds = components.map((c: any) => c.salaryComponentId);
      const validComponents = await SalaryComponent.findAll({
        where: {
          id: { [Op.in]: componentIds },
          tenantId,
          isActive: true,
        },
        transaction,
      });

      if (validComponents.length !== componentIds.length) {
        await transaction.rollback();
        res
          .status(400)
          .json({ error: "One or more salary components are invalid" });
        return;
      }

      // End previous components that are still active within transaction
      await EmployeeSalaryComponent.update(
        {
          effectiveTo: new Date(effectiveDate),
          updatedBy: req.user.id,
        },
        {
          where: {
            employeeId,
            effectiveFrom: { [Op.lte]: effectiveDate },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: effectiveDate } },
            ],
          },
          transaction,
        }
      );

      // Create new salary component assignments within transaction
      const newAssignments = await Promise.all(
        components.map((comp: any) =>
          EmployeeSalaryComponent.create(
            {
              employeeId,
              salaryComponentId: comp.salaryComponentId,
              amount: comp.amount,
              effectiveFrom: effectiveDate,
              effectiveTo: comp.effectiveTo || null,
              createdBy: req.user?.id || null,
            },
            { transaction }
          )
        )
      );

      // Create salary revision history entry within transaction
      if (reason && req.user) {
        const newGross = components
          .filter((c: any) => {
            const comp = validComponents.find(
              (vc) => vc.id === c.salaryComponentId
            );
            return comp && comp.type === "earning";
          })
          .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

        await SalaryRevisionHistory.create(
          {
            employeeId,
            revisionDate: new Date(effectiveDate),
            previousGross: 0, // Could calculate from previous components
            newGross,
            reason,
            componentChanges: {},
            createdBy: req.user.id,
          },
          { transaction }
        );
      }

      await transaction.commit();

      res.status(201).json({
        message: "Salary components assigned successfully",
        assignments: newAssignments,
      });
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error("Assign salary components error:", error);

    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to assign salary components",
        details: error.message || "Unknown error",
      });
    }
  }
}

/**
 * Get salary revision history for employee
 */
export async function getSalaryRevisionHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId } = req.params;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const revisions = await SalaryRevisionHistory.findAll({
      where: {
        employeeId,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "employeeNumber"],
        },
      ],
      order: [["revisionDate", "DESC"]],
    });

    res.json({ revisions });
  } catch (error: any) {
    logger.error("Get salary revision history error:", error);
    res.status(500).json({ error: "Failed to get salary revision history" });
  }
}

/**
 * Create salary revision
 */
export async function createSalaryRevision(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId } = req.params;
    const { effectiveFrom, reason, components } = req.body;

    if (!effectiveFrom || !reason) {
      res.status(400).json({ error: "Effective date and reason are required" });
      return;
    }

    const transaction = await sequelize.transaction();

    try {
      // Verify employee belongs to tenant
      const employee = await Employee.findOne({
        where: {
          id: employeeId,
          tenantId,
        },
        transaction,
      });

      if (!employee) {
        await transaction.rollback();
        res.status(404).json({ error: "Employee not found" });
        return;
      }

      // Calculate previous gross pay
      const previousDate = new Date(effectiveFrom);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split("T")[0];

      const previousComponents = await EmployeeSalaryComponent.findAll({
        where: {
          employeeId,
          effectiveFrom: { [Op.lte]: previousDateStr },
          [Op.or]: [
            { effectiveTo: null },
            { effectiveTo: { [Op.gte]: previousDateStr } },
          ],
        },
        include: [
          {
            model: SalaryComponent,
            as: "salaryComponent",
            required: true,
          },
        ],
        transaction,
      });

      const previousGrossPay = previousComponents
        .filter((esc) => {
          const comp = esc.get("salaryComponent") as SalaryComponent;
          return comp.type === "earning";
        })
        .reduce((sum, esc) => sum + parseFloat(esc.amount.toString()), 0);

      // Calculate new gross pay if components provided
      let newGrossPay = previousGrossPay;
      if (components && Array.isArray(components)) {
        const componentIds = components.map((c: any) => c.salaryComponentId);
        const validComponents = await SalaryComponent.findAll({
          where: {
            id: { [Op.in]: componentIds },
            tenantId,
          },
          transaction,
        });

        newGrossPay = components
          .filter((c: any) => {
            const comp = validComponents.find(
              (vc) => vc.id === c.salaryComponentId
            );
            return comp && comp.type === "earning";
          })
          .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);
      }

      // Create revision history entry within transaction
      const changePercentage =
        previousGrossPay > 0
          ? ((newGrossPay - previousGrossPay) / previousGrossPay) * 100
          : null;

      const revision = await SalaryRevisionHistory.create(
        {
          employeeId,
          revisionDate: new Date(effectiveFrom),
          previousGross: previousGrossPay,
          newGross: newGrossPay,
          changePercentage,
          reason,
          componentChanges: components || {},
          createdBy: req.user.id,
        },
        { transaction }
      );

      // If components provided, assign them within the same transaction
      if (components && Array.isArray(components) && components.length > 0) {
        const componentIds = components.map((c: any) => c.salaryComponentId);
        const validComponents = await SalaryComponent.findAll({
          where: {
            id: { [Op.in]: componentIds },
            tenantId,
            isActive: true,
          },
          transaction,
        });

        if (validComponents.length !== componentIds.length) {
          await transaction.rollback();
          res
            .status(400)
            .json({ error: "One or more salary components are invalid" });
          return;
        }

        const effectiveDate = effectiveFrom;

        // End previous components that are still active within transaction
        await EmployeeSalaryComponent.update(
          {
            effectiveTo: new Date(effectiveDate),
            updatedBy: req.user.id,
          },
          {
            where: {
              employeeId,
              effectiveFrom: { [Op.lte]: effectiveDate },
              [Op.or]: [
                { effectiveTo: null },
                { effectiveTo: { [Op.gte]: effectiveDate } },
              ],
            },
            transaction,
          }
        );

        // Create new salary component assignments within transaction
        await Promise.all(
          components.map((comp: any) =>
            EmployeeSalaryComponent.create(
              {
                employeeId,
                salaryComponentId: comp.salaryComponentId,
                amount: comp.amount,
                effectiveFrom: effectiveDate,
                effectiveTo: comp.effectiveTo || null,
                createdBy: req.user?.id || null,
              },
              { transaction }
            )
          )
        );
      }

      await transaction.commit();

      res.status(201).json({ revision });
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error("Create salary revision error:", error);

    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to create salary revision",
        details: error.message || "Unknown error",
      });
    }
  }
}
