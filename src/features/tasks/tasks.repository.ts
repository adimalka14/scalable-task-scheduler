import { Prisma, PrismaClient, Task as PrismaTask } from '@prisma/client';
import { ITaskRepository } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task, TaskStatus } from './tasks.types';
import { NotFoundError } from '../../shared/config/errors';
import { metricsService } from '../../shared/metrics/metrics.service';


export class TaskRepository implements ITaskRepository {
    constructor(private prisma: PrismaClient) { }

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
        const updateData: any = { ...dto };

        // Handle status transitions with timestamps
        if (dto.status) {
            updateData.status = dto.status;
            const now = new Date();

            if (dto.status === TaskStatus.SCHEDULED && !dto.scheduledAt) {
                updateData.scheduledAt = now;
            } else if (dto.status === TaskStatus.EXECUTING && !dto.executingAt) {
                updateData.executingAt = now;
            } else if (dto.status === TaskStatus.EXECUTED && !dto.executedAt) {
                updateData.executedAt = now;
            } else if (dto.status === TaskStatus.CANCELLED && !dto.cancelledAt) {
                updateData.cancelledAt = now;
            }
        }

        const result = (await this.prisma.task.update({
            where: { id },
            data: updateData,
        })) as PrismaTask;

        return this.mapPrismaToTask(result);
    }

    async updateStatus(id: string, status: TaskStatus, additionalData?: Partial<UpdateTaskDto>): Promise<Task> {
        const updateData: any = {
            status,
            ...additionalData,
        };

        const now = new Date();

        if (status === TaskStatus.SCHEDULED) {
            updateData.scheduledAt = additionalData?.scheduledAt ?? now;
        } else if (status === TaskStatus.EXECUTING) {
            updateData.executingAt = additionalData?.executingAt ?? now;
        } else if (status === TaskStatus.EXECUTED) {
            updateData.executedAt = additionalData?.executedAt ?? now;
        } else if (status === TaskStatus.CANCELLED) {
            updateData.cancelledAt = additionalData?.cancelledAt ?? now;
        }

        const result = (await this.prisma.task.update({
            where: { id },
            data: updateData,
        })) as PrismaTask;

        return this.mapPrismaToTask(result);
    }

    /**
     * Atomic claim: tries to transition task from SCHEDULED to EXECUTING
     * Returns true if successful, false if task was already taken/cancelled/final
     */
    async claimForExecution(taskId: string): Promise<boolean> {
        const now = new Date();

        const result = await this.prisma.task.updateMany({
            where: {
                id: taskId,
                status: TaskStatus.SCHEDULED,
                cancelledAt: null,
            },
            data: {
                status: TaskStatus.EXECUTING,
                executingAt: now,
                attempts: { increment: 1 },
                lastError: null,
            } as any,
        });

        return result.count === 1;
    }


    /**
     * Mark task as executed successfully
     */

    async markExecuted(taskId: string): Promise<Task> {

        const result = (await this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: TaskStatus.EXECUTED,
                executedAt: new Date(),
                lastError: null,
            } as any,
        })) as PrismaTask;

        // Record metrics
        if (result.scheduledAt && result.executingAt) {
            const waitTime = (result.executingAt.getTime() - result.scheduledAt.getTime()) / 1000;
            if (waitTime > 0) {
                metricsService.taskQueueWaitTime.observe(waitTime);
            }
        }

        if (result.executingAt && result.executedAt) {
            const duration = (result.executedAt.getTime() - result.executingAt.getTime()) / 1000;
            if (duration > 0) {
                metricsService.taskExecutionDuration.observe(duration);
            }
        }

        return this.mapPrismaToTask(result);
    }

    /**
     * Mark task as failed after publish error
     * If attempts >= maxAttempts → FAILED, otherwise → SCHEDULED (for retry)
     */
    async markPublishFailed(taskId: string, errorMessage: string): Promise<Task> {
        const task = await this.findById(taskId);

        const failed = task.attempts >= task.maxAttempts;

        const result = (await this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: failed ? TaskStatus.FAILED : TaskStatus.SCHEDULED,
                lastError: errorMessage,
            } as any,
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

    private mapPrismaToTask(prismaTask: PrismaTask | any): Task {
        return {
            id: prismaTask.id,
            title: prismaTask.title,
            dueDate: prismaTask.dueDate,
            userId: prismaTask.userId,
            status: (prismaTask.status as TaskStatus) || TaskStatus.CREATED,
            scheduledAt: prismaTask.scheduledAt ?? null,
            executingAt: prismaTask.executingAt ?? null,
            executedAt: prismaTask.executedAt ?? null,
            cancelledAt: prismaTask.cancelledAt ?? null,
            attempts: prismaTask.attempts ?? 0,
            maxAttempts: prismaTask.maxAttempts ?? 3,
            lastError: prismaTask.lastError ?? null,
            lockToken: prismaTask.lockToken ?? null,
            lockedAt: prismaTask.lockedAt ?? null,
            createdAt: prismaTask.createdAt,
            updatedAt: prismaTask.updatedAt,
        };
    }
}
