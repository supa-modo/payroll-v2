/**
 * Report Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import {
  getMonthlyPayrollSummary,
  getDepartmentalPayrollBreakdown,
  getTaxSummary,
  getEmployeePayrollHistory,
  getPayrollTrends,
} from "../services/payrollReportService";
import {
  getExpenseByCategory,
  getExpenseByDepartment,
  getExpenseMonthlyTrends,
  getTopSpenders,
} from "../services/expenseReportService";
import { exportToCSV, exportToExcel, exportToPDF } from "../services/exportService";

/**
 * Get payroll reports
 */
export async function getPayrollReports(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { type, startDate, endDate, departmentId, employeeId } = req.query;

    if (!type || !startDate || !endDate) {
      res.status(400).json({
        error: "Missing required parameters: type, startDate, endDate",
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Validate date range (max 2 years)
    const maxRangeDays = 730;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxRangeDays) {
      res.status(400).json({ 
        error: `Date range cannot exceed ${maxRangeDays} days (approximately 2 years)` 
      });
      return;
    }

    if (daysDiff < 0) {
      res.status(400).json({ error: "Start date must be before end date" });
      return;
    }

    let result;

    switch (type) {
      case "summary":
        result = await getMonthlyPayrollSummary(
          tenantId,
          start,
          end
        );
        break;

      case "department":
        result = await getDepartmentalPayrollBreakdown(
          tenantId,
          start,
          end,
          departmentId as string | undefined
        );
        break;

      case "tax":
        result = await getTaxSummary(tenantId, start, end);
        break;

      case "history":
        if (!employeeId) {
          res.status(400).json({ error: "employeeId is required for history report" });
          return;
        }
        result = await getEmployeePayrollHistory(
          tenantId,
          employeeId as string,
          start,
          end
        );
        break;

      case "trends":
        result = await getPayrollTrends(tenantId, start, end);
        break;

      default:
        res.status(400).json({
          error: `Invalid report type. Must be one of: summary, department, tax, history, trends`,
        });
        return;
    }

    res.json({ report: result, type, startDate, endDate });
  } catch (error: any) {
    logger.error("Get payroll reports error:", error);
    res.status(500).json({ error: "Failed to generate payroll report" });
  }
}

/**
 * Get expense reports
 */
export async function getExpenseReports(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { type, startDate, endDate, categoryId, departmentId, limit } = req.query;

    if (!type || !startDate || !endDate) {
      res.status(400).json({
        error: "Missing required parameters: type, startDate, endDate",
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Validate date range (max 2 years)
    const maxRangeDays = 730;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxRangeDays) {
      res.status(400).json({ 
        error: `Date range cannot exceed ${maxRangeDays} days (approximately 2 years)` 
      });
      return;
    }

    if (daysDiff < 0) {
      res.status(400).json({ error: "Start date must be before end date" });
      return;
    }

    let result;

    switch (type) {
      case "category":
        result = await getExpenseByCategory(
          tenantId,
          start,
          end,
          categoryId as string | undefined
        );
        break;

      case "department":
        result = await getExpenseByDepartment(
          tenantId,
          start,
          end,
          departmentId as string | undefined
        );
        break;

      case "trends":
        result = await getExpenseMonthlyTrends(tenantId, start, end);
        break;

      case "top-spenders":
        result = await getTopSpenders(
          tenantId,
          start,
          end,
          limit ? Number(limit) : 10
        );
        break;

      default:
        res.status(400).json({
          error: `Invalid report type. Must be one of: category, department, trends, top-spenders`,
        });
        return;
    }

    res.json({ report: result, type, startDate, endDate });
  } catch (error: any) {
    logger.error("Get expense reports error:", error);
    res.status(500).json({ error: "Failed to generate expense report" });
  }
}

/**
 * Export report
 */
export async function exportReport(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { reportType, format, startDate, endDate, ...filters } = req.query;

    if (!reportType || !format || !startDate || !endDate) {
      res.status(400).json({
        error: "Missing required parameters: reportType, format, startDate, endDate",
      });
      return;
    }

    const validFormats = ["csv", "excel", "pdf"];
    if (!validFormats.includes(format as string)) {
      res.status(400).json({
        error: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
      });
      return;
    }

    // Get report data
    let reportData: any;
    let headers: string[] = [];
    let title = "";

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Determine report type and fetch data directly from services
    if (reportType.toString().startsWith("payroll:")) {
      const payrollType = reportType.toString().split(":")[1];
      
      // Import service functions
      const {
        getMonthlyPayrollSummary,
        getDepartmentalPayrollBreakdown,
        getTaxSummary,
        getEmployeePayrollHistory,
        getPayrollTrends,
      } = await import("../services/payrollReportService");

      switch (payrollType) {
        case "summary":
          reportData = await getMonthlyPayrollSummary(tenantId, start, end);
          headers = ["month", "employeeCount", "totalGross", "totalDeductions", "totalNet", "totalPAYE", "totalNSSF", "totalNHIF"];
          title = "Payroll Monthly Summary";
          break;
        case "department":
          reportData = await getDepartmentalPayrollBreakdown(
            tenantId,
            start,
            end,
            filters.departmentId as string | undefined
          );
          headers = ["departmentName", "employeeCount", "totalGross", "totalDeductions", "totalNet", "totalPAYE", "totalNSSF", "totalNHIF"];
          title = "Payroll Department Breakdown";
          break;
        case "tax":
          reportData = await getTaxSummary(tenantId, start, end);
          headers = ["month", "paye", "nssf", "nhif"];
          title = "Tax Summary";
          // Flatten breakdown for export
          if (reportData.breakdown) {
            reportData = reportData.breakdown;
          }
          break;
        case "history":
          if (!filters.employeeId) {
            res.status(400).json({ error: "employeeId is required for history report" });
            return;
          }
          reportData = await getEmployeePayrollHistory(
            tenantId,
            filters.employeeId as string,
            start,
            end
          );
          headers = ["periodName", "startDate", "endDate", "payDate", "grossPay", "totalDeductions", "netPay", "payeAmount", "nssfAmount", "nhifAmount", "status"];
          title = "Employee Payroll History";
          break;
        case "trends":
          reportData = await getPayrollTrends(tenantId, start, end);
          headers = ["month", "totalGross", "totalNet", "employeeCount"];
          title = "Payroll Trends";
          break;
        default:
          res.status(400).json({ error: `Invalid payroll report type: ${payrollType}` });
          return;
      }
    } else if (reportType.toString().startsWith("expense:")) {
      const expenseType = reportType.toString().split(":")[1];
      
      // Import service functions
      const {
        getExpenseByCategory,
        getExpenseByDepartment,
        getExpenseMonthlyTrends,
        getTopSpenders,
      } = await import("../services/expenseReportService");

      switch (expenseType) {
        case "category":
          reportData = await getExpenseByCategory(
            tenantId,
            start,
            end,
            filters.categoryId as string | undefined
          );
          headers = ["categoryName", "expenseCount", "totalAmount", "averageAmount", "percentage"];
          title = "Expenses by Category";
          break;
        case "department":
          reportData = await getExpenseByDepartment(
            tenantId,
            start,
            end,
            filters.departmentId as string | undefined
          );
          headers = ["departmentName", "expenseCount", "totalAmount", "averageAmount", "percentage"];
          title = "Expenses by Department";
          break;
        case "trends":
          reportData = await getExpenseMonthlyTrends(tenantId, start, end);
          headers = ["month", "totalAmount", "expenseCount", "averageAmount"];
          title = "Expense Monthly Trends";
          break;
        case "top-spenders":
          reportData = await getTopSpenders(
            tenantId,
            start,
            end,
            filters.limit ? Number(filters.limit) : 10
          );
          headers = ["employeeName", "departmentName", "expenseCount", "totalAmount", "averageAmount"];
          title = "Top Spenders";
          break;
        default:
          res.status(400).json({ error: `Invalid expense report type: ${expenseType}` });
          return;
      }
    } else {
      res.status(400).json({ error: "Invalid reportType format. Must start with 'payroll:' or 'expense:'" });
      return;
    }

    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      res.status(404).json({ error: "No data found for export" });
      return;
    }

    // Export based on format
    const filename = `${reportType}_${startDate}_to_${endDate}`;

    switch (format) {
      case "csv": {
        const csv = exportToCSV(reportData, headers);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
        res.send(csv);
        return;
      }

      case "excel": {
        const buffer = await exportToExcel(reportData, headers, title);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
        res.send(buffer);
        return;
      }

      case "pdf": {
        const buffer = await exportToPDF(reportData, headers, title, {
          companyName: tenantId, // Could fetch tenant name
          generatedAt: new Date(),
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
        res.send(buffer);
        return;
      }

      default:
        res.status(400).json({ error: "Invalid export format" });
        return;
    }
  } catch (error: any) {
    logger.error("Export report error:", error);
    res.status(500).json({ error: "Failed to export report" });
  }
}

