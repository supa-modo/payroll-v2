/**
 * Payslip Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Payslip, Payroll, PayrollPeriod, Employee, PayrollItem } from "../models";
import logger from "../utils/logger";
import { generatePayslipPDF } from "../services/payslipGeneratorService";
import { requireTenantId } from "../utils/tenant";

/**
 * Get payslip
 */
export async function getPayslip(
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

    const payslip = await Payslip.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Payroll,
          as: "payroll",
          include: [
            {
              model: PayrollPeriod,
              as: "payrollPeriod",
            },
            {
              model: Employee,
              as: "employee",
            },
          ],
        },
      ],
    });

    if (!payslip) {
      res.status(404).json({ error: "Payslip not found" });
      return;
    }

    // Verify tenant access
    const payroll = payslip.get("payroll") as Payroll;
    const period = payroll.get("payrollPeriod") as PayrollPeriod;

    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ payslip });
  } catch (error: any) {
    logger.error("Get payslip error:", error);
    res.status(500).json({ error: "Failed to get payslip" });
  }
}

/**
 * Generate payslip PDF
 */
export async function generatePayslip(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { payrollId } = req.params;

    const payroll = await Payroll.findOne({
      where: {
        id: payrollId,
      },
      include: [
        {
          model: PayrollPeriod,
          as: "payrollPeriod",
        },
        {
          model: Employee,
          as: "employee",
        },
        {
          model: PayrollItem,
          as: "items",
        },
      ],
    });

    if (!payroll) {
      res.status(404).json({ error: "Payroll not found" });
      return;
    }

    // Verify tenant access
    const period = payroll.get("payrollPeriod") as PayrollPeriod;
    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Generate PDF
    const pdfBuffer = await generatePayslipPDF(payroll);

    // Create or update payslip record
    const payslipNumber = `PS-${payroll.id.substring(0, 8).toUpperCase()}`;
    const [payslip] = await Payslip.findOrCreate({
      where: {
        payrollId: payroll.id,
      },
      defaults: {
        payrollId: payroll.id,
        payslipNumber,
        filePath: `payslips/${payroll.id}.pdf`,
        generatedAt: new Date(),
        generatedBy: req.user.id,
        downloadCount: 0,
      },
    });

    if (!payslip.isNewRecord) {
      await payslip.update({
        generatedAt: new Date(),
        generatedBy: req.user.id,
      });
    }

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payslip-${payroll.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error("Generate payslip error:", error);
    res.status(500).json({ error: "Failed to generate payslip" });
  }
}

/**
 * Download payslip PDF
 */
export async function downloadPayslip(
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

    const payslip = await Payslip.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Payroll,
          as: "payroll",
          include: [
            {
              model: PayrollPeriod,
              as: "payrollPeriod",
            },
            {
              model: Employee,
              as: "employee",
            },
            {
              model: PayrollItem,
              as: "items",
            },
          ],
        },
      ],
    });

    if (!payslip) {
      res.status(404).json({ error: "Payslip not found" });
      return;
    }

    // Verify tenant access
    const payroll = payslip.get("payroll") as Payroll;
    const period = payroll.get("payrollPeriod") as PayrollPeriod;

    if (period.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Generate PDF if not already generated or regenerate
    const pdfBuffer = await generatePayslipPDF(payroll);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payslip-${payroll.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error("Download payslip error:", error);
    res.status(500).json({ error: "Failed to download payslip" });
  }
}

