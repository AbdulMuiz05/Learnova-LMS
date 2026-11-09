import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';

interface MongoServerErrorLike extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  path?: string;
  value?: unknown;
  errors?: Record<string, { message: string; path?: string }>;
}

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Something went wrong on our side';
  let code = 'INTERNAL_ERROR';
  let details: unknown;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code ?? code;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
    code = 'INVALID_ID';
  } else if ((error as MongoServerErrorLike).code === 11000) {
    statusCode = 409;
    message = 'A record with these details already exists';
    code = 'DUPLICATE_KEY';
    details = (error as MongoServerErrorLike).keyValue;
  } else if ((error as MongoServerErrorLike).name === 'MulterError') {
    statusCode = 400;
    message = error.message;
    code = 'UPLOAD_ERROR';
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Malformed JSON request body';
    code = 'INVALID_JSON';
  }

  if (statusCode >= 500) {
    logger.error(`Unhandled error: ${error.message}`, error);
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode >= 500 ? 'Something went wrong on our side' : message,
    code,
    ...(details ? { errors: details } : {}),
    ...(!isProduction && statusCode >= 500 ? { stack: error.stack } : {}),
  });
}
