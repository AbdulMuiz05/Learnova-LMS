export class ApiError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;
  public isOperational = true;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message = 'Resource already exists', code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static tooMany(message = 'Too many requests. Please try again later.', code = 'RATE_LIMITED') {
    return new ApiError(429, message, code);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, code);
  }
}
