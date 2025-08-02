import { z } from 'zod';

export const createNotificationSchema = z.object({
    taskId: z.string().uuid('Invalid task ID'),
    type: z.string().min(1, 'Type is required').max(50, 'Type too long'),
    status: z.string().min(1, 'Status is required').max(20, 'Status too long'),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
    sentAt: z.string().datetime('Invalid date format'),
});

export const updateNotificationSchema = z.object({
    type: z.string().min(1, 'Type is required').max(50, 'Type too long').optional(),
    status: z.string().min(1, 'Status is required').max(20, 'Status too long').optional(),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long').optional(),
    sentAt: z.string().datetime('Invalid date format').optional(),
});

export const notificationIdSchema = z.object({
    notificationId: z.string().uuid('Invalid notification ID'),
});

export const taskIdSchema = z.object({
    taskId: z.string().uuid('Invalid task ID'),
});

export const statusSchema = z.object({
    status: z.string().min(1, 'Status is required').max(20, 'Status too long'),
}); 