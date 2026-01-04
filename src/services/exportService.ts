/**
 * Export Service
 * Handles export of data to various formats (CSV, Excel, PDF)
 */

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import logger from "../utils/logger";

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
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        reject(new Error("No data to export"));
        return;
      }

      // Limit data size to prevent memory issues (max 10k rows for PDF)
      const maxRows = 10000;
      const exportData = data.length > maxRows ? data.slice(0, maxRows) : data;

      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      if (doc.on) {
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err: Error) => reject(err));
      }

      // Header
      doc.fontSize(20).text(title, { align: "center" });
      doc.moveDown();

      if (options?.companyName) {
        doc.fontSize(12).text(options.companyName, { align: "center" });
        doc.moveDown();
      }

      if (options?.generatedAt) {
        doc
          .fontSize(10)
          .text(
            `Generated: ${options.generatedAt.toLocaleString()}`,
            { align: "center" }
          );
        doc.moveDown(2);
      }

      // Table
      const tableTop = doc.y;
      const rowHeight = 25;
      const cellPadding = 5;
      const columnWidth = (doc.page.width - 100) / headers.length;

      // Header row
      let x = 50;
      doc.fontSize(10).font("Helvetica-Bold");
      for (const header of headers) {
        doc
          .rect(x, tableTop, columnWidth, rowHeight)
          .stroke()
          .text(header, x + cellPadding, tableTop + cellPadding, {
            width: columnWidth - cellPadding * 2,
            align: "left",
          });
        x += columnWidth;
      }

      // Data rows
      doc.font("Helvetica");
      let y = tableTop + rowHeight;
      for (const row of exportData) {
        x = 50;
        for (const header of headers) {
          const value = row[header] ?? "";
          doc
            .rect(x, y, columnWidth, rowHeight)
            .stroke()
            .text(String(value), x + cellPadding, y + cellPadding, {
              width: columnWidth - cellPadding * 2,
              align: "left",
            });
          x += columnWidth;
        }
        y += rowHeight;

        // Check if we need a new page
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
      }

      doc.end();
    } catch (error: any) {
      logger.error("Error exporting to PDF:", error);
      reject(error);
    }
  });
}

