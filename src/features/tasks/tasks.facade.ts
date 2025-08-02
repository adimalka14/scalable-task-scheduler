import { ITaskFacade, ITaskService } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';
import { ISchedulerQueue, IEventBus } from '../../shared/interfaces';
import { EVENTS } from '../../shared/queue/queue.constants';
import logger from '../../shared/utils/logger';

export class TaskFacade implements ITaskFacade {
    constructor(
        private service: ITaskService,
        private schedulerQueue: ISchedulerQueue,
        private eventBus: IEventBus,
    ) {}

    async createTask(dto: CreateTaskDto): Promise<Task> {
        try {
            const task = await this.service.createTask(dto);

            await this.scheduleTaskReminder(task.id, dto.dueDate);

            await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_CREATED, {
                taskId: task.id,
                title: task.title,
                dueDate: task.dueDate,
                userId: task.userId,
            });

            logger.info('TASK_FACADE', 'Task facade created task successfully', { taskId: task.id });
            return task;
        } catch (error) {
            logger.error('TASK_FACADE', 'Error in task facade createTask', { error });
            throw error;
        }
    }

    async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
        try {
            const task = await this.service.updateTask(id, dto);

            if (dto.dueDate) {
                await this.cancelTaskReminder(id);
                await this.scheduleTaskReminder(id, dto.dueDate);
            }

            await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_UPDATED, {
                taskId: task.id,
                title: task.title,
                dueDate: task.dueDate,
                userId: task.userId,
            });

            logger.info('TASK_FACADE', 'Task facade updated task successfully', { taskId: id });
            return task;
        } catch (error) {
            logger.error('TASK_FACADE', 'Error in task facade updateTask', { error, taskId: id });
            throw error;
        }
    }

    async deleteTask(id: string): Promise<void> {
        try {
            await this.cancelTaskReminder(id);
            await this.service.deleteTask(id);

            await this.eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_DELETED, {
                taskId: id,
            });

            logger.info('TASK_FACADE', 'Task facade deleted task successfully', { taskId: id });
        } catch (error) {
            logger.error('TASK_FACADE', 'Error in task facade deleteTask', { error, taskId: id });
            throw error;
        }
    }

    async getTask(id: string): Promise<Task> {
        try {
            return await this.service.getTask(id);
        } catch (error) {
            logger.error('TASK_FACADE', 'Error in task facade getTask', { error, taskId: id });
            throw error;
        }
    }

    async getUserTasks(userId: string): Promise<Task[]> {
        try {
            return await this.service.getUserTasks(userId);
        } catch (error) {
            logger.error('TASK_FACADE', 'Error in task facade getUserTasks', { error, userId });
            throw error;
        }
    }

    private async scheduleTaskReminder(taskId: string, dueDate: Date): Promise<void> {
        try {
            const delay = dueDate.getTime() - Date.now();

            if (delay <= 0) {
                logger.warn('TASK_FACADE', 'Task is already due', { taskId });
                return;
            }

            await this.schedulerQueue.scheduleJob(
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                { taskId },
                {
                    delay,
                    jobId: `task-reminder-${taskId}`,
                },
            );

            logger.debug('TASK_FACADE', 'Scheduled reminder for task', { taskId, dueDate });
        } catch (error) {
            logger.error('TASK_FACADE', 'Error scheduling task reminder', { error, taskId });
            throw error;
        }
    }

    private async cancelTaskReminder(taskId: string): Promise<void> {
        try {
            await this.schedulerQueue.cancelJob(EVENTS.SCHEDULER_QUEUE.TASK_REMINDER, `task-reminder-${taskId}`);
            logger.debug('TASK_FACADE', 'Cancelled reminder for task', { taskId });
        } catch (error) {
            logger.error('TASK_FACADE', 'Error cancelling task reminder', { error, taskId });
            throw error;
        }
    }
}
