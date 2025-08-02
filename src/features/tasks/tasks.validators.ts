import { z } from 'zod';

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    dueDate: z.string().datetime('Invalid date format'),
    userId: z.string().uuid('Invalid user ID'),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    dueDate: z.string().datetime('Invalid date format').optional(),
});

export const taskIdSchema = z.object({
    taskId: z.string().uuid('Invalid task ID'),
});

export const userIdSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
}); 