import { INotificationService, INotificationRepository } from './notifications.interfaces';
import { CreateNotificationDto, UpdateNotificationDto, Notification } from './notifications.types';
import logger from '../../shared/utils/logger';

export class NotificationService implements INotificationService {
    constructor(private repository: INotificationRepository) {}

    async createNotification(dto: CreateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.repository.create(dto);
            logger.info('NOTIFICATION_SVC', 'Notification created successfully', { notificationId: notification.id });
            return notification;
        } catch (error) {
            logger.error('NOTIFICATION_SVC', 'Error creating notification', { error });
            throw error;
        }
    }

    async updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        try {
            const notification = await this.repository.update(id, dto);
            logger.info('NOTIFICATION_SVC', 'Notification updated successfully', { notificationId: id });
            return notification;
        } catch (error) {
            logger.error('NOTIFICATION_SVC', 'Error updating notification', { error, notificationId: id });
            throw error;
        }
    }

    async deleteNotification(id: string): Promise<void> {
        try {
            await this.repository.delete(id);
            logger.info('NOTIFICATION_SVC', 'Notification deleted successfully', { notificationId: id });
        } catch (error) {
            logger.error('NOTIFICATION_SVC', 'Error deleting notification', { error, notificationId: id });
            throw error;
        }
    }

    async getNotification(id: string): Promise<Notification> {
        try {
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('NOTIFICATION_SVC', 'Error getting notification', { error, notificationId: id });
            throw error;
        }
    }

    async getTaskNotifications(taskId: string): Promise<Notification[]> {
        try {
            const notifications = await this.repository.findByTaskId(taskId);
            logger.debug('NOTIFICATION_SVC', 'Task notifications retrieved', { taskId, notificationCount: notifications.length });
            return notifications;
        } catch (error) {
            logger.error('NOTIFICATION_SVC', 'Error getting task notifications', { error, taskId });
            throw error;
        }
    }

    async getNotificationsByStatus(status: string): Promise<Notification[]> {
        try {
            const notifications = await this.repository.findByStatus(status);
            logger.debug('NOTIFICATION_SVC', 'Notifications by status retrieved', { status, notificationCount: notifications.length });
            return notifications;
        } catch (error) {
            logger.error('NOTIFICATION_SVC', 'Error getting notifications by status', { error, status });
            throw error;
        }
    }
} 