import { Request, Response } from 'express';
import { createMetricsMW } from '../metrics.mw';

const mockMetricsService = {
    recordHttpRequest: jest.fn(),
};

describe('Metrics Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let middleware: ReturnType<typeof createMetricsMW>;

    beforeEach(() => {
        req = {
            method: 'GET',
            route: { path: '/test' },
            path: '/test'
        } as any;
        res = {
            statusCode: 200,
            on: jest.fn(),
        } as any;
        next = jest.fn();
        middleware = createMetricsMW(mockMetricsService as any);
        jest.clearAllMocks();
    });

    it('should measure duration and record metrics on finish', () => {
        middleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

        // Simulate finish event
        const finishCallback = (res.on as jest.Mock).mock.calls[0][1];
        finishCallback();

        expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/test',
            200,
            expect.any(Number)
        );
    });

    it('should fallback to req.path if req.route is undefined', () => {
        req.route = undefined;
        middleware(req as Request, res as Response, next);

        const finishCallback = (res.on as jest.Mock).mock.calls[0][1];
        finishCallback();

        expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/test',
            200,
            expect.any(Number)
        );
    });
});
