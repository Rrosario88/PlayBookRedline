import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const CSRF_COOKIE = "playbookredline_csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const cookieOptions = (req: Request) => ({
  httpOnly: false,
  sameSite: "strict" as const,
  secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const issueCsrfToken = (req: Request, res: Response) => {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie(CSRF_COOKIE, token, cookieOptions(req));
  res.locals.csrfToken = token;
  return token;
};

export const ensureCsrfCookie = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    issueCsrfToken(req, res);
  } else {
    res.locals.csrfToken = req.cookies[CSRF_COOKIE];
  }
  next();
};

export const requireCsrf = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers["x-csrf-token"];
  const normalizedHeader = Array.isArray(headerToken) ? headerToken[0] : headerToken;

  if (!cookieToken || !normalizedHeader || cookieToken !== normalizedHeader) {
    return res.status(403).json({ message: "CSRF validation failed." });
  }

  next();
};
