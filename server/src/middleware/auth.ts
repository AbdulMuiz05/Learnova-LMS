import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { ACCESS_COOKIE, AccessTokenPayload, verifyAccessToken } from '../utils/tokens';
import { asyncHandler } from '../utils/response';

function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function resolveUser(token: string) {
  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Your session has expired. Refreshing…', 'TOKEN_EXPIRED');
    }
    throw new ApiError(401, 'Invalid authentication token', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account no longer exists', 'UNAUTHORIZED');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated', 'ACCOUNT_DISABLED');
  if (!user.isVerified) throw new ApiError(403, 'Please verify your email address first', 'EMAIL_NOT_VERIFIED');
  return user;
}

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
  req.user = await resolveUser(token);
  next();
});

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    req.user = undefined;
  }
  next();
});

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('Admin privileges are required for this action'));
      return;
    }
    next();
  };
