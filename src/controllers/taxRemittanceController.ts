/**
 * Tax Remittance Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import {
  getPendingRemittances,
  getRemittanceHistory,
  markAsRemitted,
  calculateRemittanceTotals,
} from "../services/taxRemittanceService";

/**
 * Get remittances with filters
 */
export async function getRemittances(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { status, taxType, startDate, endDate, includeOverdue } = req.query;

    let remittances;

    if (status === "pending") {
      remittances = await getPendingRemittances(
        tenantId,
        includeOverdue === "true"
      );
    } else {
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      remittances = await getRemittanceHistory(
        tenantId,
        start,
        end,
        taxType as "PAYE" | "NSSF" | "NHIF" | undefined
      );
    }

    // Filter by status if provided
    if (status && status !== "pending") {
      remittances = remittances.filter((r) => r.status === status);
    }

    res.json({ remittances });
  } catch (error: any) {
    logger.error("Get remittances error:", error);
    res.status(500).json({ error: "Failed to get remittances" });
  }
}

/**
 * Mark remittance as remitted
 */
export async function markRemittanceAsRemitted(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const { remittanceReference, notes } = req.body;

    if (!remittanceReference) {
      res.status(400).json({ error: "remittanceReference is required" });
      return;
    }

    const remittance = await markAsRemitted(
      id,
      req.user.id,
      remittanceReference,
      notes
    );

    res.json({ remittance, message: "Remittance marked as remitted" });
  } catch (error: any) {
    logger.error("Mark remittance as remitted error:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("already")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to mark remittance as remitted" });
    }
  }
}

/**
 * Get remittance report
 */
export async function getRemittanceReport(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        error: "Missing required parameters: startDate, endDate",
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    const history = await getRemittanceHistory(tenantId, start, end);
    const totals = await calculateRemittanceTotals(tenantId, start, end);
    const pending = await getPendingRemittances(tenantId, true);

    res.json({
      report: {
        period: {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        },
        totals,
        history,
        pending: pending.filter((p) => {
          const dueDate = new Date(p.dueDate);
          return dueDate >= start && dueDate <= end;
        }),
      },
    });
  } catch (error: any) {
    logger.error("Get remittance report error:", error);
    res.status(500).json({ error: "Failed to generate remittance report" });
  }
}
