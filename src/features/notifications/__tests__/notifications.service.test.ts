import { NotificationService } from '../notifications.service';
import { NotificationRepository } from '../notifications.repository';
import { CreateNotificationDto, UpdateNotificationDto, Notification, NotificationStatus } from '../notifications.types';

describe('NotificationService', () => {
    let service: NotificationService;
    let mockRepository: jest.Mocked<NotificationRepository>;

    beforeEach(() => {
        mockRepository = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByTaskId: jest.fn(),
            findByStatus: jest.fn(),
        } as any;

        service = new NotificationService(mockRepository);
    });

    describe('createNotification', () => {
        it('should create notification successfully', async () => {
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

            mockRepository.create.mockResolvedValue(expectedNotification);

            const result = await service.createNotification(dto);

            expect(result).toEqual(expectedNotification);
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
        });

        it('should throw error when repository fails', async () => {
            const dto: CreateNotificationDto = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
            };

            const error = new Error('Database error');
            mockRepository.create.mockRejectedValue(error);

            await expect(service.createNotification(dto)).rejects.toThrow('Database error');
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('updateNotification', () => {
        it('should update notification successfully', async () => {
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

            mockRepository.update.mockResolvedValue(expectedNotification);

            const result = await service.updateNotification(notificationId, dto);

            expect(result).toEqual(expectedNotification);
            expect(mockRepository.update).toHaveBeenCalledWith(notificationId, dto);
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification successfully', async () => {
            const notificationId = 'notification-123';

            mockRepository.delete.mockResolvedValue();

            await service.deleteNotification(notificationId);

            expect(mockRepository.delete).toHaveBeenCalledWith(notificationId);
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

            mockRepository.findById.mockResolvedValue(expectedNotification);

            const result = await service.getNotification(notificationId);

            expect(result).toEqual(expectedNotification);
            expect(mockRepository.findById).toHaveBeenCalledWith(notificationId);
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

            mockRepository.findByTaskId.mockResolvedValue(expectedNotifications);

            const result = await service.getTaskNotifications(taskId);

            expect(result).toEqual(expectedNotifications);
            expect(mockRepository.findByTaskId).toHaveBeenCalledWith(taskId);
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

            mockRepository.findByStatus.mockResolvedValue(expectedNotifications);

            const result = await service.getNotificationsByStatus(status);

            expect(result).toEqual(expectedNotifications);
            expect(mockRepository.findByStatus).toHaveBeenCalledWith(status);
        });
    });
}); 