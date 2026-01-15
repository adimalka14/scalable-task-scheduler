import { RedisConnection, DatabaseConnection, RabbitMQConnection } from '../shared/infrastructure';
import { RedisCacheService } from '../shared/cache/cache.service';
import { ICacheService, IEventBus, ISchedulerQueue } from '../shared/interfaces';
import { RabbitEventBus } from '../shared/queue/event-bus';
import { BullScheduler } from '../shared/queue/scheduler';
import { createTasksModule } from '../features/tasks/tasks.module';
import { createNotificationsModule } from '../features/notifications/notifications.module';
import { USE_CACHE } from '../shared/config/env.config';
import { MetricsService } from '../shared/metrics/metrics.service';
import { HealthService } from '../shared/health/health.service';
import { prismaMetricsMiddleware } from '../shared/metrics/prisma-metrics.middleware';
import logger from '../shared/utils/logger';

export let container: any;

export async function initWorkerContainer() {
    try {
        // Initialize MetricsService first (needed for DB middleware)
        const metricsService = new MetricsService();

        // Infrastructure Connections
        const redisConnection = new RedisConnection();
        const databaseConnection = new DatabaseConnection(undefined, prismaMetricsMiddleware(metricsService));
        const rabbitConnection = new RabbitMQConnection();

        // Connect to database
        await databaseConnection.connect();

        // Connect to RabbitMQ
        await rabbitConnection.createConnection();

        // Initialize event bus
        const eventBus = new RabbitEventBus('event-bus', rabbitConnection) as IEventBus;

        // Create task service for worker to update task statuses
        const { TaskRepository } = await import('../features/tasks/tasks.repository');
        const { TaskService } = await import('../features/tasks/tasks.service');
        const repository = new TaskRepository(databaseConnection.getClient());
        const taskService = new TaskService(repository);

        logger.info('WORKER_CONTAINER', 'Worker container initialized successfully');

        return {
            databaseConnection,
            rabbitConnection,
            redisConnection,
            eventBus,
            taskService,
        };
    } catch (error) {
        logger.error('WORKER_CONTAINER', 'Failed to initialize worker container', { error });
        throw error;
    }
}

export async function initContainer() {
    // Initialize MetricsService first (needed for DB middleware)
    const metricsService = new MetricsService();

    // Infrastructure Connections
    const redisConnection = new RedisConnection();
    const databaseConnection = new DatabaseConnection(undefined, prismaMetricsMiddleware(metricsService));
    const rabbitConnection = new RabbitMQConnection();

    // Connect to RabbitMQ
    await rabbitConnection.createConnection();

    // Shared Services
    const cacheService = new RedisCacheService(
        USE_CACHE,
        redisConnection.getClient(),
        metricsService
    ) as ICacheService;
    const eventBus = new RabbitEventBus('event-bus', rabbitConnection) as IEventBus;
    const schedulerQueue = new BullScheduler(redisConnection.getClient()) as ISchedulerQueue;
    const healthService = new HealthService(
        databaseConnection,
        redisConnection,
        rabbitConnection
    );

    // Feature Modules
    const tasksModule = await createTasksModule({
        prisma: databaseConnection.getClient(),
        schedulerQueue,
        eventBus,
        cacheService,
        metricsService,
    });

    const notificationsModule = await createNotificationsModule({
        prisma: databaseConnection.getClient(),
        eventBus,
    });

    container = {
        // Infrastructure
        redisConnection,
        databaseConnection,
        rabbitConnection,
        // Shared Services
        metricsService,
        cacheService,
        eventBus,
        schedulerQueue,
        healthService,
        // Feature Modules
        tasksModule,
        notificationsModule,
    };

    return container;
}
