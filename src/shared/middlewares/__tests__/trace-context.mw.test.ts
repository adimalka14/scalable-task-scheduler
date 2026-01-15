import { Request, Response, NextFunction } from 'express';
import { traceContextMW, getTraceContext, getTraceId, getSpanId, traceContext } from '../trace-context.mw';

describe('TraceContextMW', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let setHeaderSpy: jest.Mock;

    beforeEach(() => {
        setHeaderSpy = jest.fn();
        mockRequest = {
            headers: {},
            id: undefined,
        };
        mockResponse = {
            setHeader: setHeaderSpy,
        };
        mockNext = jest.fn();
    });

    describe('traceContextMW', () => {
        it('should generate new traceId when X-Trace-Id header is not present', () => {
            traceContextMW(mockRequest as Request, mockResponse as Response, mockNext);

            expect(setHeaderSpy).toHaveBeenCalledWith('X-Trace-Id', expect.any(String));
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use existing traceId from X-Trace-Id header', () => {
            const existingTraceId = 'existing-trace-id-123';
            mockRequest.headers = { 'x-trace-id': existingTraceId };

            traceContextMW(mockRequest as Request, mockResponse as Response, mockNext);

            expect(setHeaderSpy).toHaveBeenCalledWith('X-Trace-Id', existingTraceId);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use request.id when available', () => {
            const existingRequestId = 'req-id-456';
            mockRequest.id = existingRequestId;

            traceContextMW(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should generate requestId when request.id is not available', () => {
            mockRequest.id = undefined;

            traceContextMW(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should store trace context in AsyncLocalStorage', () => {
            const existingTraceId = 'trace-123';
            mockRequest.headers = { 'x-trace-id': existingTraceId };
            mockRequest.id = 'req-123';

            traceContextMW(mockRequest as Request, mockResponse as Response, () => {
                const context = getTraceContext();

                expect(context).toBeDefined();
                expect(context?.traceId).toBe(existingTraceId);
                expect(context?.requestId).toBe('req-123');
                expect(context?.spanId).toBeDefined();
                expect(context?.startTime).toBeGreaterThan(0);
            });
        });

        it('should set response header with traceId', () => {
            const traceId = 'test-trace-id';
            mockRequest.headers = { 'x-trace-id': traceId };

            traceContextMW(mockRequest as Request, mockResponse as Response, mockNext);

            expect(setHeaderSpy).toHaveBeenCalledWith('X-Trace-Id', traceId);
        });
    });

    describe('getTraceContext', () => {
        it('should return undefined when called outside request context', () => {
            const context = getTraceContext();
            expect(context).toBeUndefined();
        });

        it('should return trace context when called inside request context', () => {
            traceContextMW(mockRequest as Request, mockResponse as Response, () => {
                const context = getTraceContext();
                expect(context).toBeDefined();
                expect(context?.traceId).toBeDefined();
                expect(context?.spanId).toBeDefined();
                expect(context?.requestId).toBeDefined();
                expect(context?.startTime).toBeDefined();
            });
        });
    });

    describe('getTraceId', () => {
        it('should return undefined when called outside request context', () => {
            const traceId = getTraceId();
            expect(traceId).toBeUndefined();
        });

        it('should return traceId when called inside request context', () => {
            const expectedTraceId = 'trace-xyz';
            mockRequest.headers = { 'x-trace-id': expectedTraceId };

            traceContextMW(mockRequest as Request, mockResponse as Response, () => {
                const traceId = getTraceId();
                expect(traceId).toBe(expectedTraceId);
            });
        });
    });

    describe('getSpanId', () => {
        it('should return undefined when called outside request context', () => {
            const spanId = getSpanId();
            expect(spanId).toBeUndefined();
        });

        it('should return spanId when called inside request context', () => {
            traceContextMW(mockRequest as Request, mockResponse as Response, () => {
                const spanId = getSpanId();
                expect(spanId).toBeDefined();
                expect(typeof spanId).toBe('string');
            });
        });
    });
});
