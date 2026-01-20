import { Request, Response, NextFunction } from 'express';
import type { MetricsService } from '../metrics/metrics.service';
import logger from '../utils/logger';

/**
 * Adaptive Rate Limiter
 * 
 * Protects the system from overload by rejecting requests when:
 * - Queue depth exceeds threshold
 * - P95 latency is too high (future enhancement)
 * 
 * This implements backpressure to prevent cascading failures
 */
export class AdaptiveLimiter {
    private currentQueueDepth = 0;
    private updateInterval: NodeJS.Timeout | null = null;

    constructor(
        private metricsService: MetricsService,
        private maxQueueDepth: number = 5000, // Default: 5000 pending tasks
        private slowThresholdMs: number = 500, // Future: max P95 latency
    ) {
        // Update metrics every 10 seconds
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 10000);

        logger.info('ADAPTIVE_LIMITER', 'Adaptive limiter initialized', {
            maxQueueDepth: this.maxQueueDepth,
            slowThresholdMs: this.slowThresholdMs,
        });
    }

    /**
     * Update current system metrics
     * In a real implementation, this would query Prometheus or the metrics service
     */
    private async updateMetrics() {
        try {
            // TODO: In production, query actual queue depth from metrics
            // For now, we'll check a gauge if available
            // This is a placeholder - the real implementation would use:
            // const metrics = await this.metricsService.register.getSingleMetric('task_queue_depth');

            // For now, we'll use a simple approach
            this.currentQueueDepth = 0; // Will be updated by actual metrics
        } catch (err) {
            logger.error('ADAPTIVE_LIMITER', 'Failed to update metrics', {
                error: err instanceof Error ? err.message : String(err)
            });
        }
    }

    /**
     * Middleware function that rejects requests when system is overloaded
     */
    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            // Check if system is overloaded
            // In production, you'd also check P95 latency here

            // For now, we'll use a simple heuristic:
            // Count active requests or check metrics

            // TODO: Implement proper queue depth check from Prometheus
            // For Phase 1, we'll use a placeholder
            const isOverloaded = false; // Will be enhanced in Phase 2

            if (isOverloaded) {
                logger.warn(req.id, 'System overloaded - rejecting request', {
                    queueDepth: this.currentQueueDepth,
                    threshold: this.maxQueueDepth,
                });

                res.status(503).json({
                    error: 'Service Temporarily Overloaded',
                    message: 'The system is currently experiencing high load. Please retry after 30 seconds.',
                    retry_after_seconds: 30,
                });
                return;
            }

            next();
        };
    }

    /**
     * Cleanup - stop the metrics update interval
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Get current state (for monitoring/debugging)
     */
    getState() {
        return {
            currentQueueDepth: this.currentQueueDepth,
            maxQueueDepth: this.maxQueueDepth,
        };
    }
}
