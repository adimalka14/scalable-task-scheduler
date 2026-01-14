import { Request, Response } from 'express';
import { metricsMW } from '../metrics.mw';
import { metricsService } from '../../metrics/metrics.service';

jest.mock('../../metrics/metrics.service', () => ({
    metricsService: {
        recordHttpRequest: jest.fn(),
    },
}));

describe('Metrics Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

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
        jest.clearAllMocks();
    });

    it('should measure duration and record metrics on finish', () => {
        metricsMW(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

        // Simulate finish event
        const finishCallback = (res.on as jest.Mock).mock.calls[0][1];
        finishCallback();

        expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/test',
            200,
            expect.any(Number)
        );
    });

    it('should fallback to req.path if req.route is undefined', () => {
        req.route = undefined;
        metricsMW(req as Request, res as Response, next);

        const finishCallback = (res.on as jest.Mock).mock.calls[0][1];
        finishCallback();

        expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/test',
            200,
            expect.any(Number)
        );
    });
});
