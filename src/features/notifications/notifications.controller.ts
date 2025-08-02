import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { INotificationFacade } from './notifications.interfaces';
import { CreateNotificationDto, UpdateNotificationDto } from './notifications.types';
import logger from '../../shared/utils/logger';

export class NotificationController {
    constructor(private notificationFacade: INotificationFacade) {}

    async createNotification(req: Request, res: Response): Promise<void> {
        try {
            const { taskId, type, status, message, sentAt } = req.body;

            const dto: CreateNotificationDto = {
                taskId,
                type,
                status,
                message,
                sentAt: new Date(sentAt),
            };

            const notification = await this.notificationFacade.createNotification(dto);

            logger.info('NOTIFICATION_CTRL', 'Notification created successfully', { 
                notificationId: notification.id, 
                taskId: notification.taskId,
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.CREATED).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            logger.error('NOTIFICATION_CTRL', 'Error creating notification', { 
                error, 
                reqId: req.headers['x-request-id'] 
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async updateNotification(req: Request, res: Response): Promise<void> {
        try {
            const notificationId = req.params.notificationId as string;
            const { type, status, message, sentAt } = req.body as { type?: string; status?: string; message?: string; sentAt?: string };

            const updateData: UpdateNotificationDto = {};
            if (type) updateData.type = type;
            if (status) updateData.status = status;
            if (message) updateData.message = message;
            if (sentAt) updateData.sentAt = new Date(sentAt);

            const notification = await this.notificationFacade.updateNotification(notificationId, updateData);

            logger.info('NOTIFICATION_CTRL', 'Notification updated successfully', { 
                notificationId, 
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            logger.error('NOTIFICATION_CTRL', 'Error updating notification', { 
                error, 
                notificationId: req.params.notificationId,
                reqId: req.headers['x-request-id'] 
            });
            
            if (error instanceof Error && error.message === 'Notification not found') {
                res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Notification not found',
                });
                return;
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async deleteNotification(req: Request, res: Response): Promise<void> {
        try {
            const notificationId = req.params.notificationId as string;

            await this.notificationFacade.deleteNotification(notificationId);

            logger.info('NOTIFICATION_CTRL', 'Notification deleted successfully', { 
                notificationId, 
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Notification deleted successfully',
            });
        } catch (error) {
            logger.error('NOTIFICATION_CTRL', 'Error deleting notification', { 
                error, 
                notificationId: req.params.notificationId,
                reqId: req.headers['x-request-id'] 
            });
            
            if (error instanceof Error && error.message === 'Notification not found') {
                res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Notification not found',
                });
                return;
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async getNotification(req: Request, res: Response): Promise<void> {
        try {
            const notificationId = req.params.notificationId as string;

            const notification = await this.notificationFacade.getNotification(notificationId);

            logger.debug('NOTIFICATION_CTRL', 'Notification retrieved successfully', { 
                notificationId, 
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: notification,
            });
        } catch (error) {
            logger.error('NOTIFICATION_CTRL', 'Error getting notification', { 
                error, 
                notificationId: req.params.notificationId,
                reqId: req.headers['x-request-id'] 
            });
            
            if (error instanceof Error && error.message === 'Notification not found') {
                res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Notification not found',
                });
                return;
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async getTaskNotifications(req: Request, res: Response): Promise<void> {
        try {
            const taskId = req.params.taskId as string;

            const notifications = await this.notificationFacade.getTaskNotifications(taskId);

            logger.debug('NOTIFICATION_CTRL', 'Task notifications retrieved successfully', { 
                taskId, 
                notificationCount: notifications.length,
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: notifications,
            });
        } catch (error) {
            logger.error('NOTIFICATION_CTRL', 'Error getting task notifications', { 
                error, 
                taskId: req.params.taskId,
                reqId: req.headers['x-request-id'] 
            });
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async getNotificationsByStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = req.params.status as string;

            const notifications = await this.notificationFacade.getNotificationsByStatus(status);

            logger.debug('NOTIFICATION_CTRL', 'Notifications by status retrieved successfully', { 
                status, 
                notificationCount: notifications.length,
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: notifications,
            });
        } catch (error) {
            logger.error('NOTIFICATION_CTRL', 'Error getting notifications by status', { 
                error, 
                status: req.params.status,
                reqId: req.headers['x-request-id'] 
            });
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
} 