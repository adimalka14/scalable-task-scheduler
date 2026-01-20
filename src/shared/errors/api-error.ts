import { StatusCodes } from 'http-status-codes';

/**
 * Standard API Error Response
 * 
 * Follows RFC 7807 Problem Details for HTTP APIs pattern
 * Provides consistent error structure across all endpoints
 */
export interface ApiErrorResponse {
    error: {
        /** Machine-readable error code */
        code: string;
        /** Human-readable error message */
        message: string;
        /** HTTP status code */
        statusCode: number;
        /** Additional error details (optional) */
        details?: any;
        /** Request ID for tracing (automatically added) */
        requestId?: string;
        /** Trace ID for distributed tracing (automatically added) */
        traceId?: string;
    };
}

/**
 * Base API Error Class
 * 
 * All application errors should extend this class
 * Provides consistent error structure and automatic logging
 * 
 * @example
 * throw new ApiError(
 *   'TASK_NOT_FOUND',
 *   'Task with ID xyz not found',
 *   StatusCodes.NOT_FOUND
 * );
 */
export class ApiError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(
        code: string,
        message: string,
        statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
        details?: any
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to API response format
     */
    toResponse(requestId?: string, traceId?: string): ApiErrorResponse {
        return {
            error: {
                code: this.code,
                message: this.message,
                statusCode: this.statusCode,
                ...(this.details && { details: this.details }),
                ...(requestId && { requestId }),
                ...(traceId && { traceId }),
            },
        };
    }
}

// ==================== Common Error Types ====================

/**
 * Resource Not Found (404)
 */
export class NotFoundError extends ApiError {
    constructor(resource: string, id: string, details?: any) {
        super(
            `${resource.toUpperCase()}_NOT_FOUND`,
            `${resource} with ID ${id} not found`,
            StatusCodes.NOT_FOUND,
            details
        );
    }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends ApiError {
    constructor(message: string, details?: any) {
        super(
            'VALIDATION_ERROR',
            message,
            StatusCodes.BAD_REQUEST,
            details
        );
    }
}

/**
 * Unauthorized (401)
 */
export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized access', details?: any) {
        super(
            'UNAUTHORIZED',
            message,
            StatusCodes.UNAUTHORIZED,
            details
        );
    }
}

/**
 * Forbidden (403)
 */
export class ForbiddenError extends ApiError {
    constructor(message: string = 'Access forbidden', details?: any) {
        super(
            'FORBIDDEN',
            message,
            StatusCodes.FORBIDDEN,
            details
        );
    }
}

/**
 * Conflict (409)
 */
export class ConflictError extends ApiError {
    constructor(message: string, details?: any) {
        super(
            'CONFLICT',
            message,
            StatusCodes.CONFLICT,
            details
        );
    }
}

/**
 * Service Unavailable (503)
 */
export class ServiceUnavailableError extends ApiError {
    constructor(message: string = 'Service temporarily unavailable', details?: any) {
        super(
            'SERVICE_UNAVAILABLE',
            message,
            StatusCodes.SERVICE_UNAVAILABLE,
            details
        );
    }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends ApiError {
    constructor(message: string = 'Internal server error', details?: any) {
        super(
            'INTERNAL_SERVER_ERROR',
            message,
            StatusCodes.INTERNAL_SERVER_ERROR,
            details
        );
    }
}
