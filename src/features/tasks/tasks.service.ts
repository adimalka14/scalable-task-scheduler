import { ITaskService, ITaskRepository } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';
import logger from '../../shared/utils/logger';

export class TaskService implements ITaskService {
    constructor(private repository: ITaskRepository) {}

    async createTask(dto: CreateTaskDto): Promise<Task> {
        try {
            const task = await this.repository.create(dto);
            logger.info('TASK_SVC', 'Task created successfully', { taskId: task.id });
            return task;
        } catch (error) {
            logger.error('TASK_SVC', 'Error creating task', { error });
            throw error;
        }
    }

    async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
        try {
            const task = await this.repository.update(id, dto);
            logger.info('TASK_SVC', 'Task updated successfully', { taskId: id });
            return task;
        } catch (error) {
            logger.error('TASK_SVC', 'Error updating task', { error, taskId: id });
            throw error;
        }
    }

    async deleteTask(id: string): Promise<void> {
        try {
            await this.repository.delete(id);
            logger.info('TASK_SVC', 'Task deleted successfully', { taskId: id });
        } catch (error) {
            logger.error('TASK_SVC', 'Error deleting task', { error, taskId: id });
            throw error;
        }
    }

    async getTask(id: string): Promise<Task> {
        try {
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('TASK_SVC', 'Error getting task', { error, taskId: id });
            throw error;
        }
    }

    async getUserTasks(userId: string): Promise<Task[]> {
        try {
            const tasks = await this.repository.findByUserId(userId);
            logger.debug('TASK_SVC', 'User tasks retrieved', { userId, taskCount: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('TASK_SVC', 'Error getting user tasks', { error, userId });
            throw error;
        }
    }
}
