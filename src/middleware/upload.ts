/**
 * File Upload Middleware
 * Handles file uploads using multer
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories
const documentsDir = path.join(uploadsDir, "documents");
const receiptsDir = path.join(uploadsDir, "receipts");
const photosDir = path.join(uploadsDir, "photos");
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, file, cb) => {
    // Determine destination based on field name or type
    if (file.fieldname === "photo" || file.fieldname === "employeePhoto") {
      cb(null, photosDir);
    } else if (file.fieldname === "document" || file.fieldname === "employeeDocument") {
      cb(null, documentsDir);
    } else if (file.fieldname === "receipt" || file.fieldname === "expenseDocument") {
      cb(null, receiptsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
    filename: (_req: Request, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Text
    "text/plain",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(", ")}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Special uploader for photos with 5MB limit
export const photoUpload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow image types for photos
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image type. Allowed types: ${allowedMimes.join(", ")}`));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for photos
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = "file") => {
  return upload.single(fieldName);
};

// Middleware for multiple files
export const uploadMultiple = (fieldName: string = "files", maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for single photo upload
export const uploadPhoto = (fieldName: string = "photo") => {
  return photoUpload.single(fieldName);
};

// Helper to get file path relative to uploads directory
export function getRelativeFilePath(absolutePath: string): string {
  const uploadsPath = path.resolve(uploadsDir);
  const filePath = path.resolve(absolutePath);
  
  if (!filePath.startsWith(uploadsPath)) {
    throw new Error("File path is outside uploads directory");
  }
  
  return path.relative(uploadsPath, filePath);
}

// Helper to get absolute file path
export function getAbsoluteFilePath(relativePath: string): string {
  return path.join(uploadsDir, relativePath);
}

// Helper to delete file
export function deleteFile(filePath: string): void {
  const absolutePath = getAbsoluteFilePath(filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

