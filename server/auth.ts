import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const RUNTIME_JWT_SECRET =
  process.env.JWT_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

export interface JwtUserPayload {
  id: number;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export function signAuthToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, RUNTIME_JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): JwtUserPayload {
  return jwt.verify(token, RUNTIME_JWT_SECRET) as JwtUserPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication token is missing.' });
    return;
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}

export function sanitizeUser(user: {
  id: number;
  name: string;
  email: string;
  preferred_explanation_language: string;
  preferred_level: string;
  created_at: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredExplanationLanguage: user.preferred_explanation_language || 'English',
    preferredLevel: user.preferred_level || 'beginner',
    createdAt: user.created_at,
  };
}
