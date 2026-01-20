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
        try {
            res.set('Content-Type', container.metricsService.register.contentType);
            res.end(await container.metricsService.register.metrics());
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
     *     description: Checks if all dependencies (database, Redis, RabbitMQ) are healthy
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is ready (all dependencies healthy)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 dependencies:
     *                   type: object
     *                   properties:
     *                     database:
     *                       type: string
     *                       example: "healthy"
     *                     redis:
     *                       type: string
     *                       example: "healthy"
     *                     rabbitmq:
     *                       type: string
     *                       example: "healthy"
     *       503:
     *         description: Service is not ready (one or more dependencies unhealthy)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 dependencies:
     *                   type: object
     *                 errors:
     *                   type: array
     *                   items:
     *                     type: string
     *                   example: ["database: connection timeout"]
     */
    router.get('/readiness', async (req, res) => {
        const result = await container.healthService.check();
        const statusCode = result.success ? 200 : 503;

        res.status(statusCode).json(result);
    });

    return router;

}

