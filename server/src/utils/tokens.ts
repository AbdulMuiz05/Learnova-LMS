import crypto from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { env, accessCookieMaxAge, cookieOptions, refreshCookieMaxAge } from '../config/env';
import { ApiError } from './ApiError';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: 'student' | 'admin';
  type: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export function signAccessToken(user: { _id: string; role: 'student' | 'admin' }): string {
  return jwt.sign(
    { sub: user._id, role: user.role, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] }
  );
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign(
    { sub: userId, jti, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions['expiresIn'] }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === 'string' || decoded.type !== 'access') {
    throw ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded === 'string' || decoded.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_TOKEN');
  }
  return decoded as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiryDate(): Date {
  return new Date(Date.now() + refreshCookieMaxAge);
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: accessCookieMaxAge });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: refreshCookieMaxAge });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
}
