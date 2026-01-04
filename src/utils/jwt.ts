/**
 * JWT Utilities
 */

import jwt from "jsonwebtoken";
import { config } from "../config";

export interface JWTPayload {
  sub: string;
  tenantId: string | null;
  role: string;
  email?: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, config.jwt.secret) as { sub: string };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(user: {
  id: string;
  tenantId: string | null;
  role: string;
  email?: string;
}): { accessToken: string; refreshToken: string } {
  const accessPayload: JWTPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(user.id);

  return { accessToken, refreshToken };
}

