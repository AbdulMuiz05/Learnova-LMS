import { NextFunction, Request, Response } from 'express';

function clean<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      // Prevent MongoDB operator injection (?$where=, { price: { $gt: 0 } }, etc.)
      if (key.startsWith('$') || key.includes('.')) continue;
      output[key] = clean(nested);
    }
    return output as T;
  }
  return value;
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = clean(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = clean(req.params);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = clean(req.query);
  }
  next();
}
