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
    const { asOfDate } = req.query; // Optional query parameter to view components as of a specific date
    const today = new Date().toISOString().split("T")[0];
    const viewDate = asOfDate ? (asOfDate as string) : today;

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

    // Get active salary components as of the view date
    // A component is active if:
    // - It starts on or before the view date (effectiveFrom <= viewDate)
    // - It hasn't ended yet (effectiveTo IS NULL OR effectiveTo >= viewDate) - includes components ending on viewDate
    // - The SalaryComponent itself is active (isActive = true)
    const salaryComponents = await EmployeeSalaryComponent.findAll({
      where: {
        employeeId,
        effectiveFrom: { [Op.lte]: viewDate },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: viewDate } }, // Changed to >= to include components ending on viewDate
        ],
      },
      include: [
        {
          model: SalaryComponent,
          as: "salaryComponent",
          required: true,
          where: {
            isActive: true, // Only include active salary components
          },
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

    logger.debug(
      `Found ${salaryComponents.length} active salary components for employee ${employeeId} as of ${viewDate}`
    );

    // Log details of each component for debugging
    if (salaryComponents.length === 0) {
      // Check if there are any components at all (even inactive ones)
      const allComponents = await EmployeeSalaryComponent.findAll({
        where: { employeeId },
        include: [
          {
            model: SalaryComponent,
            as: "salaryComponent",
            required: false,
          },
        ],
        limit: 10, // Just check first 10 for debugging
      });

      logger.debug(
        `No active components found for employee ${employeeId}. Total components in database: ${allComponents.length}`
      );

      if (allComponents.length > 0) {
        allComponents.forEach((comp) => {
          const salaryComp = comp.get(
            "salaryComponent"
          ) as SalaryComponent | null;
          logger.debug(
            `Component ${comp.id}: effectiveFrom=${comp.effectiveFrom}, effectiveTo=${comp.effectiveTo}, salaryComponentId=${comp.salaryComponentId}, isActive=${salaryComp?.isActive ?? "N/A"}`
          );
        });
      }
    }

    // Calculate totals - only include active components
    let totalEarnings = 0;
    let totalDeductions = 0;

    salaryComponents.forEach((esc) => {
      const component = esc.get("salaryComponent") as SalaryComponent;

      // Double-check that component is active (safety check)
      if (!component || !component.isActive) {
        logger.warn(
          `Skipping inactive component ${component?.id} for employee ${employeeId}`
        );
        return;
      }

      const amount = parseFloat(esc.amount.toString());
      if (component.type === "earning") {
        totalEarnings += amount;
      } else {
        totalDeductions += amount;
      }
    });

    logger.debug(
      `Calculated salary totals for employee ${employeeId}: Earnings=${totalEarnings}, Deductions=${totalDeductions}, Gross=${totalEarnings}, Net=${totalEarnings - totalDeductions}`
    );

    res.json({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNumber: employee.employeeNumber,
      },
      salaryComponents: salaryComponents.map((esc) => ({
        id: esc.id,
        salaryComponent: esc.get("salaryComponent"),
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

      // Check for duplicate active components - prevent adding components that already exist
      const today = new Date().toISOString().split("T")[0];
      const existingActiveComponents = await EmployeeSalaryComponent.findAll({
        where: {
          employeeId,
          salaryComponentId: { [Op.in]: componentIds },
          effectiveFrom: { [Op.lte]: today },
          [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gt]: today } }],
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
        transaction,
      });

      if (existingActiveComponents.length > 0) {
        await transaction.rollback();
        const duplicateNames = existingActiveComponents
          .map((esc) => {
            const comp = esc.get("salaryComponent") as SalaryComponent;
            return comp.name;
          })
          .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates

        res.status(400).json({
          error: `Cannot add duplicate salary components. The following components already exist for this employee: ${duplicateNames.join(", ")}. Please edit the existing components instead.`,
          duplicateComponents: duplicateNames,
        });
        return;
      }

      // Calculate end date for components being replaced (day before effectiveDate)
      const endDate = new Date(effectiveDate);
      endDate.setDate(endDate.getDate() - 1);

      // First, end ANY components that have the exact same (employee_id, salary_component_id, effective_from)
      // This prevents unique constraint violations - end ALL matching components regardless of effectiveTo status
      // componentIds is already declared above, so we reuse it
      if (componentIds.length > 0) {
        // Delete or end ALL components with the same combination - don't filter by effectiveTo
        // This ensures we catch components that might have been ended but still violate the unique constraint
        const duplicateComponents = await EmployeeSalaryComponent.findAll({
          where: {
            employeeId,
            salaryComponentId: { [Op.in]: componentIds },
            effectiveFrom: effectiveDate,
          },
          transaction,
        });

        if (duplicateComponents.length > 0) {
          logger.debug(
            `Found ${duplicateComponents.length} duplicate components to end for employee ${employeeId} with effectiveFrom ${effectiveDate}`
          );

          // End all duplicate components
          const updatedCount = await EmployeeSalaryComponent.update(
            {
              effectiveTo: endDate,
              updatedBy: req.user.id,
            },
            {
              where: {
                employeeId,
                salaryComponentId: { [Op.in]: componentIds },
                effectiveFrom: effectiveDate,
                // Don't filter by effectiveTo - end ALL matching components
              },
              transaction,
            }
          );

          logger.debug(
            `Ended ${updatedCount[0]} duplicate components for employee ${employeeId}`
          );
        }
      }

      // End previous components that are still active within transaction
      // This handles components that started before the effective date
      const previousUpdatedCount = await EmployeeSalaryComponent.update(
        {
          effectiveTo: endDate,
          updatedBy: req.user.id,
        },
        {
          where: {
            employeeId,
            effectiveFrom: { [Op.lt]: effectiveDate }, // Use < instead of <= to avoid double-updating
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: effectiveDate } },
            ],
          },
          transaction,
        }
      );

      logger.debug(
        `Ended ${previousUpdatedCount[0]} previous components for employee ${employeeId}`
      );

      // Calculate default effectiveTo for each component if not provided
      // Default to 40 years from effectiveFrom or contractEndDate (whichever is earlier)
      const fortyYearsFromNow = new Date(effectiveDate);
      fortyYearsFromNow.setFullYear(fortyYearsFromNow.getFullYear() + 40);

      // Get employee contract end date if available
      const employeeWithContract = await Employee.findByPk(employeeId, {
        attributes: ["contractEndDate"],
        transaction,
      });

      const contractEndDate = employeeWithContract?.contractEndDate
        ? new Date(employeeWithContract.contractEndDate)
        : null;

      // Before creating, verify no duplicates exist (double-check)
      for (const comp of components) {
        const existing = await EmployeeSalaryComponent.findOne({
          where: {
            employeeId,
            salaryComponentId: comp.salaryComponentId,
            effectiveFrom: effectiveDate,
          },
          transaction,
        });

        if (existing) {
          // If still exists, delete it to be safe
          logger.warn(
            `Found duplicate component ${existing.id} for employee ${employeeId}, salaryComponent ${comp.salaryComponentId}, effectiveFrom ${effectiveDate}. Deleting it.`
          );
          await existing.destroy({ transaction });
        }
      }

      // Calculate effectiveTo for each component
      const componentsToCreate = components.map((comp: any) => {
        let effectiveTo: Date | null = null;

        if (comp.effectiveTo) {
          // Use explicitly provided effectiveTo
          effectiveTo = new Date(comp.effectiveTo);
        } else {
          // Calculate default: 40 years from effectiveFrom or contractEndDate (whichever is earlier)
          const defaultDate = fortyYearsFromNow;
          if (contractEndDate && contractEndDate < defaultDate) {
            effectiveTo = contractEndDate;
          } else {
            effectiveTo = defaultDate;
          }
        }

        return {
          employeeId,
          salaryComponentId: comp.salaryComponentId,
          amount: comp.amount,
          effectiveFrom: effectiveDate,
          effectiveTo: effectiveTo.toISOString().split("T")[0], // Convert to DATEONLY format
          createdBy: req.user?.id || null,
        };
      });

      // Create new salary component assignments within transaction
      const newAssignments = await Promise.all(
        componentsToCreate.map((compData: any) =>
          EmployeeSalaryComponent.create(compData, { transaction })
        )
      );

      logger.debug(
        `Created ${newAssignments.length} new salary components for employee ${employeeId}`
      );

      // Create salary revision history entry within transaction
      if (reason && req.user) {
        // Calculate previous gross from existing active components before this assignment
        const previousDate = new Date(effectiveDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toISOString().split("T")[0];

        const previousActiveComponents = await EmployeeSalaryComponent.findAll({
          where: {
            employeeId,
            effectiveFrom: { [Op.lte]: previousDateStr },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gt]: previousDateStr } },
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
          transaction,
        });

        const previousGross = previousActiveComponents.reduce(
          (sum, esc) => sum + parseFloat(esc.amount.toString()),
          0
        );

        // Calculate new gross from the components being assigned
        const newGross = components
          .filter((c: any) => {
            const comp = validComponents.find(
              (vc) => vc.id === c.salaryComponentId
            );
            return comp && comp.type === "earning" && comp.isActive;
          })
          .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

        // Calculate change percentage
        const changePercentage =
          previousGross > 0
            ? ((newGross - previousGross) / previousGross) * 100
            : newGross > 0
              ? 100
              : null;

        await SalaryRevisionHistory.create(
          {
            employeeId,
            revisionDate: new Date(effectiveDate),
            previousGross,
            newGross,
            changePercentage,
            reason,
            componentChanges: components || {},
            createdBy: req.user.id,
          },
          { transaction }
        );

        logger.debug(
          `Created salary revision history for employee ${employeeId}: previousGross=${previousGross}, newGross=${newGross}, changePercentage=${changePercentage}`
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

    // Ensure numeric fields are returned as numbers (Sequelize DECIMAL can return as strings)
    const formattedRevisions = revisions.map((rev) => ({
      ...rev.toJSON(),
      previousGross: Number(rev.previousGross) || 0,
      newGross: Number(rev.newGross) || 0,
      changePercentage:
        rev.changePercentage != null ? Number(rev.changePercentage) : null,
    }));

    res.json({ revisions: formattedRevisions });
  } catch (error: any) {
    logger.error("Get salary revision history error:", error);
    res.status(500).json({ error: "Failed to get salary revision history" });
  }
}

