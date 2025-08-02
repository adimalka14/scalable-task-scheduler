import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

export function logApiMW(request: Request, response: Response, next: NextFunction) {
    logger.debug(request.id, 'call to api', {
        method: request.method,
        originalUrl: request.originalUrl,
    });

    next();
}
