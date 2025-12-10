import { INotificationService, INotificationRepository } from './notifications.interfaces';
import { CreateNotificationDto, UpdateNotificationDto, Notification } from './notifications.types';

export class NotificationService implements INotificationService {
    constructor(private repository: INotificationRepository) {}

    async createNotification(dto: CreateNotificationDto): Promise<Notification> {
        return this.repository.create(dto);
    }

    async updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        return this.repository.update(id, dto);
    }

    async deleteNotification(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async getNotification(id: string): Promise<Notification> {
        return this.repository.findById(id);
    }

    async getTaskNotifications(taskId: string): Promise<Notification[]> {
        return this.repository.findByTaskId(taskId);
    }

    async getNotificationsByStatus(status: string): Promise<Notification[]> {
        return this.repository.findByStatus(status);
    }
} 