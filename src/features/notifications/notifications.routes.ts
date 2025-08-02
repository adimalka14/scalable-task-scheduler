import { Router } from 'express';
import { NotificationController } from './notifications.controller';
import { validateBodyMW } from '../../shared/middlewares';
import { createNotificationSchema, updateNotificationSchema } from './notifications.validators';

export function createNotificationRoutes(notificationController: NotificationController): Router {
    const router = Router();

    router.post('/', validateBodyMW(createNotificationSchema), (req, res) =>
        notificationController.createNotification(req, res),
    );
    router.get('/:notificationId', (req, res) => notificationController.getNotification(req, res));
    router.put('/:notificationId', validateBodyMW(updateNotificationSchema), (req, res) =>
        notificationController.updateNotification(req, res),
    );
    router.delete('/:notificationId', (req, res) => notificationController.deleteNotification(req, res));
    router.get('/task/:taskId', (req, res) => notificationController.getTaskNotifications(req, res));
    router.get('/status/:status', (req, res) => notificationController.getNotificationsByStatus(req, res));

    return router;
}
