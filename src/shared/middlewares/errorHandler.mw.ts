import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { ApiError, ValidationError, InternalServerError } from '../errors/api-error';
import { getTraceContext } from './trace-context.mw';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 * 
 * Catches all errors, converts them to ApiError format,
 * adds trace context, and returns consistent JSON response
 */
export function errorHandlerMW(err: Error, req: Request, res: Response, next: NextFunction) {
    // Get trace context for error response
    const traceCtx = getTraceContext();
    const requestId = req.id || 'unknown';
    const traceId = traceCtx?.traceId;

    let apiError: ApiError;

    // Convert different error types to ApiError
    if (err instanceof ApiError) {
        // Already an ApiError, use as-is
        apiError = err;
    } else if (err instanceof ZodError) {
        // Zod validation error
        apiError = new ValidationError(
            'Request validation failed',
            {
                issues: err.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            }
        );
    } else {
        // Unknown error - wrap in InternalServerError
        apiError = new InternalServerError(
            err.message || 'An unexpected error occurred',
            process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
        );
    }

    // Log the error (only errors, not warnings for client errors)
    if (apiError.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
        // Server errors (5xx) - log as ERROR
        logger.error(requestId, apiError.message, {
            code: apiError.code,
            statusCode: apiError.statusCode,
            details: apiError.details,
            stack: err.stack,
        });
    } else {
        // Client errors (4xx) - already logged by smart logging if slow
        // No need to log again here
    }

    // Send error response
    const response = apiError.toResponse(requestId, traceId);
    res.status(apiError.statusCode).json(response);
}
