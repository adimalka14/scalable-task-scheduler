import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import logger from '../utils/logger';
import { ValidationError } from '../config/errors';

export const validateBodyMW = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        logger.silly((req.headers['x-request-id'] as string) || 'VALIDATION', 'Validation result', result);

        if (!result.success) {
            const error = new ValidationError('Invalid request body', result.error.flatten());
            return next(error);
        }

        req.body = result.data;
        next();
    };
};

export const validateParamsMW = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);

        logger.silly((req.headers['x-request-id'] as string) || 'VALIDATION', 'Validation result', result);

        if (!result.success) {
            const error = new ValidationError('Invalid route parameters', result.error.flatten());
            return next(error);
        }

        req.params = result.data as any;
        next();
    };
};
