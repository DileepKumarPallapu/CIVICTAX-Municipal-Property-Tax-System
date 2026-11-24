import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/index.js';
import type { CivicTaxSessionUser } from '../types/index.js';

export const SESSION_COOKIE_NAME = 'civictax.sid';
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

const VALID_ROLES = new Set(['CITIZEN', 'OFFICER', 'ADMIN']);

export function getAuthenticatedUser(
  req: Request
): CivicTaxSessionUser | undefined {
  const user = req.session.civicTaxUser;
  const provider = req.session.authProvider;
  if (
    !user ||
    !user.id ||
    !VALID_ROLES.has(user.role) ||
    (config.isProduction && provider !== 'salesforce') ||
    (!config.isProduction && provider !== 'salesforce' && provider !== 'demo')
  ) {
    return undefined;
  }
  return user;
}

export function requireCivicTaxUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!getAuthenticatedUser(req)) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHENTICATED',
      message: 'CivicTax login is required.',
    });
    return;
  }
  next();
}

export function requireRole(
  allowedRoles: CivicTaxSessionUser['role'][]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'CivicTax login is required.',
      });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'The authenticated CivicTax role is not permitted.',
      });
      return;
    }
    next();
  };
}

export function enforceSessionLifetime(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.civicTaxUser) {
    next();
    return;
  }

  const user = getAuthenticatedUser(req);
  const authenticatedAt = req.session.authenticatedAt;
  const lastActivityAt = req.session.lastActivityAt;
  const now = Date.now();
  const expired =
    !user ||
    !Number.isFinite(authenticatedAt) ||
    !Number.isFinite(lastActivityAt) ||
    now - (authenticatedAt ?? 0) >= SESSION_ABSOLUTE_TIMEOUT_MS ||
    now - (lastActivityAt ?? 0) >= SESSION_IDLE_TIMEOUT_MS;

  if (expired) {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie(SESSION_COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'none' : 'lax',
      });
      res.status(401).json({
        authenticated: false,
        user: null,
        error: 'SESSION_EXPIRED',
      });
    });
    return;
  }

  req.session.lastActivityAt = now;
  req.session.cookie.maxAge = SESSION_IDLE_TIMEOUT_MS;
  next();
}
