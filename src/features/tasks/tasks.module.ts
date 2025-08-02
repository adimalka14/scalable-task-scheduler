import { TaskRepository } from './tasks.repository';
import { TaskService } from './tasks.service';
import { TaskFacade } from './tasks.facade';
import { TaskGateway } from './tasks.gateway';
import { TaskController } from './tasks.controller';
import { createTaskRoutes } from './tasks.routes';
import { PrismaClient } from '@prisma/client';
import { ISchedulerQueue, IEventBus } from '../../shared/interfaces';

export function createTasksModule(deps: {
    prisma: PrismaClient;
    schedulerQueue: ISchedulerQueue;
    eventBus: IEventBus;
}) {
    const repository = new TaskRepository(deps.prisma);
    const service = new TaskService(repository);
    const facade = new TaskFacade(service, deps.schedulerQueue, deps.eventBus);
    const gateway = new TaskGateway(facade);
    const controller = new TaskController(facade);
    const routes = createTaskRoutes(controller);

    return {
        gateway,
        routes,
        __testing__: {
            repository,
            service,
            facade,
            controller,
        },
    };
}
