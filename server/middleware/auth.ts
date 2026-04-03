import type { NextFunction, Request, Response } from "express";
import { authCookieName, verifyAuthToken } from "../services/auth.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; role: "user" | "admin" };
}

export const attachUser = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;
  const token = req.cookies?.[authCookieName] || bearer;
  if (!token) return next();
  try {
    req.user = verifyAuthToken(token);
  } catch {
    req.user = undefined;
  }
  next();
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required." });
  next();
};

export const requireRole = (role: "admin") => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required." });
  if (req.user.role !== role) return res.status(403).json({ message: "Insufficient permissions." });
  next();
};
