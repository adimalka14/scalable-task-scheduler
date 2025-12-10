import { Prisma, PrismaClient, Notification as PrismaNotification } from '@prisma/client';
import { INotificationRepository } from './notifications.interfaces';
import { CreateNotificationDto, UpdateNotificationDto, Notification } from './notifications.types';
import { NotFoundError } from '../../shared/config/errors';

export class NotificationRepository implements INotificationRepository {
    constructor(private prisma: PrismaClient) {}

    async create(dto: CreateNotificationDto): Promise<Notification> {
        const result = (await this.prisma.notification.create({
            data: {
                taskId: dto.taskId,
                type: dto.type,
                status: dto.status,
                message: dto.message,
                sentAt: dto.sentAt,
            },
        })) as PrismaNotification;

        return this.mapPrismaToNotification(result);
    }

    async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        const result = (await this.prisma.notification.update({
            where: { id },
            data: dto,
        })) as PrismaNotification;

        return this.mapPrismaToNotification(result);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.notification.delete({
            where: { id },
        });
    }

    async findById(id: string): Promise<Notification> {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
            include: {
                task: true,
            } as Prisma.NotificationInclude,
        });

        if (!notification) {
            throw new NotFoundError('Notification', id);
        }

        return this.mapPrismaToNotification(notification);
    }

    async findByTaskId(taskId: string): Promise<Notification[]> {
        const notifications = await this.prisma.notification.findMany({
            where: { taskId },
            include: {
                task: true,
            } as Prisma.NotificationInclude,
            orderBy: {
                createdAt: 'desc',
            } as Prisma.NotificationOrderByWithRelationInput,
        });

        return notifications.map((notification) => this.mapPrismaToNotification(notification));
    }

    async findByStatus(status: string): Promise<Notification[]> {
        const notifications = await this.prisma.notification.findMany({
            where: { status },
            include: {
                task: true,
            } as Prisma.NotificationInclude,
            orderBy: {
                createdAt: 'desc',
            } as Prisma.NotificationOrderByWithRelationInput,
        });

        return notifications.map((notification) => this.mapPrismaToNotification(notification));
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
