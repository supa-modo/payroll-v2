import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../../app";
import { Department, Employee, Role, User, UserRole } from "../../models";

async function login(email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.tokens?.accessToken || res.body.accessToken || res.body.token;
}

describe("Employee email update controls and sync", () => {
  let adminToken = "";
  let hrToken = "";
  let tenantId = "";
  let employeeRoleId = "";
  let employeeId = "";
  let linkedUserId = "";

  beforeAll(async () => {
    adminToken = await login("admin@fixture.local", "Password123!");

    const adminUser = await User.findOne({
      where: { email: "admin@fixture.local" },
    });
    if (!adminUser?.tenantId) {
      throw new Error("Admin fixture user or tenant not found");
    }
    tenantId = adminUser.tenantId;

    const employeeRole = await Role.findOne({
      where: { name: "employee", tenantId: null },
    });
    const hrRole = await Role.findOne({
      where: { name: "hr_officer", tenantId: null },
    });
    if (!employeeRole || !hrRole) {
      throw new Error("Required system roles missing");
    }
    employeeRoleId = employeeRole.id;

    const department =
      (await Department.findOne({ where: { tenantId } })) ||
      (await Department.create({
        tenantId,
        name: "Test HR Department",
        code: "THRD",
        isActive: true,
      } as any));

    const hrEmail = `hr-editor-${Date.now()}@fixture.local`;
    const hrPassword = "Password123!";
    const hrUser = await User.create({
      tenantId,
      email: hrEmail,
      password: hrPassword,
      firstName: "HR",
      lastName: "Editor",
      role: "hr_officer",
      isActive: true,
      isEmailVerified: true,
      isSystemAdmin: false,
    });

    await UserRole.create({
      userId: hrUser.id,
      roleId: hrRole.id,
      departmentId: department.id,
      assignedBy: adminUser.id,
    });

    hrToken = await login(hrEmail, hrPassword);

    const createRes = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Email",
        lastName: "Sync",
        employeeNumber: `EMAIL-SYNC-${Date.now()}`,
        employmentType: "permanent",
        jobTitle: "Analyst",
        hireDate: "2026-03-01",
        workEmail: `email.sync-${Date.now()}@fixture.local`,
        userPassword: "Password123!",
        roleId: employeeRoleId,
      });

    expect(createRes.status).toBe(201);
    employeeId = createRes.body.employee.id;
    linkedUserId = createRes.body.user.id;
  });

  it("allows admin to update workEmail and syncs linked user email", async () => {
    const updatedEmail = `email.sync.updated-${Date.now()}@fixture.local`;
    const updatedFirstName = `EmailUpdated-${Date.now()}`;
    const updatedLastName = `SyncUpdated-${Date.now()}`;

    const updateRes = await request(app)
      .put(`/api/employees/${employeeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: updatedFirstName,
        lastName: updatedLastName,
        workEmail: updatedEmail,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.employee.firstName).toBe(updatedFirstName);
    expect(updateRes.body.employee.lastName).toBe(updatedLastName);
    expect(updateRes.body.employee.workEmail).toBe(updatedEmail);

    const linkedUser = await User.findByPk(linkedUserId);
    expect(linkedUser?.firstName).toBe(updatedFirstName);
    expect(linkedUser?.lastName).toBe(updatedLastName);
    expect(linkedUser?.email).toBe(updatedEmail);
  });

  it("blocks non-admin email updates but allows non-email edits", async () => {
    const blockedRes = await request(app)
      .put(`/api/employees/${employeeId}`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        workEmail: `blocked-${Date.now()}@fixture.local`,
      });

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error).toContain("Only admins");

    const allowedRes = await request(app)
      .put(`/api/employees/${employeeId}`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        jobTitle: "Senior Analyst",
      });

    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.employee.jobTitle).toBe("Senior Analyst");
  });
});

