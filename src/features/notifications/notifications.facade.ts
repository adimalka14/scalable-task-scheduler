import { INotificationFacade, INotificationService } from './notifications.interfaces';
import { CreateNotificationDto, UpdateNotificationDto, Notification } from './notifications.types';
import { IEventBus } from '../../shared/interfaces';
import { EVENTS } from '../../shared/queue/queue.constants';
import logger from '../../shared/utils/logger';

export class NotificationFacade implements INotificationFacade {
    constructor(
        private service: INotificationService,
        private eventBus: IEventBus
    ) {}

    async createNotification(dto: CreateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.service.createNotification(dto);

            await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_CREATED, {
                notificationId: notification.id,
                taskId: notification.taskId,
                type: notification.type,
                status: notification.status,
                message: notification.message,
            });

            logger.info('NOTIFICATION_FACADE', 'Notification facade created notification successfully', { notificationId: notification.id });
            return notification;
        } catch (error) {
            logger.error('NOTIFICATION_FACADE', 'Error in notification facade createNotification', { error });
            throw error;
        }
    }

    async updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.service.updateNotification(id, dto);

            await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_UPDATED, {
                notificationId: notification.id,
                taskId: notification.taskId,
                type: notification.type,
                status: notification.status,
                message: notification.message,
            });

            logger.info('NOTIFICATION_FACADE', 'Notification facade updated notification successfully', { notificationId: id });
            return notification;
        } catch (error) {
            logger.error('NOTIFICATION_FACADE', 'Error in notification facade updateNotification', { error, notificationId: id });
            throw error;
        }
    }

    async deleteNotification(id: string): Promise<void> {
        try {
            await this.service.deleteNotification(id);

            await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_DELETED, {
                notificationId: id,
            });

            logger.info('NOTIFICATION_FACADE', 'Notification facade deleted notification successfully', { notificationId: id });
        } catch (error) {
            logger.error('NOTIFICATION_FACADE', 'Error in notification facade deleteNotification', { error, notificationId: id });
            throw error;
        }
    }

    async getNotification(id: string): Promise<Notification> {
        try {
            return await this.service.getNotification(id);
        } catch (error) {
            logger.error('NOTIFICATION_FACADE', 'Error in notification facade getNotification', { error, notificationId: id });
            throw error;
        }
    }

    async getTaskNotifications(taskId: string): Promise<Notification[]> {
        try {
            return await this.service.getTaskNotifications(taskId);
        } catch (error) {
            logger.error('NOTIFICATION_FACADE', 'Error in notification facade getTaskNotifications', { error, taskId });
            throw error;
        }
    }

    async getNotificationsByStatus(status: string): Promise<Notification[]> {
        try {
            return await this.service.getNotificationsByStatus(status);
        } catch (error) {
            logger.error('NOTIFICATION_FACADE', 'Error in notification facade getNotificationsByStatus', { error, status });
            throw error;
        }
    }
} 