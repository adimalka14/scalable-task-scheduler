import request from 'supertest';
import express, { Express } from 'express';
import { createNotificationRoutes } from '../notifications.routes';
import { NotificationController } from '../notifications.controller';
import { NotificationType, NotificationStatus } from '../notifications.types';

// Mock NotificationController
const mockController = {
    createNotification: jest.fn(),
    getTaskNotifications: jest.fn(),
    getNotificationsByStatus: jest.fn(),
    getNotification: jest.fn(),
    updateNotification: jest.fn(),
    deleteNotification: jest.fn(),
} as unknown as NotificationController;

describe('Notification Routes', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        const router = createNotificationRoutes(mockController);
        app.use('/notifications', router);

        jest.clearAllMocks();
    });

    describe('POST /notifications', () => {
        const validPayload = {
            taskId: '123e4567-e89b-12d3-a456-426614174000',
            type: NotificationType.TASK_REMINDER,
            status: NotificationStatus.PENDING,
            message: 'Test notification',
            sentAt: new Date().toISOString(),
        };

        it('should delegate to controller.createNotification on valid payload', async () => {
            (mockController.createNotification as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ success: true });
            });

            await request(app)
                .post('/notifications')
                .send(validPayload)
                .expect(201);

            expect(mockController.createNotification).toHaveBeenCalled();
        });

        it('should return 400 on invalid payload (validation middleware)', async () => {
            const invalidPayload = { ...validPayload, taskId: 'invalid-id' };

            await request(app)
                .post('/notifications')
                .send(invalidPayload)
                .expect(400);

            expect(mockController.createNotification).not.toHaveBeenCalled();
        });
    });

    describe('GET /notifications/task/:taskId', () => {
        const taskId = '123e4567-e89b-12d3-a456-426614174000';

        it('should delegate to controller.getTaskNotifications on valid taskId', async () => {
            (mockController.getTaskNotifications as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .get(`/notifications/task/${taskId}`)
                .expect(200);

            expect(mockController.getTaskNotifications).toHaveBeenCalled();
        });

        it('should return 400 on invalid taskId', async () => {
            await request(app)
                .get('/notifications/task/invalid-id')
                .expect(400);

            expect(mockController.getTaskNotifications).not.toHaveBeenCalled();
        });
    });

    describe('GET /notifications/status/:status', () => {
        it('should delegate to controller.getNotificationsByStatus on valid status', async () => {
            (mockController.getNotificationsByStatus as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .get(`/notifications/status/${NotificationStatus.PENDING}`)
                .expect(200);

            expect(mockController.getNotificationsByStatus).toHaveBeenCalled();
        });

        it('should return 400 on invalid status', async () => {
            await request(app)
                .get('/notifications/status/INVALID_STATUS')
                .expect(400);

            expect(mockController.getNotificationsByStatus).not.toHaveBeenCalled();
        });
    });

    describe('GET /notifications/:notificationId', () => {
        const notificationId = '123e4567-e89b-12d3-a456-426614174000';

        it('should delegate to controller.getNotification on valid id', async () => {
            (mockController.getNotification as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .get(`/notifications/${notificationId}`)
                .expect(200);

            expect(mockController.getNotification).toHaveBeenCalled();
        });

        it('should return 400 on invalid notificationId', async () => {
            await request(app)
                .get('/notifications/invalid-id')
                .expect(400);

            expect(mockController.getNotification).not.toHaveBeenCalled();
        });
    });

    describe('PUT /notifications/:notificationId', () => {
        const notificationId = '123e4567-e89b-12d3-a456-426614174000';
        const validUpdate = {
            status: NotificationStatus.SENT,
        };

        it('should delegate to controller.updateNotification on valid input', async () => {
            (mockController.updateNotification as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .put(`/notifications/${notificationId}`)
                .send(validUpdate)
                .expect(200);

            expect(mockController.updateNotification).toHaveBeenCalled();
        });

        it('should return 400 on invalid notificationId', async () => {
            await request(app)
                .put('/notifications/invalid-id')
                .send(validUpdate)
                .expect(400);

            expect(mockController.updateNotification).not.toHaveBeenCalled();
        });

        it('should return 400 on invalid body (validation middleware)', async () => {
            await request(app)
                .put(`/notifications/${notificationId}`)
                .send({ status: 'INVALID' })
                .expect(400);

            expect(mockController.updateNotification).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /notifications/:notificationId', () => {
        const notificationId = '123e4567-e89b-12d3-a456-426614174000';

        it('should delegate to controller.deleteNotification on valid id', async () => {
            (mockController.deleteNotification as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .delete(`/notifications/${notificationId}`)
                .expect(200);

            expect(mockController.deleteNotification).toHaveBeenCalled();
        });

        it('should return 400 on invalid notificationId', async () => {
            await request(app)
                .delete('/notifications/invalid-id')
                .expect(400);

            expect(mockController.deleteNotification).not.toHaveBeenCalled();
        });
    });
});
