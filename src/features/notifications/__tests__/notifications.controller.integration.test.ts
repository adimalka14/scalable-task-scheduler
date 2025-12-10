import { NotificationController } from '../notifications.controller';
import { NotificationFacade } from '../notifications.facade';
import { CreateNotificationDto, UpdateNotificationDto, Notification, NotificationStatus } from '../notifications.types';
import { Request, Response } from 'express';

describe('NotificationController Integration', () => {
    let controller: NotificationController;
    let mockFacade: jest.Mocked<NotificationFacade>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;

    beforeEach(() => {
        mockFacade = {
            createNotification: jest.fn(),
            updateNotification: jest.fn(),
            deleteNotification: jest.fn(),
            getNotification: jest.fn(),
            getTaskNotifications: jest.fn(),
            getNotificationsByStatus: jest.fn(),
        } as any;

        responseJson = jest.fn();
        responseStatus = jest.fn().mockReturnValue({ json: responseJson });

        mockResponse = {
            status: responseStatus,
            json: responseJson,
        } as any;

        controller = new NotificationController(mockFacade);
    });

    describe('createNotification', () => {
        it('should create notification successfully', async () => {
            const notificationData = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
            };

            const expectedNotification: Notification = {
                id: 'notification-123',
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date(),
                createdAt: new Date(),
            };

            mockRequest = {
                body: notificationData,
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.createNotification.mockResolvedValue(expectedNotification);

            await controller.createNotification(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.createNotification).toHaveBeenCalledWith({
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: expect.any(Date),
            });
            expect(responseStatus).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedNotification,
            });
        });

        it('should handle facade error', async () => {
            const notificationData = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: '2024-01-01T10:00:00Z',
            };

            mockRequest = {
                body: notificationData,
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Database error');
            mockFacade.createNotification.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.createNotification(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
            expect(responseJson).not.toHaveBeenCalled();
        });
    });

    describe('updateNotification', () => {
        it('should update notification successfully', async () => {
            const notificationId = 'notification-123';
            const updateData = {
                status: 'SENT',
            };

            const expectedNotification: Notification = {
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'SENT',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: new Date(),
            };

            mockRequest = {
                params: { notificationId },
                body: updateData,
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.updateNotification.mockResolvedValue(expectedNotification);

            await controller.updateNotification(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.updateNotification).toHaveBeenCalledWith(notificationId, {
                status: 'SENT',
                sentAt: expect.any(Date),
            });
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedNotification,
            });
        });

        it('should handle notification not found error', async () => {
            const notificationId = 'notification-123';
            const updateData = {
                status: 'SENT',
            };

            mockRequest = {
                params: { notificationId },
                body: updateData,
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Notification not found');
            (error as any).status = 404;
            mockFacade.updateNotification.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.updateNotification(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
            expect(responseJson).not.toHaveBeenCalled();
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification successfully', async () => {
            const notificationId = 'notification-123';

            mockRequest = {
                params: { notificationId },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.deleteNotification.mockResolvedValue();

            await controller.deleteNotification(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.deleteNotification).toHaveBeenCalledWith(notificationId);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                message: 'Notification deleted successfully',
            });
        });
    });

    describe('getNotification', () => {
        it('should get notification successfully', async () => {
            const notificationId = 'notification-123';
            const expectedNotification: Notification = {
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: new Date(),
            };

            mockRequest = {
                params: { notificationId },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.getNotification.mockResolvedValue(expectedNotification);

            await controller.getNotification(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.getNotification).toHaveBeenCalledWith(notificationId);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedNotification,
            });
        });
    });

    describe('getTaskNotifications', () => {
        it('should get task notifications successfully', async () => {
            const taskId = 'task-123';
            const expectedNotifications: Notification[] = [
                {
                    id: 'notification-1',
                    taskId,
                    type: 'REMINDER',
                    status: 'PENDING',
                    message: 'Task due soon',
                    sentAt: new Date('2024-01-01T10:00:00Z'),
                    createdAt: new Date(),
                },
                {
                    id: 'notification-2',
                    taskId,
                    type: 'REMINDER',
                    status: 'SENT',
                    message: 'Task overdue',
                    sentAt: new Date('2024-01-02T10:00:00Z'),
                    createdAt: new Date(),
                },
            ];

            mockRequest = {
                params: { taskId },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.getTaskNotifications.mockResolvedValue(expectedNotifications);

            await controller.getTaskNotifications(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.getTaskNotifications).toHaveBeenCalledWith(taskId);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedNotifications,
            });
        });
    });

    describe('getNotificationsByStatus', () => {
        it('should get notifications by status successfully', async () => {
            const status: NotificationStatus = 'PENDING';
            const expectedNotifications: Notification[] = [
                {
                    id: 'notification-1',
                    taskId: 'task-123',
                    type: 'REMINDER',
                    status,
                    message: 'Task due soon',
                    sentAt: new Date('2024-01-01T10:00:00Z'),
                    createdAt: new Date(),
                },
            ];

            mockRequest = {
                params: { status },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.getNotificationsByStatus.mockResolvedValue(expectedNotifications);

            await controller.getNotificationsByStatus(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.getNotificationsByStatus).toHaveBeenCalledWith(status);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedNotifications,
            });
        });
    });
});
