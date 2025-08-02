import { PrismaClient, Notification as PrismaNotification } from '@prisma/client';
import { INotificationRepository } from './notifications.interfaces';
import { CreateNotificationDto, UpdateNotificationDto, Notification } from './notifications.types';
import logger from '../../shared/utils/logger';

export class NotificationRepository implements INotificationRepository {
    constructor(private prisma: PrismaClient) {}

    async create(dto: CreateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.prisma.notification.create({
                data: {
                    taskId: dto.taskId,
                    type: dto.type,
                    status: dto.status,
                    message: dto.message,
                    sentAt: dto.sentAt,
                },
            }) as PrismaNotification;

            return this.mapPrismaToNotification(notification);
        } catch (error) {
            logger.error('NOTIFICATION_REPO', 'Error creating notification in repository', { error });
            throw error;
        }
    }

    async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.prisma.notification.update({
                where: { id },
                data: dto,
            }) as PrismaNotification;

            return this.mapPrismaToNotification(notification);
        } catch (error) {
            logger.error('NOTIFICATION_REPO', 'Error updating notification in repository', { error, notificationId: id });
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.prisma.notification.delete({
                where: { id },
            });
        } catch (error) {
            logger.error('NOTIFICATION_REPO', 'Error deleting notification in repository', { error, notificationId: id });
            throw error;
        }
    }

    async findById(id: string): Promise<Notification> {
        try {
            const notification = await this.prisma.notification.findUnique({
                where: { id },
                include: {
                    task: true,
                },
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            return this.mapPrismaToNotification(notification);
        } catch (error) {
            logger.error('NOTIFICATION_REPO', 'Error finding notification by id in repository', { error, notificationId: id });
            throw error;
        }
    }

    async findByTaskId(taskId: string): Promise<Notification[]> {
        try {
            const notifications = await this.prisma.notification.findMany({
                where: { taskId },
                include: {
                    task: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return notifications.map(notification => this.mapPrismaToNotification(notification));
        } catch (error) {
            logger.error('NOTIFICATION_REPO', 'Error finding notifications by task id in repository', { error, taskId });
            throw error;
        }
    }

    async findByStatus(status: string): Promise<Notification[]> {
        try {
            const notifications = await this.prisma.notification.findMany({
                where: { status },
                include: {
                    task: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return notifications.map(notification => this.mapPrismaToNotification(notification));
        } catch (error) {
            logger.error('NOTIFICATION_REPO', 'Error finding notifications by status in repository', { error, status });
            throw error;
        }
    }

    private mapPrismaToNotification(prismaNotification: any): Notification {
        return {
            id: prismaNotification.id,
            taskId: prismaNotification.taskId,
            type: prismaNotification.type,
            status: prismaNotification.status,
            message: prismaNotification.message,
            sentAt: prismaNotification.sentAt,
            createdAt: prismaNotification.createdAt,
        };
    }
} 