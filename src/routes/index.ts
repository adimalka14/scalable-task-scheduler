import { Router } from 'express';
import logger from '../shared/utils/logger';

export function createRoutes(container: any) {
    const router = Router();

    router.use('/tasks', container.tasksModule.routes);
    router.use('/notifications', container.notificationsModule.routes);

    /**
     * @swagger
     * /metrics:
     *   get:
     *     summary: Prometheus metrics endpoint
     *     tags: [Monitoring]
     *     responses:
     *       200:
     *         description: Prometheus metrics
     *         content:
     *           text/plain:
     *             schema:
     *               type: string
     *               example: "# HELP http_request_duration_seconds Duration of HTTP requests in seconds..."
     */
    router.get('/metrics', async (req, res) => {
        const { metricsService } = await import('../shared/metrics/metrics.service');
        try {
            res.set('Content-Type', metricsService.register.contentType);
            res.end(await metricsService.register.metrics());
        } catch (error) {
            res.status(500).send(error);
        }
    });

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Service is healthy"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                   example: "2025-12-10T15:00:00.000Z"
     */
    router.get('/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Service is healthy',
            timestamp: new Date().toISOString(),
        });
    });

    /**
     * @swagger
     * /readiness:
     *   get:
     *     summary: Readiness check endpoint
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is ready (all dependencies healthy)
     *       503:
     *         description: Service is not ready (one or more dependencies unhealthy)
     */
    router.get('/readiness', async (req, res) => {
        const { ReadinessCheck } = await import('../shared/health/readiness');
        const readinessCheck = new ReadinessCheck();

        const result = await readinessCheck.check();
        const statusCode = result.success ? 200 : 503;

        res.status(statusCode).json(result);
    });

    return router;

}
