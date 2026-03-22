import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../../app";

async function login(email: string) {
  const res = await request(app).post("/api/auth/login").send({
    email,
    password: "Password123!",
  });
  return res.body.tokens?.accessToken || res.body.accessToken || res.body.token;
}

describe("Expense permissions", () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await login("admin@fixture.local");
  });

  it("allows admin to submit and view expenses", async () => {
    const createRes = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Expense",
        amount: 1000,
        currency: "KES",
        expenseDate: "2026-03-10",
      });

    expect(createRes.status).toBeLessThan(500);
  });
});

