import puppeteer, { Browser } from "puppeteer";
import { payslipTemplate } from "./pdfTemplates/payslipTemplate";
import { reportTemplate } from "./pdfTemplates/reportTemplate";

type ReportOptions = {
  companyName?: string;
  generatedAt?: Date;
};

type PDFHtmlOptions = {
  landscape?: boolean;
  format?: "A4" | "Letter";
};

const browserSingleton: {
  promise: Promise<Browser> | null;
} = { promise: null };

async function getBrowser(): Promise<Browser> {
  if (!browserSingleton.promise) {
    browserSingleton.promise = puppeteer.launch({
      headless: true,
      // Required for most containerized / CI / Windows setups.
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserSingleton.promise;
}

export async function generatePDFFromHTML(
  html: string,
  options?: PDFHtmlOptions
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: options?.format || "A4",
      landscape: options?.landscape || false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "18mm",
        right: "14mm",
        bottom: "20mm",
        left: "14mm",
      },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width:100%; font-size:10px; color:#6B7280; padding:0 20px; display:flex; justify-content:space-between; border-top:1px solid #E5E7EB;">
          <span></span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function generatePayslipPDF(payroll: any): Promise<Buffer> {
  const period = payroll.get("payrollPeriod");
  const employee = payroll.get("employee");
  const items = (payroll.get("items") || []) as any[];

  const earnings = items.filter((i) => i.type === "earning");
  const deductions = items.filter((i) => i.type === "deduction");

  const totalEarnings = earnings.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

  const payeItem = deductions.find((d) => d.name === "PAYE") as any;
  const taxDetails = (payeItem?.calculationDetails || {}) as Record<string, any>;

  const taxableIncomeAfterNssf = payroll?.taxableIncome ?? 0;
  const personalRelief = taxDetails.personalRelief ?? payroll?.personalRelief ?? 0;
  const insuranceRelief = taxDetails.insuranceRelief ?? payroll?.insuranceRelief ?? 0;
  const grossPaye = taxDetails.grossTax ?? 0;
  const netPaye = payeItem?.amount ?? 0;

  const taxBreakdown =
    payeItem && Object.keys(taxDetails).length > 0
      ? {
          taxableIncomeAfterNssf: Number(taxableIncomeAfterNssf) || 0,
          personalRelief: Number(personalRelief) || 0,
          insuranceRelief: Number(insuranceRelief) || 0,
          grossPaye: Number(grossPaye) || 0,
          netPaye: Number(netPaye) || 0,
        }
      : null;

  const html = payslipTemplate({
    companyName: payroll?.companyName ?? "Innovasure",
    period: {
      name: period?.name ?? "",
      startDate: period?.startDate,
      endDate: period?.endDate,
      payDate: period?.payDate,
    },
    employee: {
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      employeeNumber: employee?.employeeNumber ?? "",
      jobTitle: employee?.jobTitle ?? null,
    },
    items,
    totals: {
      totalEarnings,
      totalDeductions,
      netPay: Number(payroll?.netPay ?? 0) || 0,
    },
    taxBreakdown,
    generatedOn: new Date().toLocaleString(),
  });

  return generatePDFFromHTML(html);
}

export async function generateReportPDF(
  data: any[],
  headers: string[],
  title: string,
  options?: ReportOptions
): Promise<Buffer> {
  const html = reportTemplate({
    companyName: options?.companyName ?? "Innovasure Payroll",
    title,
    generatedAt: options?.generatedAt,
    headers,
    rows: data,
  });

  return generatePDFFromHTML(html, { landscape: true });
}

