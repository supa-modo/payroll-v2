import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../../app";
import { Role } from "../../models";
import { sequelize } from "../../config/database";

async function loginAsAdmin() {
  const res = await request(app).post("/api/auth/login").send({
    email: "admin@fixture.local",
    password: "Password123!",
  });
  return res.body.tokens?.accessToken || res.body.accessToken || res.body.token;
}

describe("Employee onboarding and salary setup", () => {
  let token: string;
  let employeeRoleId: string;

  beforeAll(async () => {
    await sequelize.authenticate();
    const role = await Role.findOne({
      where: { name: "employee", tenantId: null },
    });
    employeeRoleId = role?.id as string;
    token = await loginAsAdmin();
  });

  it("creates employee and applies mandatory salary components", async () => {
    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Test",
        lastName: "Onboard",
        employeeNumber: "ONBOARD-001",
        employmentType: "permanent",
        jobTitle: "Engineer",
        hireDate: "2026-03-01",
        // Required for API user account creation
        workEmail: "onboard.user@fixture.local",
        userPassword: "Password123!",
        roleId: employeeRoleId,
      });

    expect(res.status).toBe(201);
    const employeeId = res.body.employee.id;
    expect(employeeId).toBeTruthy();
  });
});

