import { Request, Response, NextFunction } from 'express';
import {
    ReasonPhrases,
    StatusCodes,
} from 'http-status-codes';
import logger from '../utils/logger';

export function errorHandlerMW(err: any, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.status || StatusCodes.INTERNAL_SERVER_ERROR;

    logger.error('ERROR_HANDLER', err.message, {
        stack: err.stack,
        route: req.originalUrl,
        method: req.method,
    });

    res.status(statusCode).json({
        error: err.name ?? ReasonPhrases.INTERNAL_SERVER_ERROR,
        message: err.message || 'Something went wrong',
    });
}
