type PayslipTemplateInput = {
  companyName?: string;
  period: {
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    payDate: string | Date;
  };
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    jobTitle?: string | null;
  };
  items: Array<{
    id?: string;
    name: string;
    type: string;
    amount: number | string;
    // For PAYE breakdown, this might exist on some payroll items
    calculationDetails?: Record<string, any>;
  }>;
  totals: {
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  taxBreakdown?: {
    taxableIncomeAfterNssf: number;
    personalRelief: number;
    insuranceRelief: number;
    grossPaye: number;
    netPaye: number;
  } | null;
  generatedOn: string;
};

function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString();
}

export function payslipTemplate(input: PayslipTemplateInput): string {
  const earnings = input.items.filter((i) => i.type === "earning").map((i) => ({ ...i, amount: Number(i.amount) }));
  const deductions = input.items
    .filter((i) => i.type === "deduction")
    .map((i) => ({ ...i, amount: Number(i.amount) }));
  const employerContrib = input.items
    .filter((i) => i.type === "employer_contrib" && Number(i.amount) > 0)
    .map((i) => ({ ...i, amount: Number(i.amount) }));

  const tax = input.taxBreakdown ?? null;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Payslip</title>
    <style>
      :root{
        --brand:#1E40AF;
        --ink:#111827;
        --muted:#6B7280;
        --header:#1F2937;
        --border:#E5E7EB;
        --row:#F9FAFB;
        --white:#FFFFFF;
        --green:#059669;
        --red:#DC2626;
      }
      @page { margin: 18mm 14mm 18mm 14mm; }
      html,body{ height:100%; }
      body{
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", Helvetica;
        color: var(--ink);
        margin:0;
        padding:0;
        background: #fff;
      }
      .topbar{
        background: linear-gradient(90deg, var(--header), #111827);
        color:#fff;
        padding: 14px 18px;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px 14px 0 0;
      }
      .topbar .brandRow{ display:flex; align-items:center; justify-content:space-between; gap: 12px; }
      .logo{
        width:36px; height:36px; border-radius:12px;
        background: rgba(255,255,255,0.14);
        display:flex; align-items:center; justify-content:center;
        font-weight:800;
        letter-spacing:0.5px;
      }
      .title{
        font-size: 22px;
        font-weight: 800;
        letter-spacing: 0.4px;
      }
      .subtitle{
        font-size: 12px;
        opacity: 0.9;
        margin-top: 3px;
      }
      .content{
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 14px 14px;
        padding: 18px;
      }
      .grid2{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-top: 6px;
      }
      .card{
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px;
        background: #fff;
      }
      .card h3{
        margin:0 0 10px 0;
        font-size: 13px;
        letter-spacing:0.2px;
        color: var(--muted);
        font-weight: 700;
        text-transform: uppercase;
      }
      .kv{
        display:flex; justify-content:space-between; gap: 10px;
        font-size: 13px;
        padding: 6px 0;
        border-bottom: 1px dashed #F3F4F6;
      }
      .kv:last-child{ border-bottom:none; padding-bottom:0; }
      .k{ color: var(--muted); }
      .v{ font-weight: 650; }
      .section{
        margin-top: 16px;
      }
      .section h2{
        margin:0 0 10px 0;
        font-size: 15px;
        font-weight: 800;
        color: var(--header);
        letter-spacing:0.2px;
      }
      table{
        width:100%;
        border-collapse: collapse;
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow:hidden;
      }
      thead th{
        background: var(--header);
        color:#fff;
        font-size: 12px;
        font-weight: 800;
        padding: 10px 12px;
        border-right: 1px solid rgba(255,255,255,0.1);
        text-align:left;
      }
      thead th:last-child{ border-right:none; text-align:right; }
      tbody td{
        padding: 10px 12px;
        font-size: 13px;
        border-top: 1px solid var(--border);
      }
      tbody tr:nth-child(even) td{ background: var(--row); }
      tbody tr:nth-child(odd) td{ background: var(--white); }
      tbody td.num{ text-align:right; font-variant-numeric: tabular-nums; }

      .totals{
        display:flex;
        justify-content:flex-end;
        margin-top: 10px;
      }
      .pill{
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px 14px;
        min-width: 240px;
        background: #fff;
      }
      .pill .label{ color: var(--muted); font-weight: 700; font-size: 12px; text-transform: uppercase;}
      .pill .value{ margin-top: 4px; font-size: 16px; font-weight: 900; text-align:right; font-variant-numeric: tabular-nums;}
      .netbar{
        margin-top: 16px;
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(30,64,175,0.08), rgba(30,64,175,0.02));
        border: 1px solid rgba(30,64,175,0.22);
        padding: 16px 14px;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap: 10px;
      }
      .netbar .label{ color: var(--muted); font-weight: 750; text-transform: uppercase; font-size: 12px;}
      .netbar .value{ color: var(--brand); font-weight: 900; font-size: 22px; letter-spacing: 0.2px; font-variant-numeric: tabular-nums; }

      .smallFooter{
        margin-top: 12px;
        color: var(--muted);
        font-size: 11px;
        display:flex;
        justify-content:space-between;
        gap: 10px;
      }

      .taxGrid{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 10px;
      }
      .stat{
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px;
        background:#fff;
      }
      .stat .k{ font-size: 12px; color: var(--muted); font-weight: 750; text-transform: uppercase; }
      .stat .v{ margin-top: 6px; font-size: 15px; font-weight: 900; text-align:right; font-variant-numeric: tabular-nums; }
    </style>
  </head>
  <body>
    <div class="topbar">
      <div class="brandRow">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="logo">${escapeHtml(input.companyName ? input.companyName.slice(0,2).toUpperCase() : "IN")}</div>
          <div>
            <div class="title">PAYSLIP</div>
            <div class="subtitle">${escapeHtml(input.companyName ?? "Innovasure Payroll")}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; font-size:13px;">${escapeHtml(input.period.name)}</div>
          <div class="subtitle">${escapeHtml(formatDate(input.period.startDate))} - ${escapeHtml(formatDate(input.period.endDate))}</div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="grid2">
        <div class="card">
          <h3>Employee Information</h3>
          <div class="kv"><div class="k">Name</div><div class="v">${escapeHtml(input.employee.firstName)} ${escapeHtml(input.employee.lastName)}</div></div>
          <div class="kv"><div class="k">Employee No.</div><div class="v">${escapeHtml(input.employee.employeeNumber)}</div></div>
          ${
            input.employee.jobTitle
              ? `<div class="kv"><div class="k">Position</div><div class="v">${escapeHtml(input.employee.jobTitle ?? "")}</div></div>`
              : ""
          }
        </div>
        <div class="card">
          <h3>Payment Details</h3>
          <div class="kv"><div class="k">Pay Date</div><div class="v">${escapeHtml(formatDate(input.period.payDate))}</div></div>
          <div class="kv"><div class="k">Generated</div><div class="v">${escapeHtml(input.generatedOn)}</div></div>
        </div>
      </div>

      <div class="section">
        <h2>Earnings</h2>
        <table>
          <thead>
            <tr>
              <th style="width:70%;">Description</th>
              <th style="width:30%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              earnings.length
                ? earnings
                    .map(
                      (e) =>
                        `<tr><td>${escapeHtml(e.name)}</td><td class="num">${escapeHtml(formatKES(Number(e.amount)))}</td></tr>`
                    )
                    .join("")
                : `<tr><td colspan="2" style="color:#6B7280; text-align:center;">No earnings</td></tr>`
            }
          </tbody>
        </table>
        <div class="totals">
          <div class="pill">
            <div class="label">Total Earnings</div>
            <div class="value">${escapeHtml(formatKES(input.totals.totalEarnings))}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Deductions</h2>
        <table>
          <thead>
            <tr>
              <th style="width:70%;">Description</th>
              <th style="width:30%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              deductions.length
                ? deductions
                    .map(
                      (d) =>
                        `<tr><td>${escapeHtml(d.name)}</td><td class="num">${escapeHtml(formatKES(Number(d.amount)))}</td></tr>`
                    )
                    .join("")
                : `<tr><td colspan="2" style="color:#6B7280; text-align:center;">No deductions</td></tr>`
            }
          </tbody>
        </table>
        <div class="totals">
          <div class="pill">
            <div class="label">Total Deductions</div>
            <div class="value">${escapeHtml(formatKES(input.totals.totalDeductions))}</div>
          </div>
        </div>
      </div>

      ${
        employerContrib.length
          ? `<div class="section">
        <h2>Employer Contributions</h2>
        <table>
          <thead>
            <tr>
              <th style="width:70%;">Description</th>
              <th style="width:30%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${employerContrib
              .map(
                (e) =>
                  `<tr><td>${escapeHtml(e.name)}</td><td class="num">${escapeHtml(formatKES(Number(e.amount)))}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
          : ""
      }

      ${
        tax
          ? `<div class="section">
            <h2>Tax Calculation Breakdown</h2>
            <div class="taxGrid">
              <div class="stat"><div class="k">Taxable Income (after NSSF)</div><div class="v">${escapeHtml(formatKES(tax.taxableIncomeAfterNssf))}</div></div>
              <div class="stat"><div class="k">Personal Relief</div><div class="v">${escapeHtml(formatKES(tax.personalRelief))}</div></div>
              <div class="stat"><div class="k">Insurance Relief</div><div class="v">${escapeHtml(formatKES(tax.insuranceRelief))}</div></div>
              <div class="stat"><div class="k">Gross PAYE (before relief)</div><div class="v">${escapeHtml(formatKES(tax.grossPaye))}</div></div>
              <div class="stat" style="grid-column: 1 / -1;"><div class="k">Net PAYE (after relief)</div><div class="v">${escapeHtml(formatKES(tax.netPaye))}</div></div>
            </div>
          </div>`
          : ""
      }

      <div class="netbar">
        <div>
          <div class="label">Net Pay</div>
          <div style="font-weight:800; margin-top:2px; color: #111827;">${escapeHtml(input.companyName ?? "Innovasure")} Member</div>
        </div>
        <div class="value">${escapeHtml(formatKES(input.totals.netPay))}</div>
      </div>

      <div class="smallFooter">
        <div>Confidential: generated automatically.</div>
        <div>${escapeHtml(input.generatedOn)}</div>
      </div>
    </div>

    <script>
      // Puppeteer print: keep deterministic output.
    </script>
  </body>
</html>
`;
}

function escapeHtml(input: any): string {
  const str = String(input ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

