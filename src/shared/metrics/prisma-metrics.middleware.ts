import { Prisma } from '@prisma/client';
import type { MetricsService } from './metrics.service';

export function prismaMetricsMiddleware(metricsService: MetricsService): Prisma.Middleware {
    return async (params, next) => {
        const start = process.hrtime();
        const result = await next(params);
        const duration = process.hrtime(start);
        const durationInSeconds = duration[0] + duration[1] / 1e9;

        if (params.model) {
            metricsService.dbQueryDuration.observe(
                {
                    operation: params.action,
                    model: params.model
                },
                durationInSeconds
            );
        }

        return result;
    };
}
