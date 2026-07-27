import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthRequest } from '../types';
import { hasPermission } from '../config/permissions';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 422, errors.array());
  }
  next();
};

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

    if (!token) {
      return sendError(res, 'Authentication required', 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (...resources: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const allowed = resources.some((resource) => hasPermission(req.user!.role, resource));
    if (!allowed) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient role', 403);
    }
    next();
  };
};
