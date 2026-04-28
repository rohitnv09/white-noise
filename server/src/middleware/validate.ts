import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { createError } from './errorHandler.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const err = createError(400, 'VALIDATION_ERROR', 'Invalid request body');
      (err as unknown as Record<string, unknown>)['details'] = result.error.flatten();
      next(err);
      return;
    }
    req.body = result.data;
    next();
  };
}
