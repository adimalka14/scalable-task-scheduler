import { createTasksModule } from '../tasks.module';
import { TaskRepository } from '../tasks.repository';
import { TaskService } from '../tasks.service';
import { TaskFacade } from '../tasks.facade';
import { TaskGateway } from '../tasks.gateway';
import { TaskController } from '../tasks.controller';
import { PrismaClient } from '@prisma/client';
import { ISchedulerQueue, IEventBus } from '../../../shared/interfaces';

describe('TasksModule', () => {
    let module: ReturnType<typeof createTasksModule>;
    let mockPrisma: jest.Mocked<PrismaClient>;
    let mockSchedulerQueue: jest.Mocked<ISchedulerQueue>;
    let mockEventBus: jest.Mocked<IEventBus>;

    beforeEach(() => {
        mockPrisma = {
            task: {
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            notification: {
                deleteMany: jest.fn(),
            },
        } as any;

        mockSchedulerQueue = {
            scheduleJob: jest.fn(),
            cancelJob: jest.fn(),
        } as any;

        mockEventBus = {
            publish: jest.fn(),
        } as any;

        module = createTasksModule({
            prisma: mockPrisma,
            schedulerQueue: mockSchedulerQueue,
            eventBus: mockEventBus,
        });
    });

    describe('module composition', () => {
        it('should create all components correctly', () => {
            expect(module).toBeDefined();
            expect(module.gateway).toBeInstanceOf(TaskGateway);
            expect(module.routes).toBeDefined();
        });

        it('should expose gateway for internal access', () => {
            expect(module.gateway).toBeDefined();
            expect(typeof module.gateway.getTask).toBe('function');
        });

        it('should expose routes for external access', () => {
            expect(module.routes).toBeDefined();
            expect(typeof module.routes.stack).toBe('object');
        });
    });

    describe('dependency injection', () => {
        it('should inject prisma into repository', () => {
            const { repository } = module.__testing__;
            expect(repository).toBeInstanceOf(TaskRepository);
        });

        it('should inject repository into service', () => {
            const { service } = module.__testing__;
            expect(service).toBeInstanceOf(TaskService);
        });

        it('should inject service, scheduler, and eventBus into facade', () => {
            const { facade } = module.__testing__;
            expect(facade).toBeInstanceOf(TaskFacade);
        });

        it('should inject facade into controller', () => {
            const { controller } = module.__testing__;
            expect(controller).toBeInstanceOf(TaskController);
        });

        it('should inject facade into gateway', () => {
            expect(module.gateway).toBeInstanceOf(TaskGateway);
        });
    });

    describe('module functionality', () => {
        it('should allow gateway to get task', async () => {
            const taskId = 'task-123';
            const expectedTask = {
                id: taskId,
                title: 'Test Task',
                dueDate: new Date(),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const { facade } = module.__testing__;
            jest.spyOn(facade, 'getTask').mockResolvedValue(expectedTask);

            const result = await module.gateway.getTask(taskId);

            expect(result).toEqual(expectedTask);
            expect(facade.getTask).toHaveBeenCalledWith(taskId);
        });
    });
});
