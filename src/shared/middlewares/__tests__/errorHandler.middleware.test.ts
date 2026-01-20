import { errorHandlerMW } from '../errorHandler.mw';
import { Request, Response } from 'express';
import { ApiError, NotFoundError, ValidationError } from '../../errors/api-error';

// Mock trace context
jest.mock('../trace-context.mw', () => ({
    getTraceContext: () => ({ traceId: 'test-trace-id', spanId: 'test-span-id' }),
}));

describe('errorHandler middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockReq = {
            id: 'test-request-id',
            originalUrl: '/test',
            method: 'GET',
            headers: {},
        };
        mockRes = { status: mockStatus };
        mockNext = jest.fn();
    });

    it('should return error response with new ApiError format', () => {
        const err = new Error('Something went wrong');

        errorHandlerMW(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong',
                statusCode: 500,
                requestId: 'test-request-id',
                traceId: 'test-trace-id',
            },
        });
    });

    it('should handle ApiError directly', () => {
        const err = new NotFoundError('Task', 'abc-123');

        errorHandlerMW(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({
            error: {
                code: 'TASK_NOT_FOUND',
                message: 'Task with ID abc-123 not found',
                statusCode: 404,
                requestId: 'test-request-id',
                traceId: 'test-trace-id',
            },
        });
    });

    it('should handle ValidationError with details', () => {
        const err = new ValidationError('Invalid input', { field: 'email' });

        errorHandlerMW(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input',
                statusCode: 400,
                details: { field: 'email' },
                requestId: 'test-request-id',
                traceId: 'test-trace-id',
            },
        });
    });

    it('should fallback to unknown request id', () => {
        mockReq.id = undefined;
        const err = new Error('Test error');

        errorHandlerMW(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockJson).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.objectContaining({
                    requestId: 'unknown',
                }),
            }),
        );
    });
});
