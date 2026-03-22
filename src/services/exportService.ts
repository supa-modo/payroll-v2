/**
 * Export Service
 * Handles export of data to various formats (CSV, Excel, PDF)
 */

import ExcelJS from "exceljs";
import logger from "../utils/logger";
import { generateReportPDF } from "./puppeteerPDFService";

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], headers: string[]): string {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No data to export");
    }

    const csvRows: string[] = [];

    // Add headers
    csvRows.push(headers.map((h) => `"${h}"`).join(","));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header] ?? "";
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  } catch (error: any) {
    logger.error("Error exporting to CSV:", error);
    throw error;
  }
}

/**
 * Export data to Excel format
 */
export async function exportToExcel(
  data: any[],
  headers: string[],
  sheetName: string = "Report"
): Promise<Buffer> {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No data to export");
    }

    // Limit data size to prevent memory issues (max 100k rows)
    const maxRows = 100000;
    const exportData = data.length > maxRows ? data.slice(0, maxRows) : data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Define columns
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 15,
    }));

    // Add data rows
    worksheet.addRows(exportData);

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.header && column.eachCell) {
        let maxLength = column.header.length;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellLength = cell.value ? String(cell.value).length : 10;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error: any) {
    logger.error("Error exporting to Excel:", error);
    throw error;
  }
}

/**
 * Export data to PDF format
 */
export async function exportToPDF(
  data: any[],
  headers: string[],
  title: string = "Report",
  options?: {
    companyName?: string;
    generatedAt?: Date;
  }
): Promise<Buffer> {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No data to export");
    }

    // Limit data size to prevent memory issues (max 10k rows for PDF)
    const maxRows = 10000;
    const exportData = data.length > maxRows ? data.slice(0, maxRows) : data;

    return await generateReportPDF(exportData, headers, title, {
      companyName: options?.companyName,
      generatedAt: options?.generatedAt,
    });
  } catch (error: any) {
    logger.error("Error exporting to PDF:", error);
    throw error;
  }
}