/**
 * Create salary revision with proper CRUD operations
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
    const {
      effectiveFrom,
      reason,
      modifiedComponents,
      newComponents,
      deletedComponentIds,
    } = req.body;

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
            { effectiveTo: { [Op.gt]: previousDateStr } }, // Use > instead of >= for consistency
          ],
        },
        include: [
          {
            model: SalaryComponent,
            as: "salaryComponent",
            required: true,
            where: {
              isActive: true, // Only include active salary components
            },
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

      logger.debug(
        `Calculated previous gross pay for employee ${employeeId}: ${previousGrossPay}`
      );

      // STEP 1: Process Modified Components (UPDATE)
      if (
        modifiedComponents &&
        Array.isArray(modifiedComponents) &&
        modifiedComponents.length > 0
      ) {
        for (const comp of modifiedComponents) {
          await EmployeeSalaryComponent.update(
            {
              amount: comp.amount,
              effectiveTo: comp.effectiveTo ? new Date(comp.effectiveTo) : null,
              updatedBy: req.user.id,
            },
            {
              where: { id: comp.id, employeeId },
              transaction,
            }
          );
        }
        logger.debug(
          `Updated ${modifiedComponents.length} modified components for employee ${employeeId}`
        );
      }

      // STEP 2: Process Deleted Components (UPDATE effectiveTo)
      if (
        deletedComponentIds &&
        Array.isArray(deletedComponentIds) &&
        deletedComponentIds.length > 0
      ) {
        const endDate = new Date(effectiveFrom);
        endDate.setDate(endDate.getDate() - 1);

        const updatedCount = await EmployeeSalaryComponent.update(
          {
            effectiveTo: endDate,
            updatedBy: req.user.id,
          },
          {
            where: {
              id: { [Op.in]: deletedComponentIds },
              employeeId,
            },
            transaction,
          }
        );
        logger.debug(
          `Ended ${updatedCount[0]} deleted components for employee ${employeeId}`
        );
      }

      // STEP 3: Process New Components (CREATE)
      if (
        newComponents &&
        Array.isArray(newComponents) &&
        newComponents.length > 0
      ) {
        // Validate that all salary components exist and are active
        const componentIds = newComponents.map((c: any) => c.salaryComponentId);
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

        // Calculate default effectiveTo if not provided
        const fortyYearsFromNow = new Date(effectiveFrom);
        fortyYearsFromNow.setFullYear(fortyYearsFromNow.getFullYear() + 40);

        const employeeWithContract = await Employee.findByPk(employeeId, {
          attributes: ["contractEndDate"],
          transaction,
        });

        const contractEndDate = employeeWithContract?.contractEndDate
          ? new Date(employeeWithContract.contractEndDate)
          : null;

        // Create new components - handle duplicates by ending existing ones first
        const userId = req.user.id;
        const endDate = new Date(effectiveFrom);
        endDate.setDate(endDate.getDate() - 1);

        let createdCount = 0;

        for (const comp of newComponents) {
          // Check for existing active component with same (employee_id, salary_component_id, effective_from)
          const existing = await EmployeeSalaryComponent.findOne({
            where: {
              employeeId,
              salaryComponentId: comp.salaryComponentId,
              effectiveFrom,
            },
            transaction,
          });

          if (existing) {
            // End the existing component first
            await EmployeeSalaryComponent.update(
              {
                effectiveTo: endDate,
                updatedBy: userId,
              },
              {
                where: { id: existing.id },
                transaction,
              }
            );
            logger.debug(
              `Ended existing component ${existing.id} before creating new one for employee ${employeeId}, salaryComponent ${comp.salaryComponentId}`
            );
          }

          // Calculate effectiveTo
          let effectiveTo: Date | null = null;
          if (comp.effectiveTo) {
            effectiveTo = new Date(comp.effectiveTo);
          } else {
            const defaultDate = fortyYearsFromNow;
            if (contractEndDate && contractEndDate < defaultDate) {
              effectiveTo = contractEndDate;
            } else {
              effectiveTo = defaultDate;
            }
          }

          // Create new component
          await EmployeeSalaryComponent.create(
            {
              employeeId,
              salaryComponentId: comp.salaryComponentId,
              amount: comp.amount,
              effectiveFrom,
              effectiveTo: effectiveTo || null,
              createdBy: userId,
            },
            { transaction }
          );
          createdCount++;
        }

        logger.debug(
          `Created ${createdCount} new components for employee ${employeeId}`
        );
      }

      // STEP 4: Calculate New Gross Pay (Query actual state after all operations)
      const activeComponentsAfterRevision =
        await EmployeeSalaryComponent.findAll({
          where: {
            employeeId,
            effectiveFrom: { [Op.lte]: effectiveFrom },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gt]: effectiveFrom } },
            ],
          },
          include: [
            {
              model: SalaryComponent,
              as: "salaryComponent",
              required: true,
              where: {
                isActive: true,
                type: "earning",
              },
            },
          ],
          transaction,
        });

      const newGrossPay = activeComponentsAfterRevision.reduce(
        (sum, esc) => sum + parseFloat(esc.amount.toString()),
        0
      );

      logger.debug(
        `Calculated new gross pay for employee ${employeeId}: ${newGrossPay}`
      );

      // STEP 5: Create Revision History
      const changePercentage =
        previousGrossPay > 0
          ? ((newGrossPay - previousGrossPay) / previousGrossPay) * 100
          : newGrossPay > 0
            ? 100
            : null;

      const revision = await SalaryRevisionHistory.create(
        {
          employeeId,
          revisionDate: new Date(effectiveFrom),
          previousGross: previousGrossPay,
          newGross: newGrossPay,
          changePercentage,
          reason,
          componentChanges: {
            modified: modifiedComponents || [],
            new: newComponents || [],
            deleted: deletedComponentIds || [],
          },
          createdBy: req.user.id,
        },
        { transaction }
      );

      logger.debug(
        `Created salary revision history for employee ${employeeId}: previousGross=${previousGrossPay}, newGross=${newGrossPay}, changePercentage=${changePercentage}`
      );

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
