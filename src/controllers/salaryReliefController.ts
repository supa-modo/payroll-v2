import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Employee, EmployeeSalaryRelief, SalaryRelief } from "../models";
import { requireTenantId } from "../utils/tenant";
import logger from "../utils/logger";
import { Op } from "sequelize";

export async function getSalaryReliefs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split("T")[0];
    const whereClause: any = {
      tenantId,
      isActive: true,
      effectiveFrom: { [Op.lte]: asOfDate },
      [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: asOfDate } }],
    };
    if (req.query.reliefType) {
      whereClause.reliefType = req.query.reliefType;
    }
    const reliefs = await SalaryRelief.findAll({ where: whereClause, order: [["name", "ASC"]] });
    res.json({ reliefs });
  } catch (error: any) {
    logger.error("Get salary reliefs error:", error);
    res.status(500).json({ error: "Failed to fetch salary reliefs" });
  }
}

export async function createSalaryRelief(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);
    const payload = req.body || {};
    const relief = await SalaryRelief.create({
      tenantId,
      name: payload.name,
      code: payload.code,
      reliefType: payload.reliefType,
      calculationType: payload.calculationType || "fixed",
      amount: payload.amount ?? null,
      percentageValue: payload.percentageValue ?? null,
      maxAmount: payload.maxAmount ?? null,
      minAmount: payload.minAmount ?? null,
      isMandatory: payload.isMandatory === true,
      isActive: payload.isActive !== false,
      country: payload.country || "Kenya",
      effectiveFrom: payload.effectiveFrom || new Date().toISOString().split("T")[0],
      effectiveTo: payload.effectiveTo || null,
      config: payload.config || null,
    });
    res.status(201).json({ relief });
  } catch (error: any) {
    logger.error("Create salary relief error:", error);
    res.status(500).json({ error: "Failed to create salary relief" });
  }
}

export async function updateSalaryRelief(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const { id } = req.params;
    const relief = await SalaryRelief.findOne({ where: { id, tenantId } });
    if (!relief) {
      res.status(404).json({ error: "Relief not found" });
      return;
    }
    await relief.update({
      name: req.body.name ?? relief.name,
      code: req.body.code ?? relief.code,
      reliefType: req.body.reliefType ?? relief.reliefType,
      calculationType: req.body.calculationType ?? relief.calculationType,
      amount: req.body.amount ?? relief.amount,
      percentageValue: req.body.percentageValue ?? relief.percentageValue,
      maxAmount: req.body.maxAmount ?? relief.maxAmount,
      minAmount: req.body.minAmount ?? relief.minAmount,
      isMandatory: req.body.isMandatory ?? relief.isMandatory,
      isActive: req.body.isActive ?? relief.isActive,
      country: req.body.country ?? relief.country,
      effectiveFrom: req.body.effectiveFrom ?? relief.effectiveFrom,
      effectiveTo: req.body.effectiveTo ?? relief.effectiveTo,
      config: req.body.config ?? relief.config,
    });
    res.json({ relief });
  } catch (error: any) {
    logger.error("Update salary relief error:", error);
    res.status(500).json({ error: "Failed to update salary relief" });
  }
}

export async function deleteSalaryRelief(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const { id } = req.params;
    const relief = await SalaryRelief.findOne({ where: { id, tenantId } });
    if (!relief) {
      res.status(404).json({ error: "Relief not found" });
      return;
    }
    await relief.update({ isActive: false });
    res.json({ message: "Relief deleted successfully" });
  } catch (error: any) {
    logger.error("Delete salary relief error:", error);
    res.status(500).json({ error: "Failed to delete salary relief" });
  }
}

export async function assignEmployeeReliefs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const { employeeId } = req.params;
    const { reliefs, effectiveFrom } = req.body as {
      reliefs: Array<{ salaryReliefId: string; amount?: number }>;
      effectiveFrom?: string;
    };
    const employee = await Employee.findOne({ where: { id: employeeId, tenantId } });
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    const effectiveDate = effectiveFrom || new Date().toISOString().split("T")[0];
    const assignments = await Promise.all(
      (reliefs || []).map((relief) =>
        EmployeeSalaryRelief.create({
          employeeId,
          salaryReliefId: relief.salaryReliefId,
          amount: relief.amount ?? null,
          effectiveFrom: new Date(effectiveDate),
        })
      )
    );
    res.status(201).json({ assignments });
  } catch (error: any) {
    logger.error("Assign employee reliefs error:", error);
    res.status(500).json({ error: "Failed to assign employee reliefs" });
  }
}
