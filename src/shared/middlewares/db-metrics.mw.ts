import type { MetricsService } from '../metrics/metrics.service';

/**
 * Create Prisma middleware for recording database query metrics
 * 
 * This middleware captures:
 * - Query duration (time to execute)
 * - Operation type (findMany, create, update, etc.)
 * - Model name (User, Task, etc.)
 * 
 * @param metricsService - MetricsService instance for recording metrics
 * @returns Prisma middleware function
 * 
 * @example
 * const dbMetricsMiddleware = createDBMetricsMiddleware(metricsService);
 * const prisma = new PrismaClient();
 * prisma.$use(dbMetricsMiddleware);
 */
export function createDBMetricsMiddleware(metricsService: MetricsService) {
    return async (params: any, next: any) => {
        const start = Date.now();

        try {
            // Execute the query
            const result = await next(params);

            // Record successful query metrics
            const duration = (Date.now() - start) / 1000; // convert to seconds

            metricsService.dbQueryDuration.observe(
                {
                    operation: params.action || 'unknown',
                    model: params.model || 'unknown',
                },
                duration
            );

            return result;
        } catch (error) {
            // Still record metrics for failed queries
            const duration = (Date.now() - start) / 1000;

            metricsService.dbQueryDuration.observe(
                {
                    operation: params.action || 'unknown',
                    model: params.model || 'unknown',
                },
                duration
            );

            // Re-throw the error
            throw error;
        }
    };
}
