import { Router } from 'express';
import { NotificationController } from './notifications.controller';
import { validateBodyMW, validateParamsMW } from '../../shared/middlewares';
import {
    createNotificationSchema,
    updateNotificationSchema,
    taskIdSchema,
    notificationIdSchema,
    statusSchema,
} from './notifications.validators';

export function createNotificationRoutes(notificationController: NotificationController): Router {
    const router = Router();

    /**
     * @swagger
     * /notifications:
     *   post:
     *     summary: Create a new notification
     *     tags: [Notifications]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - taskId
     *               - type
     *               - status
     *               - message
     *               - sentAt
     *             properties:
     *               taskId:
     *                 type: string
     *                 description: Associated task ID
     *                 example: "7cf4cbf6-c06b-492b-bfdd-44574af451"
     *               type:
     *                 type: string
     *                 description: Notification type
     *                 example: "REMINDER"
     *               status:
     *                 type: string
     *                 description: Notification status
     *                 example: "PENDING"
     *               message:
     *                 type: string
     *                 description: Notification message
     *                 example: "Reminder for task 7cf4cbf6-c06b-492b-bfdd-44574af451"
     *               sentAt:
     *                 type: string
     *                 format: date-time
     *                 description: When the notification was sent
     *                 example: "2025-12-10T15:00:00Z"
     *     responses:
     *       201:
     *         description: Notification created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Notification'
     *       400:
     *         description: Bad request - validation error
     *       500:
     *         description: Internal server error
     */
    router.post('/', validateBodyMW(createNotificationSchema), (req, res, next) =>
        notificationController.createNotification(req, res, next),
    );

    /**
     * @swagger
     * /notifications/task/{taskId}:
     *   get:
     *     summary: Get all notifications for a specific task
     *     tags: [Notifications]
     *     parameters:
     *       - in: path
     *         name: taskId
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *         example: "7cf4cbf6-c06b-492b-bfdd-44574af451"
     *     responses:
     *       200:
     *         description: List of task notifications
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Notification'
     *       500:
     *         description: Internal server error
     */
    router.get('/task/:taskId', validateParamsMW(taskIdSchema), (req, res, next) =>
        notificationController.getTaskNotifications(req, res, next),
    );
    /**
     * @swagger
     * /notifications/status/{status}:
     *   get:
     *     summary: Get all notifications by status
     *     tags: [Notifications]
     *     parameters:
     *       - in: path
     *         name: status
     *         required: true
     *         schema:
     *           type: string
     *         description: Notification status
     *         example: "PENDING"
     *     responses:
     *       200:
     *         description: List of notifications with the specified status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Notification'
     *       500:
     *         description: Internal server error
     */
    router.get('/status/:status', validateParamsMW(statusSchema), (req, res, next) =>
        notificationController.getNotificationsByStatus(req, res, next),
    );
    /**
     * @swagger
     * /notifications/{notificationId}:
     *   get:
     *     summary: Get a notification by ID
     *     tags: [Notifications]
     *     parameters:
     *       - in: path
     *         name: notificationId
     *         required: true
     *         schema:
     *           type: string
     *         description: Notification ID
     *         example: "notif-123"
     *     responses:
     *       200:
     *         description: Notification details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Notification'
     *       404:
     *         description: Notification not found
     *       500:
     *         description: Internal server error
     */
    router.get('/:notificationId', validateParamsMW(notificationIdSchema), (req, res, next) =>
        notificationController.getNotification(req, res, next),
    );

    /**
     * @swagger
     * /notifications/{notificationId}:
     *   put:
     *     summary: Update a notification
     *     tags: [Notifications]
     *     parameters:
     *       - in: path
     *         name: notificationId
     *         required: true
     *         schema:
     *           type: string
     *         description: Notification ID
     *         example: "notif-123"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               type:
     *                 type: string
     *                 description: Notification type
     *                 example: "REMINDER"
     *               status:
     *                 type: string
     *                 description: Notification status
     *                 example: "SENT"
     *               message:
     *                 type: string
     *                 description: Notification message
     *                 example: "Updated notification message"
     *               sentAt:
     *                 type: string
     *                 format: date-time
     *                 description: When the notification was sent
     *                 example: "2025-12-10T16:00:00Z"
     *     responses:
     *       200:
     *         description: Notification updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Notification'
     *       400:
     *         description: Bad request - validation error
     *       404:
     *         description: Notification not found
     *       500:
     *         description: Internal server error
     */
    router.put(
        '/:notificationId',
        validateParamsMW(notificationIdSchema),
        validateBodyMW(updateNotificationSchema),
        (req, res, next) => notificationController.updateNotification(req, res, next),
    );

    /**
     * @swagger
     * /notifications/{notificationId}:
     *   delete:
     *     summary: Delete a notification
     *     tags: [Notifications]
     *     parameters:
     *       - in: path
     *         name: notificationId
     *         required: true
     *         schema:
     *           type: string
     *         description: Notification ID
     *         example: "notif-123"
     *     responses:
     *       200:
     *         description: Notification deleted successfully
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
     *                   example: "Notification deleted successfully"
     *       404:
     *         description: Notification not found
     *       500:
     *         description: Internal server error
     */
    router.delete('/:notificationId', validateParamsMW(notificationIdSchema), (req, res, next) =>
        notificationController.deleteNotification(req, res, next),
    );
    return router;
}
