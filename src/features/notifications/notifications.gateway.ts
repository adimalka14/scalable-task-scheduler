import { INotificationGateway, INotificationFacade } from './notifications.interfaces';
import { Notification } from './notifications.types';

export class NotificationGateway implements INotificationGateway {
    constructor(private facade: INotificationFacade) {}

    async getNotification(id: string): Promise<Notification> {
        return this.facade.getNotification(id);
    }

    async getTaskNotifications(taskId: string): Promise<Notification[]> {
        return this.facade.getTaskNotifications(taskId);
    }
} 