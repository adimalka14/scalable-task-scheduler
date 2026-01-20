import { TaskRepository } from '../tasks.repository';
import { PrismaClient } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, Task, TaskStatus } from '../tasks.types';

describe('TaskRepository', () => {
    let repository: TaskRepository;
    let mockPrisma: PrismaClient;

    beforeEach(() => {
        mockPrisma = {
            task: {
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                updateMany: jest.fn(),
            },
            notification: {
                deleteMany: jest.fn(),
            },
        } as unknown as PrismaClient;

        repository = new TaskRepository(mockPrisma);
    });

    describe('create', () => {
        it('should create task successfully', async () => {
            const dto: CreateTaskDto = {
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
            };

            const now = new Date();

            const prismaTask = {
                id: 'task-123',
                title: dto.title,
                dueDate: dto.dueDate,
                userId: dto.userId,
                status: TaskStatus.CREATED,
                scheduledAt: null,
                executingAt: null,
                executedAt: null,
                cancelledAt: null,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.create as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.create(dto);

            expect(result).toEqual({
                id: 'task-123',
                title: dto.title,
                dueDate: dto.dueDate,
                userId: dto.userId,
                status: TaskStatus.CREATED,
                scheduledAt: null,
                executingAt: null,
                executedAt: null,
                cancelledAt: null,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            });
            expect(mockPrisma.task.create).toHaveBeenCalledWith({
                data: dto,
            });
        });

        it('should throw error when prisma fails', async () => {
            const dto: CreateTaskDto = {
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
            };

            const error = new Error('Database error');
            (mockPrisma.task.create as jest.Mock).mockRejectedValue(error);

            await expect(repository.create(dto)).rejects.toThrow('Database error');
        });
    });

    describe('update', () => {
        it('should update task successfully', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = { title: 'Updated Task' };
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: dto.title,
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                status: TaskStatus.SCHEDULED,
                scheduledAt: now,
                executingAt: null,
                executedAt: null,
                cancelledAt: null,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.update(taskId, dto);

            expect(result).toEqual({
                id: taskId,
                title: dto.title,
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                status: TaskStatus.SCHEDULED,
                scheduledAt: now,
                executingAt: null,
                executedAt: null,
                cancelledAt: null,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            });
            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: dto,
            });
        });

        it('should auto-set scheduledAt when status is SCHEDULED', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = { status: TaskStatus.SCHEDULED, title: 'Test' };
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Test',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                status: TaskStatus.SCHEDULED,
                scheduledAt: now,
                executingAt: null,
                executedAt: null,
                cancelledAt: null,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            await repository.update(taskId, dto);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: expect.objectContaining({
                    status: TaskStatus.SCHEDULED,
                    scheduledAt: expect.any(Date),
                    title: 'Test',
                }),
            });
        });

        it('should auto-set executingAt when status is EXECUTING', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = { status: TaskStatus.EXECUTING };
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                status: TaskStatus.EXECUTING,
                scheduledAt: new Date(),
                executingAt: now,
                executedAt: null,
                cancelledAt: null,
                attempts: 1,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            await repository.update(taskId, dto);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: expect.objectContaining({
                    status: TaskStatus.EXECUTING,
                    executingAt: expect.any(Date),
                }),
            });
        });

        it('should auto-set executedAt when status is EXECUTED', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = { status: TaskStatus.EXECUTED };
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                status: TaskStatus.EXECUTED,
                scheduledAt: new Date(),
                executingAt: new Date(),
                executedAt: now,
                cancelledAt: null,
                attempts: 1,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            await repository.update(taskId, dto);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: expect.objectContaining({
                    status: TaskStatus.EXECUTED,
                    executedAt: expect.any(Date),
                }),
            });
        });

        it('should auto-set cancelledAt when status is CANCELLED', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = { status: TaskStatus.CANCELLED };
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                status: TaskStatus.CANCELLED,
                scheduledAt: new Date(),
                executingAt: null,
                executedAt: null,
                cancelledAt: now,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            await repository.update(taskId, dto);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: expect.objectContaining({
                    status: TaskStatus.CANCELLED,
                    cancelledAt: expect.any(Date),
                }),
            });
        });
    });

    describe('updateStatus', () => {
        it('should update task status to SCHEDULED and set scheduledAt', async () => {
            const taskId = 'task-123';
            const status = TaskStatus.SCHEDULED;
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date(),
                userId: 'user-1',
                status,
                scheduledAt: now,
                executingAt: null,
                executedAt: null,
                cancelledAt: null,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.updateStatus(taskId, status);

            expect(result.status).toBe(status);
            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: expect.objectContaining({
                    status,
                    scheduledAt: expect.any(Date),
                }),
            });
        });

        it('should update task status to EXECUTING and set executingAt', async () => {
            const taskId = 'task-123';
            const status = TaskStatus.EXECUTING;
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date(),
                userId: 'user-1',
                status,
                scheduledAt: new Date(),
                executingAt: now,
                executedAt: null,
                cancelledAt: null,
                attempts: 1,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.updateStatus(taskId, status);

            expect(result.status).toBe(status);
        });

        it('should update task status to EXECUTED and set executedAt', async () => {
            const taskId = 'task-123';
            const status = TaskStatus.EXECUTED;
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date(),
                userId: 'user-1',
                status,
                scheduledAt: new Date(),
                executingAt: new Date(),
                executedAt: now,
                cancelledAt: null,
                attempts: 1,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.updateStatus(taskId, status);

            expect(result.status).toBe(status);
        });

        it('should update task status to CANCELLED and set cancelledAt', async () => {
            const taskId = 'task-123';
            const status = TaskStatus.CANCELLED;
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date(),
                userId: 'user-1',
                status,
                scheduledAt: new Date(),
                executingAt: null,
                executedAt: null,
                cancelledAt: now,
                attempts: 0,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.updateStatus(taskId, status);

            expect(result.status).toBe(status);
        });

        it('should update task status and set relevant timestamp', async () => {
            const taskId = 'task-123';
            const status = TaskStatus.EXECUTING;
            const now = new Date();
            const additionalData = { executingAt: now };

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date(),
                userId: 'user-1',
                status,
                scheduledAt: new Date(),
                executingAt: now,
                executedAt: null,
                cancelledAt: null,
                attempts: 1,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.updateStatus(taskId, status, additionalData);

            expect(result.status).toBe(status);
            expect(result.executingAt).toBe(now);
            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: expect.objectContaining({
                    status,
                    executingAt: now,
                }),
            });
        });
    });

    describe('claimForExecution', () => {
        it('should return true if task was successfully claimed', async () => {
            const taskId = 'task-123';
            (mockPrisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

            const result = await repository.claimForExecution(taskId);

            expect(result).toBe(true);
            expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
                where: {
                    id: taskId,
                    status: TaskStatus.SCHEDULED,
                    cancelledAt: null,
                },
                data: expect.objectContaining({
                    status: TaskStatus.EXECUTING,
                    attempts: { increment: 1 },
                }),
            });
        });

        it('should return false if task could not be claimed', async () => {
            const taskId = 'task-123';
            (mockPrisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

            const result = await repository.claimForExecution(taskId);

            expect(result).toBe(false);
        });
    });

    describe('markExecuted', () => {
        it('should mark task as executed', async () => {
            const taskId = 'task-123';
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Task',
                dueDate: new Date(),
                userId: 'user-1',
                status: TaskStatus.EXECUTED,
                executedAt: now,
                scheduledAt: new Date(),
                executingAt: new Date(),
                cancelledAt: null,
                attempts: 1,
                maxAttempts: 3,
                lastError: null,
                lockToken: null,
                lockedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.markExecuted(taskId);

            expect(result.status).toBe(TaskStatus.EXECUTED);
            expect(result.executedAt).toBe(now);
        });
    });

    describe('markPublishFailed', () => {
        it('should mark task as failed if max attempts reached', async () => {
            const taskId = 'task-123';
            const errorMessage = 'Connection error';

            const task = {
                id: taskId,
                attempts: 3,
                maxAttempts: 3,
            } as any;

            jest.spyOn(repository, 'findById').mockResolvedValue(task);

            const prismaTask = {
                ...task,
                status: TaskStatus.FAILED,
                lastError: errorMessage,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.markPublishFailed(taskId, errorMessage);

            expect(result.status).toBe(TaskStatus.FAILED);
            expect(result.lastError).toBe(errorMessage);
        });

        it('should reschedule task if max attempts not reached', async () => {
            const taskId = 'task-123';
            const errorMessage = 'Connection error';

            const task = {
                id: taskId,
                attempts: 1,
                maxAttempts: 3,
            } as any;

            jest.spyOn(repository, 'findById').mockResolvedValue(task);

            const prismaTask = {
                ...task,
                title: 'Task', // Add missing required properties
                dueDate: new Date(),
                userId: 'user-1',
                status: TaskStatus.SCHEDULED,
                lastError: errorMessage,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.markPublishFailed(taskId, errorMessage);

            expect(result.status).toBe(TaskStatus.SCHEDULED);
            expect(result.lastError).toBe(errorMessage);
        });
    });
    it('should delete task and its notifications successfully', async () => {
        const taskId = 'task-123';

        (mockPrisma.task.delete as jest.Mock).mockResolvedValue({} as any);

        await repository.delete(taskId);

        expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: taskId } });
    });
});
