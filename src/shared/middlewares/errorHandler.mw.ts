import { Request, Response, NextFunction } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';
import { BaseAppError } from '../config/errors';

export function errorHandlerMW(err: any, req: Request, res: Response, next: NextFunction) {
    // Detect BaseAppError via .status property
    const isBaseAppError = err instanceof BaseAppError || (err.status && typeof err.status === 'number');
    const statusCode = isBaseAppError ? err.status : StatusCodes.INTERNAL_SERVER_ERROR;

    // Extract contextual metadata if present
    const contextualMetadata: any = {
        route: req.originalUrl,
        method: req.method,
    };

    // Add contextual metadata from error if available
    if (err.taskId) contextualMetadata.taskId = err.taskId;
    if (err.notificationId) contextualMetadata.notificationId = err.notificationId;
    if (err.userId) contextualMetadata.userId = err.userId;

    // Single structured error log
    logger.error((req.headers['x-request-id'] as string) || 'UNKNOWN', err.message || 'Unknown error', {
        error: {
            name: err.name || 'Error',
            message: err.message || 'Something went wrong',
            status: statusCode,
            stack: err.stack,
            ...contextualMetadata,
        },
    });

    // Uniform JSON response
    res.status(statusCode).json({
        error: err.name || ReasonPhrases.INTERNAL_SERVER_ERROR,
        message: err.message || 'Something went wrong',
    });
}
