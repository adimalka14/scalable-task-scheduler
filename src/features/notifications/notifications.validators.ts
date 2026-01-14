import { z } from 'zod';
import { NotificationType, NotificationStatus } from './notifications.types';

export const createNotificationSchema = z.object({
    taskId: z.string().uuid('Invalid task ID'),
    type: z.nativeEnum(NotificationType, {
        message: `Type must be one of: ${Object.values(NotificationType).join(', ')}`,
    }),
    status: z.nativeEnum(NotificationStatus, {
        message: `Status must be one of: ${Object.values(NotificationStatus).join(', ')}`,
    }),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

export const updateNotificationSchema = z.object({
    type: z
        .nativeEnum(NotificationType, {
            message: `Type must be one of: ${Object.values(NotificationType).join(', ')}`,
        })
        .optional(),
    status: z
        .nativeEnum(NotificationStatus, {
            message: `Status must be one of: ${Object.values(NotificationStatus).join(', ')}`,
        })
        .optional(),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long').optional(),
});

export const notificationIdSchema = z.object({
    notificationId: z.string().uuid('Invalid notification ID'),
});

export const taskIdSchema = z.object({
    taskId: z.string().uuid('Invalid task ID'),
});

export const statusSchema = z.object({
    status: z.nativeEnum(NotificationStatus, {
        message: `Status must be one of: ${Object.values(NotificationStatus).join(', ')}`,
    }),
});
