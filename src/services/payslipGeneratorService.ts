/**
 * Payslip Generator Service
 * Generates PDF payslips using Puppeteer (HTML-to-PDF).
 */

import { Payroll } from "../models";
import { generatePayslipPDF as generatePayslipPDFWithPuppeteer } from "./puppeteerPDFService";

/**
 * Generate payslip PDF
 */
export async function generatePayslipPDF(payroll: Payroll): Promise<Buffer> {
  return generatePayslipPDFWithPuppeteer(payroll);
}

