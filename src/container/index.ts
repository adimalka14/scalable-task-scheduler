import redis from '../shared/config/cache.config';
import { RedisCacheService } from '../shared/cache/cache.service';
import { ICacheService, IEventBus, ISchedulerQueue } from '../shared/interfaces';
import { RabbitEventBus } from '../shared/queue/event-bus';
import { BullScheduler } from '../shared/queue/scheduler';
import { createConnection } from '../shared/config/rabbit';
import { prisma, connectDB } from '../shared/config/db.config';
import { createTasksModule } from '../features/tasks/tasks.module';
import { createNotificationsModule } from '../features/notifications/notifications.module';
import { USE_CACHE } from '../shared/config/env.config';
import logger from '../shared/utils/logger';

export let container: any;

export async function initWorkerContainer() {
    try {
        // Connect to database first
        await connectDB();
        
        // Connect to RabbitMQ
        await createConnection();
        
        // Initialize event bus
        const eventBus = new RabbitEventBus('event-bus') as IEventBus;
        
        // Create task service for worker to update task statuses
        const { TaskRepository } = await import('../features/tasks/tasks.repository');
        const { TaskService } = await import('../features/tasks/tasks.service');
        const repository = new TaskRepository(prisma);
        const taskService = new TaskService(repository);
        
        logger.info('WORKER_CONTAINER', 'Worker container initialized successfully');
        
        return {
            eventBus,
            taskService,
        };
    } catch (error) {
        logger.error('WORKER_CONTAINER', 'Failed to initialize worker container', { error });
        throw error;
    }
}

export async function initContainer() {
    const cacheService = new RedisCacheService(USE_CACHE, redis) as ICacheService;

    await createConnection();
    const eventBus = new RabbitEventBus('event-bus') as IEventBus;

    const schedulerQueue = new BullScheduler() as ISchedulerQueue;

    const tasksModule = await createTasksModule({
        prisma,
        schedulerQueue,
        eventBus,
        cacheService,
    });

    const notificationsModule = await createNotificationsModule({
        prisma,
        eventBus,
    });

    container = {
        cacheService,
        eventBus,
        db: prisma,
        schedulerQueue,
        tasksModule,
        notificationsModule,
    };
}
