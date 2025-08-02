import { RedisCacheService } from '../shared/cache/cache.service';
import { ICacheService, IEventBus, ISchedulerQueue } from '../shared/interfaces';
import { RabbitEventBus } from '../shared/queue/event-bus';
import { createConnection } from '../shared/config/rabbit';
import { createTasksModule } from '../features/tasks/tasks.module';
import { createNotificationsModule } from '../features/notifications/notifications.module';
import Redis from 'ioredis';

const USE_CACHE = process.env.USE_CACHE === 'true';
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export let container: any;

export async function initContainer() {
    const cacheService = new RedisCacheService(USE_CACHE, redis) as ICacheService;

    await createConnection();
    const eventBus = new RabbitEventBus('event-bus') as IEventBus;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const schedulerQueue = {
        scheduleJob: async (queueName: string, jobName: string, data: any, options: any) => {
            console.log(`Scheduling job: ${jobName} in queue: ${queueName}`, data, options);
        },
        cancelJob: async (queueName: string, jobId: string) => {
            console.log(`Cancelling job: ${jobId} in queue: ${queueName}`);
        },
    } as ISchedulerQueue;

    const tasksModule = createTasksModule({
        prisma,
        schedulerQueue,
        eventBus,
    });

    const notificationsModule = createNotificationsModule({
        prisma,
        eventBus,
    });

    container = {
        cacheService,
        eventBus,
        taskService: tasksModule.gateway,
        taskGateway: tasksModule.gateway,
        notificationService: notificationsModule.gateway,
        notificationGateway: notificationsModule.gateway,
        prisma,
        schedulerQueue,
        tasksModule,
        notificationsModule,
    };
}
