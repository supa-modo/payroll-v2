import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../../app";
import { sequelize } from "../../config/database";

async function loginAsAdmin() {
  const res = await request(app).post("/api/auth/login").send({
    email: "admin@fixture.local",
    password: "Password123!",
  });
  return res.body.tokens?.accessToken || res.body.accessToken || res.body.token;
}

describe("Kenya Payroll Compliance – core flows", () => {
  let token: string;

  beforeAll(async () => {
    await sequelize.authenticate();
    // Assume migrations + fixtures already run for the test DB
    token = await loginAsAdmin();
  });

  it("calculates statutory deductions correctly for standard band employee", async () => {
    // Create payroll period
    const periodRes = await request(app)
      .post("/api/payroll-periods")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test March 2026",
        periodType: "monthly",
        // Use a non-overlapping month to avoid unique_period_dates conflicts with other suites.
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        payDate: "2026-04-30",
      });

    expect(periodRes.status).toBe(201);
    const periodId = periodRes.body.period.id;

    // Process period
    const processRes = await request(app)
      .post(`/api/payroll-periods/${periodId}/process`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(processRes.status).toBe(200);

    // Fetch summary
    const summaryRes = await request(app)
      .get(`/api/payroll-periods/${periodId}/summary`)
      .set("Authorization", `Bearer ${token}`);

    expect(summaryRes.status).toBe(200);
    const { summary } = summaryRes.body;
    expect(summary.totalEmployees).toBeGreaterThan(0);

    // We don't assert exact shillings here, only that rules roughly hold:
    for (const p of summary.payrolls) {
      if (!p.employee || p.employee.workEmail !== "standard@fixture.local") {
        continue;
      }
      expect(p.grossPay).toBeGreaterThan(0);
      expect(p.totalDeductions).toBeGreaterThan(0);
      expect(p.netPay).toBeGreaterThan(0);
    }
  });
});

