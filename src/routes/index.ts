import { Router } from 'express';
import logger from '../shared/utils/logger';

export function createRoutes(container: any) {
    const router = Router();

    router.use('/tasks', container.tasksModule.routes);
    router.use('/notifications', container.notificationsModule.routes);

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

    return router;
}
