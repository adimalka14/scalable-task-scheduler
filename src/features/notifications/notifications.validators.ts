import { z } from 'zod';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUS } from './notifications.types';

export const createNotificationSchema = z.object({
    taskId: z.string().uuid('Invalid task ID'),
    type: z.enum([NOTIFICATION_TYPES.REMINDER], {
        message: `Type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`,
    }),
    status: z.enum([NOTIFICATION_STATUS.PENDING, NOTIFICATION_STATUS.SENT], {
        message: `Status must be one of: ${Object.values(NOTIFICATION_STATUS).join(', ')}`,
    }),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

export const updateNotificationSchema = z.object({
    type: z
        .enum([NOTIFICATION_TYPES.REMINDER], {
            message: `Type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`,
        })
        .optional(),
    status: z
        .enum([NOTIFICATION_STATUS.PENDING, NOTIFICATION_STATUS.SENT], {
            message: `Status must be one of: ${Object.values(NOTIFICATION_STATUS).join(', ')}`,
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
    status: z.enum([NOTIFICATION_STATUS.PENDING, NOTIFICATION_STATUS.SENT], {
        message: `Status must be one of: ${Object.values(NOTIFICATION_STATUS).join(', ')}`,
    }),
});
