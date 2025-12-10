import redis from '../shared/config/cache.config';
import { RedisCacheService } from '../shared/cache/cache.service';
import { ICacheService, IEventBus, ISchedulerQueue } from '../shared/interfaces';
import { RabbitEventBus } from '../shared/queue/event-bus';
import { BullScheduler } from '../shared/queue/scheduler';
import { createConnection } from '../shared/config/rabbit';
import { prisma } from '../shared/config/db.config';
import { createTasksModule } from '../features/tasks/tasks.module';
import { createNotificationsModule } from '../features/notifications/notifications.module';
import { USE_CACHE } from '../shared/config/env.config';

export let container: any;

export async function initWorkerContainer() {
    await createConnection();
    const eventBus = new RabbitEventBus('event-bus') as IEventBus;
    return {
        eventBus,
    };
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
