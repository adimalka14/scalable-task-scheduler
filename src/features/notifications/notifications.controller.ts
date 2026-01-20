import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { INotificationFacade } from './notifications.interfaces';
import {
    CreateNotificationDto,
    NotificationStatus,
    NotificationType,
    UpdateNotificationDto,
} from './notifications.types';

export class NotificationController {
    constructor(private notificationFacade: INotificationFacade) { }

    async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { taskId, type, status, message } = req.body;

            const dto: CreateNotificationDto = {
                taskId,
                type,
                status,
                message,
                sentAt: new Date(),
            };

            const notification = await this.notificationFacade.createNotification(dto);

            res.status(StatusCodes.CREATED).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const notificationId = req.params.notificationId as string;
            const { type, status, message } = req.body as {
                type?: NotificationType;
                status?: NotificationStatus;
                message?: string;
            };

            const updateData: UpdateNotificationDto = {};
            if (type) updateData.type = type;
            if (status) updateData.status = status;
            if (message) updateData.message = message;
            updateData.sentAt = new Date();

            const notification = await this.notificationFacade.updateNotification(notificationId, updateData);

            res.status(StatusCodes.OK).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const notificationId = req.params.notificationId as string;

            await this.notificationFacade.deleteNotification(notificationId);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Notification deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const notificationId = req.params.notificationId as string;

            const notification = await this.notificationFacade.getNotification(notificationId);

            res.status(StatusCodes.OK).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTaskNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const taskId = req.params.taskId as string;

            const notifications = await this.notificationFacade.getTaskNotifications(taskId);

            res.status(StatusCodes.OK).json({
                success: true,
                data: notifications,
            });
        } catch (error) {
            next(error);
        }
    }

    async getNotificationsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status as NotificationStatus;

            const notifications = await this.notificationFacade.getNotificationsByStatus(status);

            res.status(StatusCodes.OK).json({
                success: true,
                data: notifications,
            });
        } catch (error) {
            next(error);
        }
    }
}
