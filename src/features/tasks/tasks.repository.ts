import { Prisma, PrismaClient, Task as PrismaTask, Notification } from '@prisma/client';
import { ITaskRepository } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';
import logger from '../../shared/utils/logger';

function toTaskDto(task: PrismaTask, notifications: Notification[] = []): Task {
    return {
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        //notifications,
    };
}

export class TaskRepository implements ITaskRepository {
    constructor(private prisma: PrismaClient) {}

    async create(dto: CreateTaskDto): Promise<Task> {
        try {
            const task = (await this.prisma.task.create({
                data: {
                    title: dto.title,
                    dueDate: dto.dueDate,
                    userId: dto.userId,
                },
            })) as PrismaTask;

            return toTaskDto(task);
        } catch (error) {
            logger.error('TASK_REPO', 'Error creating task in repository', { error });
            throw error;
        }
    }

    async update(id: string, dto: UpdateTaskDto): Promise<Task> {
        try {
            const task = (await this.prisma.task.update({
                where: { id },
                data: dto,
            })) as PrismaTask;

            return toTaskDto(task);
        } catch (error) {
            logger.error('TASK_REPO', 'Error updating task in repository', { error, taskId: id });
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.prisma.notification.deleteMany({ where: { taskId: id } });
            await this.prisma.task.delete({ where: { id } });
        } catch (error) {
            logger.error('TASK_REPO', 'Error deleting task in repository', { error, taskId: id });
            throw error;
        }
    }

    async findById(id: string): Promise<Task> {
        try {
            const result = await this.prisma.task.findUnique({
                where: { id },
                include: { notifications: true },
            });

            if (!result) throw new Error('Task not found');

            const { notifications, ...task } = result;
            return toTaskDto(task as PrismaTask, Array.isArray(notifications) ? notifications : []);
        } catch (error) {
            logger.error('TASK_REPO', 'Error finding task by id in repository', { error, taskId: id });
            throw error;
        }
    }

    async findByUserId(userId: string): Promise<Task[]> {
        try {
            const results = await this.prisma.task.findMany({
                where: { userId: userId },
                include: { notifications: true } as Prisma.TaskInclude,
                orderBy: { dueDate: 'asc' } as Prisma.TaskOrderByWithRelationInput,
            });

            return results.map((result) => {
                const { notifications, ...task } = result;
                return toTaskDto(task, notifications ?? []);
            });
        } catch (error) {
            logger.error('TASK_REPO', 'Error finding tasks by user id in repository', { error, userId });
            throw error;
        }
    }
}
