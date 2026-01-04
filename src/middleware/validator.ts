/**
 * Request Validation Middleware
 */

import { Request, Response, NextFunction } from "express";
import { body as expressBody, validationResult } from "express-validator";

// Re-export body for convenience
export const body = expressBody;

/**
 * Handle validation errors
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const errorMessages = errorArray.map((err: any) => err.msg || err.param || "Validation error");
    res.status(400).json({ 
      error: errorMessages[0] || "Validation failed",
      errors: errorArray 
    });
    return;
  }
  next();
}

