import { ITaskFacade, ITaskService } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';
import { ISchedulerQueue, IEventBus, ICacheService } from '../../shared/interfaces';
import { EVENTS } from '../../shared/queue/queue.constants';
import logger from '../../shared/utils/logger';

const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_KEYS = {
    task: (id: string) => `task:${id}`,
    userTasks: (userId: string) => `tasks:user:${userId}`,
};

export class TaskFacade implements ITaskFacade {
    constructor(
        private service: ITaskService,
        private schedulerQueue: ISchedulerQueue,
        private eventBus: IEventBus,
        private cacheService: ICacheService,
    ) {}

    async createTask(dto: CreateTaskDto): Promise<Task> {
        const task = await this.service.createTask(dto);
        await this.scheduleTaskReminder(task, dto.dueDate);
        
        // Invalidate user tasks cache (non-blocking)
        await this.safeCacheDelete(CACHE_KEYS.userTasks(task.userId));
        
        return task;
    }

    async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
        const task = await this.service.updateTask(id, dto);

        if (dto.dueDate) {
            await this.cancelTaskReminder(id);
            await this.scheduleTaskReminder(task, dto.dueDate);
        }

        await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_UPDATED, {
            taskId: task.id,
            title: task.title,
            dueDate: task.dueDate,
            userId: task.userId,
        });

        // Invalidate caches (non-blocking)
        await Promise.all([
            this.safeCacheDelete(CACHE_KEYS.task(id)),
            this.safeCacheDelete(CACHE_KEYS.userTasks(task.userId)),
        ]);

        return task;
    }

    async deleteTask(id: string): Promise<void> {
        // Try to get task before deletion to invalidate user cache
        let userId: string | undefined;
        try {
            const task = await this.service.getTask(id);
            userId = task.userId;
        } catch (error) {
            logger.debug('TASK_FACADE', 'Task not found before deletion, continuing', { taskId: id });
        }
        
        await this.cancelTaskReminder(id);
        await this.service.deleteTask(id);
        await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_DELETED, {
            taskId: id,
        });

        // Invalidate caches (non-blocking)
        const deletePromises = [this.safeCacheDelete(CACHE_KEYS.task(id))];
        if (userId) {
            deletePromises.push(this.safeCacheDelete(CACHE_KEYS.userTasks(userId)));
        }
        await Promise.all(deletePromises);
    }

    async getTask(id: string): Promise<Task> {
        return this.getFromCacheOrService(
            CACHE_KEYS.task(id),
            () => this.service.getTask(id),
            'Task',
            { taskId: id },
        );
    }

    async getUserTasks(userId: string): Promise<Task[]> {
        return this.getFromCacheOrService(
            CACHE_KEYS.userTasks(userId),
            () => this.service.getUserTasks(userId),
            'User tasks',
            { userId },
        );
    }

    /**
     * Helper function to get data from cache or service
     * Cache failures are non-blocking - if cache fails, we fall back to service
     */
    private async getFromCacheOrService<T>(
        cacheKey: string,
        serviceCall: () => Promise<T>,
        logContext: string,
        logMetadata: Record<string, any>,
    ): Promise<T> {
        // Try to get from cache (non-blocking)
        try {
            const cached = await this.cacheService.get<T>(cacheKey);
            if (cached) {
                logger.debug('TASK_FACADE', `${logContext} retrieved from cache`, logMetadata);
                return cached;
            }
        } catch (error) {
            logger.warn('TASK_FACADE', `Cache read failed for ${logContext}, falling back to service`, {
                ...logMetadata,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        // Get from service
        const data = await serviceCall();

        // Try to store in cache (non-blocking)
        try {
            await this.cacheService.set(cacheKey, data, CACHE_TTL);
        } catch (error) {
            logger.warn('TASK_FACADE', `Cache write failed for ${logContext}`, {
                ...logMetadata,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return data;
    }

    /**
     * Helper function to safely delete from cache (non-blocking)
     */
    private async safeCacheDelete(key: string): Promise<void> {
        try {
            await this.cacheService.del(key);
        } catch (error) {
            logger.warn('TASK_FACADE', 'Cache delete failed', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    private async scheduleTaskReminder(task: Task, dueDate: Date): Promise<void> {
        const delay = dueDate.getTime() - Date.now();
        logger.silly('TASK_FACADE', 'delay', { delay });

        if (delay <= 0) {
            logger.warn('TASK_FACADE', 'Task is already due', { taskId: task.id, dueDate });
            return;
        }

        await this.schedulerQueue.scheduleJob(
            EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
            EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
            { taskId: task.id, userId: task.userId, dueDate: task.dueDate },
            {
                delay,
                jobId: `task-reminder-${task.id}`,
            },
        );

        logger.debug('TASK_FACADE', 'Scheduled reminder for task', { taskId: task.id, dueDate });
    }

    private async cancelTaskReminder(taskId: string): Promise<void> {
        await this.schedulerQueue.cancelJob(EVENTS.SCHEDULER_QUEUE.TASK_REMINDER, `task-reminder-${taskId}`);
        logger.debug('TASK_FACADE', 'Cancelled reminder for task', { taskId });
    }
}
