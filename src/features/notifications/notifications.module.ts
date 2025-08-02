import { NotificationRepository } from './notifications.repository';
import { NotificationService } from './notifications.service';
import { NotificationFacade } from './notifications.facade';
import { NotificationGateway } from './notifications.gateway';
import { NotificationController } from './notifications.controller';
import { createNotificationRoutes } from './notifications.routes';
import { PrismaClient } from '@prisma/client';
import { IEventBus } from '../../shared/interfaces';

export function createNotificationsModule(deps: { prisma: PrismaClient; eventBus: IEventBus }) {
    const repository = new NotificationRepository(deps.prisma);
    const service = new NotificationService(repository);
    const facade = new NotificationFacade(service, deps.eventBus);
    const gateway = new NotificationGateway(facade);
    const controller = new NotificationController(facade);
    const routes = createNotificationRoutes(controller);

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
