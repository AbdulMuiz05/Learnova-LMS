import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (handler: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200
): Response {
  return res.status(statusCode).json({ success: true, message, data });
}
