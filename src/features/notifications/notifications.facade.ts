import { INotificationFacade, INotificationService } from './notifications.interfaces';
import {
    CreateNotificationDto,
    UpdateNotificationDto,
    Notification,
    TaskTimedArrivalEvent,
    NOTIFICATION_TYPES,
    NOTIFICATION_STATUS,
} from './notifications.types';
import { IEventBus } from '../../shared/interfaces';
import { EVENTS } from '../../shared/queue/queue.constants';
import logger from '../../shared/utils/logger';

export class NotificationFacade implements INotificationFacade {
    constructor(
        private service: INotificationService,
        private eventBus: IEventBus,
    ) {}

    async init() {
        await this.eventBus.subscribe(
            EVENTS.EVENT_BUS_QUEUE.TASK_TIMED_ARRIVAL,
            async (data: TaskTimedArrivalEvent) => {
                logger.silly('NOTIFICATION_FACADE', 'Notification facade received task timed arrival', data);

                const dto: CreateNotificationDto = {
                    taskId: data.taskId,
                    type: NOTIFICATION_TYPES.REMINDER,
                    status: NOTIFICATION_STATUS.PENDING,
                    message: `Reminder for task ${data.taskId}`,
                    sentAt: new Date(),
                };

                await this.createNotification(dto);
            },
        );
    }

    async createNotification(dto: CreateNotificationDto): Promise<Notification> {
        const notification = await this.service.createNotification(dto);

        await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_CREATED, {
            notificationId: notification.id,
            taskId: notification.taskId,
            type: notification.type,
            status: notification.status,
            message: notification.message,
        });

        logger.info('NOTIFICATION_FACADE', 'Notification facade created notification successfully', {
            notificationId: notification.id,
        });
        return notification;
    }

    async updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        const notification = await this.service.updateNotification(id, dto);

        await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_UPDATED, {
            notificationId: notification.id,
            taskId: notification.taskId,
            type: notification.type,
            status: notification.status,
            message: notification.message,
        });

        logger.info('NOTIFICATION_FACADE', 'Notification facade updated notification successfully', {
            notificationId: id,
        });
        return notification;
    }

    async deleteNotification(id: string): Promise<void> {
        await this.service.deleteNotification(id);
        await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.NOTIFICATION_DELETED, {
            notificationId: id,
        });

        logger.info('NOTIFICATION_FACADE', 'Notification facade deleted notification successfully', {
            notificationId: id,
        });
    }

    async getNotification(id: string): Promise<Notification> {
        return await this.service.getNotification(id);
    }

    async getTaskNotifications(taskId: string): Promise<Notification[]> {
        return await this.service.getTaskNotifications(taskId);
    }

    async getNotificationsByStatus(status: string): Promise<Notification[]> {
        return await this.service.getNotificationsByStatus(status);
    }
}
