/**
 * Employee Document Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Employee, EmployeeDocument } from "../models";
import { getRelativeFilePath, getAbsoluteFilePath, deleteFile } from "../middleware/upload";
import fs from "fs";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all documents for employee
 */
export async function getDocuments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId } = req.params;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const documents = await EmployeeDocument.findAll({
      where: {
        employeeId,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({ documents });
  } catch (error: any) {
    logger.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to get documents" });
  }
}

/**
 * Upload document
 */
export async function uploadDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId } = req.params;
    const { documentType, documentName, expiryDate } = req.body;

    if (!req.file) {
      res.status(400).json({ error: "File is required" });
      return;
    }

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      // Delete uploaded file if employee not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const relativePath = getRelativeFilePath(req.file.path);

    const document = await EmployeeDocument.create({
      employeeId,
      documentType: documentType || "other",
      documentName: documentName || req.file.originalname,
      filePath: relativePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      expiryDate: expiryDate || null,
      isVerified: false,
      createdBy: req.user.id,
    });

    res.status(201).json({ document });
  } catch (error: any) {
    logger.error("Upload document error:", error);
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to upload document" });
  }
}

/**
 * Get document details
 */
export async function getDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const document = await EmployeeDocument.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    res.json({ document });
  } catch (error: any) {
    logger.error("Get document error:", error);
    res.status(500).json({ error: "Failed to get document" });
  }
}

/**
 * Download document file
 */
export async function downloadDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const document = await EmployeeDocument.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const absolutePath = getAbsoluteFilePath(document.filePath);

    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: "File not found on server" });
      return;
    }

    res.download(absolutePath, document.documentName, (err) => {
      if (err) {
        logger.error("Download document error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to download document" });
        }
      }
    });
  } catch (error: any) {
    logger.error("Download document error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;
    const { documentType, documentName, expiryDate } = req.body;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const document = await EmployeeDocument.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    await document.update({
      documentType: documentType || document.documentType,
      documentName: documentName || document.documentName,
      expiryDate: expiryDate !== undefined ? expiryDate : document.expiryDate,
    });

    res.json({ document });
  } catch (error: any) {
    logger.error("Update document error:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
}

/**
 * Delete document (soft delete)
 */
export async function deleteDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const document = await EmployeeDocument.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Delete file from filesystem
    try {
      deleteFile(document.filePath);
    } catch (error) {
      logger.warn("Failed to delete file from filesystem:", error);
    }

    // Soft delete document
    await document.destroy();

    res.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    logger.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
}

/**
 * Verify document
 */
export async function verifyDocument(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { employeeId, id } = req.params;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const document = await EmployeeDocument.findOne({
      where: {
        id,
        employeeId,
      },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    await document.update({
      isVerified: true,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    });

    res.json({ document });
  } catch (error: any) {
    logger.error("Verify document error:", error);
    res.status(500).json({ error: "Failed to verify document" });
  }
}

