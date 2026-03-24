import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vybeos-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: 'super_admin' | 'agency_admin' | 'project_lead' | 'builder' | 'client_viewer';
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
