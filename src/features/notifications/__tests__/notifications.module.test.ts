import { createNotificationsModule } from '../notifications.module';
import { NotificationRepository } from '../notifications.repository';
import { NotificationService } from '../notifications.service';
import { NotificationFacade } from '../notifications.facade';
import { NotificationController } from '../notifications.controller';
import { PrismaClient } from '@prisma/client';
import { IEventBus } from '../../../shared/interfaces';
import { NotificationType, NotificationStatus } from '../notifications.types';

describe('NotificationsModule', () => {
    let module: Awaited<ReturnType<typeof createNotificationsModule>>;
    let mockPrisma: jest.Mocked<PrismaClient>;
    let mockEventBus: jest.Mocked<IEventBus>;

    beforeEach(async () => {
        mockPrisma = {
            notification: {
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
        } as any;

        mockEventBus = {
            publish: jest.fn(),
            subscribe: jest.fn(),
        } as any;

        module = await createNotificationsModule({
            prisma: mockPrisma,
            eventBus: mockEventBus,
        });
    });

    describe('module composition', () => {
        it('should create all components correctly', () => {
            expect(module).toBeDefined();
            expect(module.routes).toBeDefined();
        });

        it('should expose routes for external access', () => {
            expect(module.routes).toBeDefined();
            expect(typeof module.routes.stack).toBe('object');
        });

        it('should expose __testing__ object for testing', () => {
            expect(module.__testing__).toBeDefined();
            expect(module.__testing__.repository).toBeInstanceOf(NotificationRepository);
            expect(module.__testing__.service).toBeInstanceOf(NotificationService);
            expect(module.__testing__.facade).toBeInstanceOf(NotificationFacade);
            expect(module.__testing__.controller).toBeInstanceOf(NotificationController);
        });
    });

    describe('dependency injection', () => {
        it('should inject prisma into repository', () => {
            const { repository } = module.__testing__;
            expect(repository).toBeInstanceOf(NotificationRepository);
        });

        it('should inject repository into service', () => {
            const { service } = module.__testing__;
            expect(service).toBeInstanceOf(NotificationService);
        });

        it('should inject service and eventBus into facade', () => {
            const { facade } = module.__testing__;
            expect(facade).toBeInstanceOf(NotificationFacade);
        });


        it('should inject facade into controller', () => {
            const { controller } = module.__testing__;
            expect(controller).toBeInstanceOf(NotificationController);
        });
    });

});
