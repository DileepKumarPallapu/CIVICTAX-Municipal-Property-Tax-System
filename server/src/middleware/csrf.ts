import { NextFunction, Request, Response } from 'express';
import { config, getAllowedFrontendOrigins } from '../config/index.js';

export function verifyCsrf(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const customHeader =
    req.headers['x-requested-with'] ||
    req.headers['x-civictax-csrf'];

  if (origin) {
    let requestOrigin: string;
    try {
      requestOrigin = new URL(origin).origin;
    } catch {
      res.status(403).json({
        error: 'CSRF_VALIDATION_FAILED',
        message: 'Invalid request origin.',
      });
      return;
    }

    if (!getAllowedFrontendOrigins(config).includes(requestOrigin)) {
      res.status(403).json({
        error: 'CSRF_VALIDATION_FAILED',
        message: 'Cross-origin state-changing requests are prohibited.',
      });
      return;
    }
  } else if (!customHeader) {
    res.status(403).json({
      error: 'CSRF_VALIDATION_FAILED',
      message: 'A valid request origin or CSRF header is required.',
    });
    return;
  }

  next();
}
