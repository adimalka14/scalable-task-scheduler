import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export const validateBodyMW = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const error = {
                status: StatusCodes.BAD_REQUEST,
                name: ReasonPhrases.BAD_REQUEST,
                message: 'Invalid request body',
                details: result.error.flatten(),
            };

            return next(error);
        }

        req.body = result.data;
        next();
    };
};
