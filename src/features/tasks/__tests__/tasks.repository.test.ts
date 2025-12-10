import { TaskRepository } from '../tasks.repository';
import { PrismaClient } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, Task } from '../tasks.types';

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
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.create as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.create(dto);

            expect(result).toEqual(prismaTask);
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
                createdAt: now,
                updatedAt: now,
            };

            (mockPrisma.task.update as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.update(taskId, dto);

            expect(result).toEqual(prismaTask);
            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: dto,
            });
        });
    });

    describe('delete', () => {
        it('should delete task and its notifications successfully', async () => {
            const taskId = 'task-123';

            (mockPrisma.task.delete as jest.Mock).mockResolvedValue({} as any);

            await repository.delete(taskId);

            expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: taskId } });
        });
    });

    describe('findById', () => {
        it('should find task by id successfully', async () => {
            const taskId = 'task-123';
            const now = new Date();

            const prismaTask = {
                id: taskId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                createdAt: now,
                updatedAt: now,
                notifications: [],
            };

            (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(prismaTask);

            const result = await repository.findById(taskId);

            expect(result).toEqual({
                id: taskId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                createdAt: now,
                updatedAt: now,
            });
            expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
                where: { id: taskId },
                include: { notifications: false },
            });
        });

        it('should throw error when task not found', async () => {
            (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(repository.findById('non-existing')).rejects.toThrow('Task with id non-existing not found');
        });
    });

    describe('findByUserId', () => {
        it('should find tasks by user id successfully', async () => {
            const userId = 'user-123';
            const now = new Date();

            const prismaTasks = [
                {
                    id: 'task-1',
                    title: 'Task 1',
                    dueDate: new Date('2024-01-01'),
                    userId,
                    createdAt: now,
                    updatedAt: now,
                    notifications: [],
                },
                {
                    id: 'task-2',
                    title: 'Task 2',
                    dueDate: new Date('2024-01-02'),
                    userId,
                    createdAt: now,
                    updatedAt: now,
                    notifications: [],
                },
            ];

            (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(prismaTasks);

            const result = await repository.findByUserId(userId);

            expect(result).toHaveLength(2);
            expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
                where: { userId },
                include: { notifications: false },
                orderBy: { dueDate: 'asc' },
            });
        });
    });
});
