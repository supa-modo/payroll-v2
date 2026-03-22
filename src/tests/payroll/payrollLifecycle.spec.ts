import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../../app";

async function loginAsAdmin() {
  const res = await request(app).post("/api/auth/login").send({
    email: "admin@fixture.local",
    password: "Password123!",
  });
  return res.body.tokens?.accessToken || res.body.accessToken || res.body.token;
}

describe("Payroll period lifecycle", () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAsAdmin();
  });

  it("prevents overlapping periods and walks through statuses", async () => {
    const create = await request(app)
      .post("/api/payroll-periods")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Lifecycle March 2026",
        periodType: "monthly",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        payDate: "2026-03-31",
      });

    expect(create.status).toBe(201);
    const periodId = create.body.period.id;

    const overlap = await request(app)
      .post("/api/payroll-periods")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Overlap March 2026",
        periodType: "monthly",
        startDate: "2026-03-15",
        endDate: "2026-04-15",
        payDate: "2026-04-15",
      });

    expect(overlap.status).toBe(400);

    const process = await request(app)
      .post(`/api/payroll-periods/${periodId}/process`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(process.status).toBe(200);

    const approve = await request(app)
      .post(`/api/payroll-periods/${periodId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(approve.status).toBe(200);

    const lock = await request(app)
      .post(`/api/payroll-periods/${periodId}/lock`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(lock.status).toBe(200);
  });
});

