import { Router } from 'express';
import logger from '../shared/utils/logger';

export function createRoutes(container: any) {
    const router = Router();

    router.use('/tasks', container.tasksModule.routes);
    router.use('/notifications', container.notificationsModule.routes);

    router.get('/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Service is healthy',
            timestamp: new Date().toISOString(),
        });
    });

    return router;
}
