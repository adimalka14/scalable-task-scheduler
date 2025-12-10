import { TaskFacade } from '../tasks.facade';
import { TaskService } from '../tasks.service';
import { ISchedulerQueue, IEventBus, ICacheService } from '../../../shared/interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from '../tasks.types';
import { EVENTS } from '../../../shared/queue/queue.constants';

describe('TaskFacade', () => {
    let facade: TaskFacade;
    let mockService: jest.Mocked<TaskService>;
    let mockSchedulerQueue: jest.Mocked<ISchedulerQueue>;
    let mockEventBus: jest.Mocked<IEventBus>;
    let mockCacheService: jest.Mocked<ICacheService>;
    const now = Date.now();
    const futureDate = new Date(now + 5 * 60 * 1000);

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(now);

        mockService = {
            createTask: jest.fn(),
            updateTask: jest.fn(),
            deleteTask: jest.fn(),
            getTask: jest.fn(),
            getUserTasks: jest.fn(),
        } as any;

        mockSchedulerQueue = {
            scheduleJob: jest.fn(),
            cancelJob: jest.fn(),
        } as any;

        mockEventBus = {
            publish: jest.fn(),
        } as any;

        mockCacheService = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        } as any;

        facade = new TaskFacade(mockService, mockSchedulerQueue, mockEventBus, mockCacheService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createTask', () => {
        it('should schedule task reminder when dueDate is in the future', async () => {
            const dto: CreateTaskDto = {
                title: 'Test Task',
                dueDate: futureDate,
                userId: 'user-1',
            };

            const createdTask: Task = {
                id: 'task-1',
                ...dto,
                createdAt: new Date(now),
                updatedAt: new Date(now),
            };

            mockService.createTask.mockResolvedValue(createdTask);
            mockSchedulerQueue.scheduleJob.mockResolvedValue();
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.createTask(dto);

            expect(result).toEqual(createdTask);
            expect(mockSchedulerQueue.scheduleJob).toHaveBeenCalledWith(
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                { taskId: 'task-1', userId: 'user-1', dueDate: futureDate },
                {
                    delay: futureDate.getTime() - now,
                    jobId: 'task-reminder-task-1',
                },
            );
        });

        it('should handle already due task', async () => {
            const dto: CreateTaskDto = {
                title: 'Test Task',
                dueDate: new Date('2020-01-01T10:00:00Z'), // Past date
                userId: 'user-123',
            };

            const expectedTask: Task = {
                id: 'task-123',
                title: 'Test Task',
                dueDate: new Date('2020-01-01T10:00:00Z'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockService.createTask.mockResolvedValue(expectedTask);
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.createTask(dto);

            expect(result).toEqual(expectedTask);
            expect(mockSchedulerQueue.scheduleJob).not.toHaveBeenCalled();
            // createTask doesn't publish events, only updateTask and deleteTask do
        });
    });

    describe('updateTask', () => {
        it('should NOT schedule reminder if dueDate is in the past', async () => {
            const dto: CreateTaskDto = {
                title: 'Past Task',
                dueDate: new Date(now - 10000),
                userId: 'user-2',
            };

            const createdTask: Task = {
                id: 'task-2',
                ...dto,
                createdAt: new Date(now),
                updatedAt: new Date(now),
            };

            mockService.createTask.mockResolvedValue(createdTask);
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.createTask(dto);

            expect(result).toEqual(createdTask);
            expect(mockSchedulerQueue.scheduleJob).not.toHaveBeenCalled();
        });

        it('should reschedule when updating dueDate', async () => {
            const taskId = 'task-3';
            const dto: UpdateTaskDto = {
                dueDate: futureDate,
            };

            const updatedTask: Task = {
                id: taskId,
                title: 'Updated Task',
                dueDate: futureDate,
                userId: 'user-3',
                createdAt: new Date(now),
                updatedAt: new Date(now),
            };

            mockService.updateTask.mockResolvedValue(updatedTask);
            mockSchedulerQueue.cancelJob.mockResolvedValue();
            mockSchedulerQueue.scheduleJob.mockResolvedValue();
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.updateTask(taskId, dto);

            expect(result).toEqual(updatedTask);
            expect(mockSchedulerQueue.cancelJob).toHaveBeenCalledWith(
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                'task-reminder-task-3',
            );
            expect(mockSchedulerQueue.scheduleJob).toHaveBeenCalledWith(
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                { taskId: 'task-3', userId: 'user-3', dueDate: futureDate },
                {
                    delay: futureDate.getTime() - now,
                    jobId: 'task-reminder-task-3',
                },
            );
        });

        it('should update task without rescheduling when dueDate not provided', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = {
                title: 'Updated Task',
            };

            const expectedTask: Task = {
                id: taskId,
                title: 'Updated Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockService.updateTask.mockResolvedValue(expectedTask);
            mockEventBus.publish.mockResolvedValue();

            const result = await facade.updateTask(taskId, dto);

            expect(result).toEqual(expectedTask);
            expect(mockSchedulerQueue.cancelJob).not.toHaveBeenCalled();
            expect(mockSchedulerQueue.scheduleJob).not.toHaveBeenCalled();
            expect(mockEventBus.publish).toHaveBeenCalled();
        });
    });

    describe('deleteTask', () => {
        it('should delete task and cancel reminder successfully', async () => {
            const taskId = 'task-123';

            mockSchedulerQueue.cancelJob.mockResolvedValue();
            mockService.deleteTask.mockResolvedValue();
            mockEventBus.publish.mockResolvedValue();

            await facade.deleteTask(taskId);

            expect(mockSchedulerQueue.cancelJob).toHaveBeenCalledWith(
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                'task-reminder-task-123',
            );
            expect(mockService.deleteTask).toHaveBeenCalledWith(taskId);
            expect(mockEventBus.publish).toHaveBeenCalledWith(EVENTS.EVENT_BUS_QUEUE.TASK_DELETED, { taskId });
        });
    });

    describe('getTask', () => {
        it('should get task successfully', async () => {
            const taskId = 'task-123';
            const expectedTask: Task = {
                id: taskId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockService.getTask.mockResolvedValue(expectedTask);

            const result = await facade.getTask(taskId);

            expect(result).toEqual(expectedTask);
            expect(mockService.getTask).toHaveBeenCalledWith(taskId);
        });
    });

    describe('getUserTasks', () => {
        it('should get user tasks successfully', async () => {
            const userId = 'user-123';
            const expectedTasks: Task[] = [
                {
                    id: 'task-1',
                    title: 'Task 1',
                    dueDate: new Date('2024-01-01T10:00:00Z'),
                    userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'task-2',
                    title: 'Task 2',
                    dueDate: new Date('2024-01-02T10:00:00Z'),
                    userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockService.getUserTasks.mockResolvedValue(expectedTasks);

            const result = await facade.getUserTasks(userId);

            expect(result).toEqual(expectedTasks);
            expect(mockService.getUserTasks).toHaveBeenCalledWith(userId);
        });
    });
});
