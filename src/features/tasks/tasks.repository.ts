import { Prisma, PrismaClient, Task as PrismaTask } from '@prisma/client';
import { ITaskRepository } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';
import { NotFoundError } from '../../shared/config/errors';

export class TaskRepository implements ITaskRepository {
    constructor(private prisma: PrismaClient) {}

    async create(dto: CreateTaskDto): Promise<Task> {
        const result = (await this.prisma.task.create({
            data: {
                title: dto.title,
                dueDate: dto.dueDate,
                userId: dto.userId,
            },
        })) as PrismaTask;

        return this.mapPrismaToTask(result);
    }

    async update(id: string, dto: UpdateTaskDto): Promise<Task> {
        const result = (await this.prisma.task.update({
            where: { id },
            data: dto,
        })) as PrismaTask;

        return this.mapPrismaToTask(result);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.task.delete({
            where: { id },
        });
    }

    async findById(id: string): Promise<Task> {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                notifications: false,
            } as Prisma.TaskInclude,
        });

        if (!task) {
            throw new NotFoundError('Task', id);
        }

        return this.mapPrismaToTask(task as PrismaTask);
    }

    async findByUserId(userId: string): Promise<Task[]> {
        const tasks = await this.prisma.task.findMany({
            where: { userId },
            include: {
                notifications: false,
            } as Prisma.TaskInclude,
            orderBy: {
                dueDate: 'asc',
            } as Prisma.TaskOrderByWithRelationInput,
        });

        return tasks.map((task) => this.mapPrismaToTask(task));
    }

    private mapPrismaToTask(prismaTask: PrismaTask): Task {
        return {
            id: prismaTask.id,
            title: prismaTask.title,
            dueDate: prismaTask.dueDate,
            userId: prismaTask.userId,
            createdAt: prismaTask.createdAt,
            updatedAt: prismaTask.updatedAt,
        };
    }
}
