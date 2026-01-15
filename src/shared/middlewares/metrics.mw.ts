import { Request, Response, NextFunction } from 'express';
import type { MetricsService } from '../metrics/metrics.service';
import logger from '../utils/logger';

/**
 * Metrics middleware that:
 * 1. Records ALL requests to Prometheus metrics
 * 2. Logs ONLY slow (>1s) or error (>=400) requests
 * 
 * This reduces log noise while maintaining full metrics coverage
 */
export function createMetricsMW(metricsService: MetricsService) {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = process.hrtime();

        res.on('finish', () => {
            const duration = process.hrtime(start);
            const durationInSeconds = duration[0] + duration[1] / 1e9;

            const route = req.route ? req.route.path : req.path;
            const method = req.method;
            const statusCode = res.statusCode;

            // ✅ Always record metrics (for ALL requests)
            metricsService.recordHttpRequest(method, route, statusCode, durationInSeconds);

            // ✨ Smart logging: only log if error OR slow
            const isError = statusCode >= 400;
            const isSlow = durationInSeconds > 1.0; // 1 second threshold

            if (isError || isSlow) {
                const logLevel = isError ? 'error' : 'warn';
                const reason = isError ? 'Error request' : 'Slow request';

                logger[logLevel](req.id, reason, {
                    method,
                    route,
                    statusCode,
                    duration: durationInSeconds,
                    durationMs: Math.round(durationInSeconds * 1000),
                    // trace_id and span_id are auto-injected by logger
                });
            }
        });

        next();
    };
}
