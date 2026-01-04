/**
 * Payslip Generator Service
 * Generates PDF payslips using PDFKit
 */

import PDFDocument from "pdfkit";
import { Payroll, PayrollPeriod, Employee, PayrollItem } from "../models";
import logger from "../utils/logger";

/**
 * Generate payslip PDF
 */
export async function generatePayslipPDF(payroll: Payroll): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const period = payroll.get("payrollPeriod") as PayrollPeriod;
      const employee = payroll.get("employee") as Employee;
      const items = (payroll.get("items") as PayrollItem[]) || [];

      // Header
      doc.fontSize(20).text("PAYSLIP", { align: "center" });
      doc.moveDown();

      // Company/Employee Info
      doc.fontSize(12);
      doc.text(`Employee: ${employee.firstName} ${employee.lastName}`, { continued: false });
      doc.text(`Employee Number: ${employee.employeeNumber}`, { continued: false });
      doc.text(`Period: ${period.name}`, { continued: false });
      doc.text(
        `Date: ${new Date(period.startDate).toLocaleDateString()} - ${new Date(period.endDate).toLocaleDateString()}`,
        { continued: false }
      );
      doc.text(`Pay Date: ${new Date(period.payDate).toLocaleDateString()}`, { continued: false });
      doc.moveDown();

      // Earnings Section
      doc.fontSize(14).text("EARNINGS", { underline: true });
      doc.moveDown(0.5);

      const earnings = items.filter((item) => item.type === "earning");
      let totalEarnings = 0;

      if (earnings.length > 0) {
        doc.fontSize(10);
        earnings.forEach((item) => {
          const amount = parseFloat(item.amount.toString());
          totalEarnings += amount;
          doc.text(`${item.name}: ${formatCurrency(amount)}`, {
            indent: 20,
          });
        });
      } else {
        doc.fontSize(10).text("No earnings", { indent: 20 });
      }

      doc.moveDown();
      doc.fontSize(12).text(`Total Earnings: ${formatCurrency(totalEarnings)}`, {
        align: "right",
      });
      doc.moveDown();

      // Deductions Section
      doc.fontSize(14).text("DEDUCTIONS", { underline: true });
      doc.moveDown(0.5);

      const deductions = items.filter((item) => item.type === "deduction");
      let totalDeductions = 0;

      if (deductions.length > 0) {
        doc.fontSize(10);
        deductions.forEach((item) => {
          const amount = parseFloat(item.amount.toString());
          totalDeductions += amount;
          doc.text(`${item.name}: ${formatCurrency(amount)}`, {
            indent: 20,
          });
        });
      } else {
        doc.fontSize(10).text("No deductions", { indent: 20 });
      }

      // Statutory Deductions
      if (payroll.payeAmount > 0) {
        doc.fontSize(10).text(`PAYE: ${formatCurrency(payroll.payeAmount)}`, {
          indent: 20,
        });
        totalDeductions += parseFloat(payroll.payeAmount.toString());
      }
      if (payroll.nssfAmount > 0) {
        doc.fontSize(10).text(`NSSF: ${formatCurrency(payroll.nssfAmount)}`, {
          indent: 20,
        });
        totalDeductions += parseFloat(payroll.nssfAmount.toString());
      }
      if (payroll.nhifAmount > 0) {
        doc.fontSize(10).text(`NHIF: ${formatCurrency(payroll.nhifAmount)}`, {
          indent: 20,
        });
        totalDeductions += parseFloat(payroll.nhifAmount.toString());
      }

      doc.moveDown();
      doc.fontSize(12).text(`Total Deductions: ${formatCurrency(totalDeductions)}`, {
        align: "right",
      });
      doc.moveDown();

      // Net Pay
      doc.fontSize(16).text(`NET PAY: ${formatCurrency(payroll.netPay)}`, {
        align: "right",
        underline: true,
      });
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).text("This is a computer-generated document.", {
        align: "center",
      });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "center",
      });

      doc.end();
    } catch (error: any) {
      logger.error("Error generating payslip PDF:", error);
      reject(error);
    }
  });
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
}

