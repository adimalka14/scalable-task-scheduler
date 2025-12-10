import { StatusCodes } from 'http-status-codes';

/**
 * Base application error class
 * All domain errors should extend this class
 */
export class BaseAppError extends Error {
    public readonly status: number;
    public readonly name: string;
    public readonly isOperational: boolean;

    constructor(
        name: string,
        message: string,
        status: number = StatusCodes.INTERNAL_SERVER_ERROR,
        isOperational: boolean = true,
    ) {
        super(message);
        this.name = name;
        this.status = status;
        this.isOperational = isOperational;
        // Capture stack trace if available (V8-specific feature)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends BaseAppError {
    constructor(entity: string, id?: string) {
        const message = id ? `${entity} with id ${id} not found` : `${entity} not found`;
        super('NotFoundError', message, StatusCodes.NOT_FOUND);
    }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends BaseAppError {
    constructor(message: string, details?: any) {
        super('ValidationError', message, StatusCodes.BAD_REQUEST);
        if (details) {
            (this as any).details = details;
        }
    }
}
