import { TaskRepository } from './tasks.repository';
import { TaskService } from './tasks.service';
import { TaskFacade } from './tasks.facade';
import { TaskController } from './tasks.controller';
import { createTaskRoutes } from './tasks.routes';
import { PrismaClient } from '@prisma/client';
import { ISchedulerQueue, IEventBus, ICacheService } from '../../shared/interfaces';
import type { MetricsService } from '../../shared/metrics/metrics.service';

export async function createTasksModule(deps: {
    prisma: PrismaClient;
    schedulerQueue: ISchedulerQueue;
    eventBus: IEventBus;
    cacheService: ICacheService;
    metricsService?: MetricsService;
}) {
    const repository = new TaskRepository(deps.prisma, deps.metricsService);
    const service = new TaskService(repository);
    const facade = new TaskFacade(service, deps.schedulerQueue, deps.eventBus, deps.cacheService);
    const controller = new TaskController(facade);
    const routes = createTaskRoutes(controller);

    return {
        routes,
        __testing__: {
            repository,
            service,
            facade,
            controller,
        },
    };
}
