import { NotificationFacade } from '../notifications.facade';
import { NotificationService } from '../notifications.service';
import { IEventBus } from '../../../shared/interfaces';
import { CreateNotificationDto, UpdateNotificationDto, Notification, NotificationStatus } from '../notifications.types';
import { EVENTS } from '../../../shared/queue/queue.constants';

describe('NotificationFacade', () => {
    let facade: NotificationFacade;
    let mockService: jest.Mocked<NotificationService>;
    let mockEventBus: jest.Mocked<IEventBus>;

    beforeEach(() => {
        mockService = {
            createNotification: jest.fn(),
            updateNotification: jest.fn(),
            deleteNotification: jest.fn(),
            getNotification: jest.fn(),
            getTaskNotifications: jest.fn(),
            getNotificationsByStatus: jest.fn(),
        } as any;

        mockEventBus = {
            publish: jest.fn(),
        } as any;

        facade = new NotificationFacade(mockService, mockEventBus);
    });

    describe('createNotification', () => {
        it('should create notification and publish event successfully', async () => {
            const dto: CreateNotificationDto = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
            };

            const expectedNotification: Notification = {
                id: 'notification-123',
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: new Date(),
            };

            mockService.createNotification.mockResolvedValue(expectedNotification);
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.createNotification(dto);

            expect(result).toEqual(expectedNotification);
            expect(mockService.createNotification).toHaveBeenCalledWith(dto);
            expect(mockEventBus.publish).toHaveBeenCalledWith(
                EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_CREATED,
                {
                    notificationId: 'notification-123',
                    taskId: 'task-123',
                    type: 'REMINDER',
                    status: 'PENDING',
                    message: 'Task due soon',
                }
            );
        });

        it('should throw error when service fails', async () => {
            const dto: CreateNotificationDto = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
            };

            const error = new Error('Service error');
            mockService.createNotification.mockRejectedValue(error);

            await expect(facade.createNotification(dto)).rejects.toThrow('Service error');
            expect(mockEventBus.publish).not.toHaveBeenCalled();
        });
    });

    describe('updateNotification', () => {
        it('should update notification and publish event successfully', async () => {
            const notificationId = 'notification-123';
            const dto: UpdateNotificationDto = { status: 'SENT' };

            const expectedNotification: Notification = {
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'SENT',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: new Date(),
            };

            mockService.updateNotification.mockResolvedValue(expectedNotification);
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.updateNotification(notificationId, dto);

            expect(result).toEqual(expectedNotification);
            expect(mockService.updateNotification).toHaveBeenCalledWith(notificationId, dto);
            expect(mockEventBus.publish).toHaveBeenCalledWith(
                EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_UPDATED,
                {
                    notificationId: 'notification-123',
                    taskId: 'task-123',
                    type: 'REMINDER',
                    status: 'SENT',
                    message: 'Task due soon',
                }
            );
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification and publish event successfully', async () => {
            const notificationId = 'notification-123';

            mockService.deleteNotification.mockResolvedValue();
            mockEventBus.publish.mockResolvedValue();

            await facade.deleteNotification(notificationId);

            expect(mockService.deleteNotification).toHaveBeenCalledWith(notificationId);
            expect(mockEventBus.publish).toHaveBeenCalledWith(
                EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_DELETED,
                { notificationId }
            );
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

            mockService.getNotification.mockResolvedValue(expectedNotification);

            const result = await facade.getNotification(notificationId);

            expect(result).toEqual(expectedNotification);
            expect(mockService.getNotification).toHaveBeenCalledWith(notificationId);
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
            ];

            mockService.getTaskNotifications.mockResolvedValue(expectedNotifications);

            const result = await facade.getTaskNotifications(taskId);

            expect(result).toEqual(expectedNotifications);
            expect(mockService.getTaskNotifications).toHaveBeenCalledWith(taskId);
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
                    status: status as NotificationStatus,
                    message: 'Task due soon',
                    sentAt: new Date('2024-01-01T10:00:00Z'),
                    createdAt: new Date(),
                },
            ];

            mockService.getNotificationsByStatus.mockResolvedValue(expectedNotifications);

            const result = await facade.getNotificationsByStatus(status);

            expect(result).toEqual(expectedNotifications);
            expect(mockService.getNotificationsByStatus).toHaveBeenCalledWith(status);
        });
    });
}); 