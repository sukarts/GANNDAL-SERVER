import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

// env TTL est un string ('15m', '7d') — caster vers le type attendu par jsonwebtoken
type Ttl = SignOptions['expiresIn'];

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessTtl as Ttl });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshTtl as Ttl });
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}
