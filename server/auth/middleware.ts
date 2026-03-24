import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from './jwt';
import { hasPermission, type Role } from './roles';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware — verifies JWT from Authorization header.
 * Attaches auth context to request.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const token = header.slice(7);
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware — checks if user has a specific permission.
 * Must be used after authenticate().
 */
export function authorize(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!hasPermission(req.auth.role as Role, permission as keyof ReturnType<typeof import('./roles').getPermissions>)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Role-based middleware — requires minimum role level.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.auth.role as Role)) {
      res.status(403).json({ error: `Requires one of: ${roles.join(', ')}` });
      return;
    }

    next();
  };
}
