import type { Request, Response, NextFunction } from 'express';
import { getSession, touchSession, parseSessionCookie, SessionRecord } from '../lib/session.js';

export interface AuthedRequest extends Request {
  session?: SessionRecord | null;
}

export async function sessionMiddleware(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const cookie = req.cookies?.session as string | undefined;
  if (!cookie) {
    req.session = null;
    return next();
  }
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) {
    res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict');
    req.session = null;
    return next();
  }
  const session = await getSession(sessionId);
  if (!session) {
    res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict');
    req.session = null;
    return next();
  }
  await touchSession(sessionId);
  req.session = session;
  res.locals.csrfToken = session.csrfToken;
  return next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function requireRole(role: 'admin' | 'user') {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (req.session.role !== role && req.session.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export function requireCsrf(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = (req.headers['x-csrf-token'] as string | undefined) ?? (req.body?.csrfToken as string | undefined);
  if (!req.session || !token) {
    res.status(400).json({ error: 'Missing CSRF token' });
    return;
  }
  if (req.session.csrfToken !== token) {
    res.status(400).json({ error: 'Invalid CSRF token' });
    return;
  }
  next();
}
