import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../metrics/metrics.service';

export const metricsMW = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationInSeconds = duration[0] + duration[1] / 1e9;

        const route = req.route ? req.route.path : req.path;
        const method = req.method;
        const statusCode = res.statusCode;

        metricsService.recordHttpRequest(method, route, statusCode, durationInSeconds);
    });

    next();
};
