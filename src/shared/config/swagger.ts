import path from 'path';
import { PORT } from './env.config';

export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Scalable Task Scheduler API',
            version: '1.0.0',
            description: 'Event-driven reminders & notifications demo (Redis + BullMQ + RabbitMQ + Prisma)',
        },
        tags: [
            {
                name: 'Tasks',
                description: 'Task management endpoints',
            },
            {
                name: 'Notifications',
                description: 'Notification management endpoints',
            },
            {
                name: 'Health',
                description: 'Health check endpoints',
            },
        ],
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Task: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Task unique identifier',
                            example: '7cf4cbf6-c06b-492b-bfdd-44574af451',
                        },
                        title: {
                            type: 'string',
                            description: 'Task title',
                            example: 'Complete project documentation',
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Task due date',
                            example: '2025-12-25T10:00:00Z',
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID who owns the task',
                            example: 'user-123',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Task creation timestamp',
                            example: '2025-12-10T15:00:00.000Z',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Task last update timestamp',
                            example: '2025-12-10T15:00:00.000Z',
                        },
                    },
                    required: ['id', 'title', 'dueDate', 'userId', 'createdAt', 'updatedAt'],
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Notification unique identifier',
                            example: 'notif-123',
                        },
                        taskId: {
                            type: 'string',
                            description: 'Associated task ID',
                            example: '7cf4cbf6-c06b-492b-bfdd-44574af451',
                        },
                        type: {
                            type: 'string',
                            description: 'Notification type',
                            example: 'REMINDER',
                            enum: ['REMINDER'],
                        },
                        status: {
                            type: 'string',
                            description: 'Notification status',
                            example: 'PENDING',
                            enum: ['PENDING', 'SENT'],
                        },
                        message: {
                            type: 'string',
                            description: 'Notification message',
                            example: 'Reminder for task 7cf4cbf6-c06b-492b-bfdd-44574af451',
                        },
                        sentAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the notification was sent',
                            example: '2025-12-10T15:00:00Z',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Notification creation timestamp',
                            example: '2025-12-10T15:00:00.000Z',
                        },
                    },
                    required: ['id', 'taskId', 'type', 'status', 'message', 'sentAt', 'createdAt'],
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error name',
                            example: 'NotFoundError',
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                            example: 'Task with id 123 not found',
                        },
                    },
                },
            },
        },
    },
    apis: [
        path.join(__dirname, '../../routes/**/*.ts'),
        path.join(__dirname, '../../features/**/*.routes.ts'),
    ],
};
