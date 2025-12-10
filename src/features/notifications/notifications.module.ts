import { NotificationRepository } from './notifications.repository';
import { NotificationService } from './notifications.service';
import { NotificationFacade } from './notifications.facade';
import { NotificationController } from './notifications.controller';
import { createNotificationRoutes } from './notifications.routes';
import { PrismaClient } from '@prisma/client';
import { IEventBus } from '../../shared/interfaces';

export async function createNotificationsModule(deps: { prisma: PrismaClient; eventBus: IEventBus }) {
    const repository = new NotificationRepository(deps.prisma);
    const service = new NotificationService(repository);
    const facade = new NotificationFacade(service, deps.eventBus);
    await facade.init();
    const controller = new NotificationController(facade);
    const routes = createNotificationRoutes(controller);

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
