/**
 * Employee Bank Details Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Employee, EmployeeBankDetails } from "../models";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all bank details for employee
 */
export async function getBankDetails(
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

    const bankDetails = await EmployeeBankDetails.findAll({
      where: {
        employeeId,
      },
      order: [["isPrimary", "DESC"], ["createdAt", "ASC"]],
    });

    res.json({ bankDetails });
  } catch (error: any) {
    logger.error("Get bank details error:", error);
    res.status(500).json({ error: "Failed to get bank details" });
  }
}

/**
 * Create bank details
 */
export async function createBankDetails(
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

    const { employeeId } = req.params;
    const {
      paymentMethod,
      isPrimary,
      bankName,
      bankBranch,
      accountNumber,
      accountName,
      swiftCode,
      mpesaPhone,
      mpesaName,
    } = req.body;

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

    // If setting as primary, unset other primary records within transaction
    if (isPrimary) {
      await EmployeeBankDetails.update(
        { isPrimary: false },
        {
          where: {
            employeeId,
            isPrimary: true,
          },
          transaction,
        }
      );
    }

    // Create bank details within transaction
    const bankDetails = await EmployeeBankDetails.create(
      {
        employeeId,
        paymentMethod,
        isPrimary: isPrimary || false,
        bankName,
        bankBranch,
        accountNumber,
        accountName,
        swiftCode,
        mpesaPhone,
        mpesaName,
        createdBy: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({ bankDetails });
  } catch (error: any) {
    await transaction.rollback();
    logger.error("Create bank details error:", error);
    res.status(500).json({ error: "Failed to create bank details" });
  }
}

/**
 * Update bank details
 */
export async function updateBankDetails(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;
    const {
      paymentMethod,
      isPrimary,
      bankName,
      bankBranch,
      accountNumber,
      accountName,
      swiftCode,
      mpesaPhone,
      mpesaName,
    } = req.body;

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

    const bankDetails = await EmployeeBankDetails.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!bankDetails) {
      res.status(404).json({ error: "Bank details not found" });
      return;
    }

    // If setting as primary, unset other primary records
    if (isPrimary && !bankDetails.isPrimary) {
      await EmployeeBankDetails.update(
        { isPrimary: false },
        {
          where: {
            employeeId,
            isPrimary: true,
            id: { [Op.ne]: id },
          },
        }
      );
    }

    await bankDetails.update({
      paymentMethod: paymentMethod || bankDetails.paymentMethod,
      isPrimary: isPrimary !== undefined ? isPrimary : bankDetails.isPrimary,
      bankName: bankName !== undefined ? bankName : bankDetails.bankName,
      bankBranch: bankBranch !== undefined ? bankBranch : bankDetails.bankBranch,
      accountNumber: accountNumber !== undefined ? accountNumber : bankDetails.accountNumber,
      accountName: accountName !== undefined ? accountName : bankDetails.accountName,
      swiftCode: swiftCode !== undefined ? swiftCode : bankDetails.swiftCode,
      mpesaPhone: mpesaPhone !== undefined ? mpesaPhone : bankDetails.mpesaPhone,
      mpesaName: mpesaName !== undefined ? mpesaName : bankDetails.mpesaName,
      updatedBy: req.user.id,
    });

    res.json({ bankDetails });
  } catch (error: any) {
    logger.error("Update bank details error:", error);
    res.status(500).json({ error: "Failed to update bank details" });
  }
}

/**
 * Delete bank details
 */
export async function deleteBankDetails(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;

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

    const bankDetails = await EmployeeBankDetails.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!bankDetails) {
      res.status(404).json({ error: "Bank details not found" });
      return;
    }

    await bankDetails.destroy();

    res.json({ message: "Bank details deleted successfully" });
  } catch (error: any) {
    logger.error("Delete bank details error:", error);
    res.status(500).json({ error: "Failed to delete bank details" });
  }
}

/**
 * Set primary bank details
 */
export async function setPrimaryBankDetails(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;

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

    const bankDetails = await EmployeeBankDetails.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!bankDetails) {
      res.status(404).json({ error: "Bank details not found" });
      return;
    }

    // Unset other primary records
    await EmployeeBankDetails.update(
      { isPrimary: false },
      {
        where: {
          employeeId,
          isPrimary: true,
          id: { [Op.ne]: id },
        },
      }
    );

    // Set this as primary
    await bankDetails.update({
      isPrimary: true,
      updatedBy: req.user.id,
    });

    res.json({ bankDetails });
  } catch (error: any) {
    logger.error("Set primary bank details error:", error);
    res.status(500).json({ error: "Failed to set primary bank details" });
  }
}

