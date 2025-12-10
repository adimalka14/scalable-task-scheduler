import { NotificationRepository } from '../notifications.repository';
import { PrismaClient } from '@prisma/client';
import { CreateNotificationDto, UpdateNotificationDto, Notification } from '../notifications.types';

describe('NotificationRepository', () => {
    let repository: NotificationRepository;
    let mockPrisma: PrismaClient;

    beforeEach(() => {
        mockPrisma = {
            notification: {
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
        } as unknown as PrismaClient;

        repository = new NotificationRepository(mockPrisma);
    });

    describe('create', () => {
        it('should create notification successfully', async () => {
            const dto: CreateNotificationDto = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
            };

            const now = new Date();

            const prismaNotification = {
                id: 'notification-123',
                taskId: dto.taskId,
                type: dto.type,
                status: dto.status,
                message: dto.message,
                sentAt: dto.sentAt,
                createdAt: now,
            };

            (mockPrisma.notification.create as jest.Mock).mockResolvedValue(prismaNotification);

            const result = await repository.create(dto);

            expect(result).toEqual({
                id: 'notification-123',
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: now,
            });
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: dto,
            });
        });

        it('should throw error when prisma fails', async () => {
            const dto: CreateNotificationDto = {
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
            };

            const error = new Error('Database error');
            (mockPrisma.notification.create as jest.Mock).mockRejectedValue(error);

            await expect(repository.create(dto)).rejects.toThrow('Database error');
        });
    });

    describe('update', () => {
        it('should update notification successfully', async () => {
            const notificationId = 'notification-123';
            const dto: UpdateNotificationDto = { status: 'SENT' };
            const now = new Date();

            const prismaNotification = {
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'SENT',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: now,
            };

            (mockPrisma.notification.update as jest.Mock).mockResolvedValue(prismaNotification);

            const result = await repository.update(notificationId, dto);

            expect(result).toEqual({
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'SENT',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: now,
            });
            expect(mockPrisma.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: dto,
            });
        });
    });

    describe('delete', () => {
        it('should delete notification successfully', async () => {
            const notificationId = 'notification-123';

            (mockPrisma.notification.delete as jest.Mock).mockResolvedValue({} as any);

            await repository.delete(notificationId);

            expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
                where: { id: notificationId },
            });
        });
    });

    describe('findById', () => {
        it('should find notification by id successfully', async () => {
            const notificationId = 'notification-123';
            const now = new Date();

            const prismaNotification = {
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: now,
                task: {},
            };

            (mockPrisma.notification.findUnique as jest.Mock).mockResolvedValue(prismaNotification);

            const result = await repository.findById(notificationId);

            expect(result).toEqual({
                id: notificationId,
                taskId: 'task-123',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
                sentAt: new Date('2024-01-01T10:00:00Z'),
                createdAt: now,
            });
            expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId },
                include: { task: true },
            });
        });

        it('should throw error when notification not found', async () => {
            (mockPrisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(repository.findById('non-existing')).rejects.toThrow('Notification with id non-existing not found');
        });
    });

    describe('findByTaskId', () => {
        it('should find notifications by task id successfully', async () => {
            const taskId = 'task-123';
            const now = new Date();

            const prismaNotifications = [
                {
                    id: 'notification-1',
                    taskId,
                    type: 'REMINDER',
                    status: 'PENDING',
                    message: 'Task due soon',
                    sentAt: new Date('2024-01-01T10:00:00Z'),
                    createdAt: now,
                    task: {},
                },
                {
                    id: 'notification-2',
                    taskId,
                    type: 'overdue',
                    status: 'SENT',
                    message: 'Task overdue',
                    sentAt: new Date('2024-01-02T10:00:00Z'),
                    createdAt: now,
                    task: {},
                },
            ];

            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(prismaNotifications);

            const result = await repository.findByTaskId(taskId);

            expect(result).toHaveLength(2);
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                where: { taskId },
                include: { task: true },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findByStatus', () => {
        it('should find notifications by status successfully', async () => {
            const status = 'pending';
            const now = new Date();

            const prismaNotifications = [
                {
                    id: 'notification-1',
                    taskId: 'task-123',
                    type: 'REMINDER',
                    status,
                    message: 'Task due soon',
                    sentAt: new Date('2024-01-01T10:00:00Z'),
                    createdAt: now,
                    task: {},
                },
            ];

            (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(prismaNotifications);

            const result = await repository.findByStatus(status);

            expect(result).toHaveLength(1);
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                where: { status },
                include: { task: true },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
}); 