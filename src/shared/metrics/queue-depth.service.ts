import { PrismaClient } from '@prisma/client';
import type { MetricsService } from './metrics.service';
import logger from '../utils/logger';

export class QueueDepthService {
    private intervalParams: NodeJS.Timeout | null = null;

    constructor(
        private prisma: PrismaClient,
        private metricsService: MetricsService
    ) { }

    public startQueueDepthTracking(intervalMs: number = 15000) {
        if (this.intervalParams) {
            return;
        }

        logger.info('METRICS', 'Starting queue depth tracking');

        // Initial check
        this.updateQueueDepth();

        this.intervalParams = setInterval(() => {
            this.updateQueueDepth();
        }, intervalMs);
    }

    public stopQueueDepthTracking() {
        if (this.intervalParams) {
            clearInterval(this.intervalParams);
            this.intervalParams = null;
        }
    }

    private async updateQueueDepth() {
        try {
            const counts = await this.prisma.task.groupBy({
                by: ['status'],
                _count: {
                    status: true,
                },
            });

            // Reset all to 0 first or just update based on found
            // Better to ensure all statuses are reported even if 0, but groupBy only returns existing
            // So we can zero out initially if needed, but for now let's just update what we find

            // Map results
            counts.forEach((item) => {
                this.metricsService.taskQueueDepth.set({ status: item.status }, item._count.status);
            });
        } catch (error) {
            logger.error('METRICS', 'Failed to update queue depth', { error });
        }
    }
}
