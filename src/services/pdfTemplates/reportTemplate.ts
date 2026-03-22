type ReportTemplateInput = {
  companyName?: string;
  title: string;
  generatedAt?: Date | string;
  headers: string[];
  rows: any[];
};

function escapeHtml(input: any): string {
  const str = String(input ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatGeneratedAt(d?: Date | string): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString();
}

export function reportTemplate(input: ReportTemplateInput): string {
  const generatedAtText = formatGeneratedAt(input.generatedAt);

  const rowsHtml = (input.rows || []).map((row) => {
    const cells = input.headers.map((h) => {
      const value = row?.[h];
      // Keep it simple: render primitives as-is, JSON otherwise.
      const rendered =
        value === null || value === undefined
          ? ""
          : typeof value === "number"
          ? value.toLocaleString()
          : typeof value === "string"
          ? value
          : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      return `<td>${escapeHtml(rendered)}</td>`;
    });

    return `<tr>${cells.join("")}</tr>`;
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      :root{
        --header:#1F2937;
        --border:#E5E7EB;
        --row:#F9FAFB;
        --ink:#111827;
        --muted:#6B7280;
      }
      @page { margin: 14mm 12mm 14mm 12mm; }
      body{
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", Helvetica;
        color: var(--ink);
        margin:0;
        padding:0;
      }
      .top{
        background: linear-gradient(90deg, var(--header), #111827);
        color:#fff;
        padding: 12px 16px;
        border-radius: 12px;
      }
      .top h1{
        margin:0;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0.3px;
      }
      .top .meta{
        margin-top: 4px;
        font-size: 12px;
        opacity: 0.95;
        display:flex;
        justify-content:space-between;
        gap: 12px;
        flex-wrap:wrap;
      }
      .wrap{
        padding: 14px 2px 0 2px;
      }
      table{
        width: 100%;
        margin-top: 12px;
        border-collapse: collapse;
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow:hidden;
      }
      thead th{
        background: var(--header);
        color:#fff;
        font-weight: 900;
        font-size: 12px;
        text-align: left;
        padding: 10px 12px;
        border-right: 1px solid rgba(255,255,255,0.12);
        white-space: nowrap;
      }
      thead th:last-child{ border-right:none; }
      thead { display: table-header-group; }
      tbody td{
        padding: 10px 12px;
        font-size: 12px;
        border-top: 1px solid var(--border);
        vertical-align: top;
      }
      tbody tr:nth-child(even) td{ background: var(--row); }
      tbody tr:nth-child(odd) td{ background: #fff; }
      .footerNote{
        margin-top: 10px;
        color: var(--muted);
        font-size: 11px;
        display:flex;
        justify-content:space-between;
        gap: 10px;
      }
    </style>
  </head>
  <body>
    <div class="top">
      <h1>${escapeHtml(input.title)}</h1>
      <div class="meta">
        <div>${escapeHtml(input.companyName ?? "Innovasure Payroll")}</div>
        <div>${generatedAtText ? `Generated: ${escapeHtml(generatedAtText)}` : ""}</div>
      </div>
    </div>
    <div class="wrap">
      <table>
        <thead>
          <tr>
            ${input.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length ? rowsHtml.join("") : `<tr><td colspan="${input.headers.length}" style="text-align:center; color: var(--muted);">No data</td></tr>`}
        </tbody>
      </table>
      <div class="footerNote">
        <div>Confidential: generated automatically.</div>
        <div></div>
      </div>
    </div>
  </body>
</html>`;
}

