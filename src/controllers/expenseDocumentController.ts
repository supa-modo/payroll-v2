/**
 * Expense Document Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ExpenseDocument, Expense } from "../models";
import fs from "fs/promises";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all documents for an expense
 */
export async function getExpenseDocuments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { expenseId } = req.params;

    // Verify expense belongs to tenant
    const expense = await Expense.findOne({
      where: {
        id: expenseId,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const documents = await ExpenseDocument.findAll({
      where: {
        expenseId,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({ documents });
  } catch (error: any) {
    logger.error("Get expense documents error:", error);
    res.status(500).json({ error: "Failed to get expense documents" });
  }
}

/**
 * Upload document for expense
 */
export async function uploadExpenseDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { expenseId } = req.params;

    // Verify expense belongs to tenant
    const expense = await Expense.findOne({
      where: {
        id: expenseId,
        tenantId,
      },
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    // Only allow uploads for draft expenses or if user has permission
    if (expense.status !== "draft" && !req.user.permissions?.includes("expense:manage")) {
      res.status(400).json({ error: "Can only upload documents for draft expenses" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const document = await ExpenseDocument.create({
      expenseId,
      documentType: req.body.documentType || "receipt",
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      createdBy: req.user.id,
    });

    // Update expense hasReceipt flag
    if (!expense.hasReceipt) {
      await expense.update({
        hasReceipt: true,
      });
    }

    res.status(201).json({ document });
  } catch (error: any) {
    logger.error("Upload expense document error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
}

/**
 * Download expense document
 */
export async function downloadExpenseDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { expenseId, id } = req.params;

    const document = await ExpenseDocument.findOne({
      where: {
        id,
        expenseId,
      },
      include: [
        {
          model: Expense,
          as: "expense",
        },
      ],
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Verify tenant access
    const expense = document.get("expense") as Expense;
    if (expense.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      res.status(404).json({ error: "File not found on server" });
      return;
    }

    res.download(document.filePath, document.fileName);
  } catch (error: any) {
    logger.error("Download expense document error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
}

/**
 * Delete expense document
 */
export async function deleteExpenseDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { expenseId, id } = req.params;

    const document = await ExpenseDocument.findOne({
      where: {
        id,
        expenseId,
      },
      include: [
        {
          model: Expense,
          as: "expense",
        },
      ],
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Verify tenant access
    const expense = document.get("expense") as Expense;
    if (expense.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Only allow deletion for draft expenses
    if (expense.status !== "draft") {
      res.status(400).json({ error: "Can only delete documents for draft expenses" });
      return;
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (error: any) {
      logger.warn(`Failed to delete file ${document.filePath}:`, error);
      // Continue with database deletion even if file deletion fails
    }

    await document.destroy();

    // Check if expense still has documents
    const remainingDocs = await ExpenseDocument.count({
      where: {
        expenseId,
      },
    });

    if (remainingDocs === 0) {
      await expense.update({
        hasReceipt: false,
      });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    logger.error("Delete expense document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
}

