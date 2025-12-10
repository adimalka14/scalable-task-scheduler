import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ITaskFacade } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto } from './tasks.types';
import logger from '../../shared/utils/logger';

export class TaskController {
    constructor(private taskFacade: ITaskFacade) {}

    async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { title, dueDate, userId } = req.body;

            const dto: CreateTaskDto = {
                title,
                dueDate: new Date(dueDate),
                userId,
            };

            const task = await this.taskFacade.createTask(dto);

            logger.info('TASK_CTRL', 'Task created successfully', { 
                taskId: task.id, 
                userId: task.userId,
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.CREATED).json({
                success: true,
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const taskId = req.params.taskId as string;
            const { title, dueDate } = req.body as { title?: string; dueDate?: string };

            const updateData: UpdateTaskDto = {};
            if (title) updateData.title = title;
            if (dueDate) updateData.dueDate = new Date(dueDate);

            const task = await this.taskFacade.updateTask(taskId, updateData);

            logger.info('TASK_CTRL', 'Task updated successfully', { 
                taskId, 
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const taskId = req.params.taskId as string;

            await this.taskFacade.deleteTask(taskId);

            logger.info('TASK_CTRL', 'Task deleted successfully', { 
                taskId, 
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Task deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const taskId = req.params.taskId as string;

            const task = await this.taskFacade.getTask(taskId);

            res.status(StatusCodes.OK).json({
                success: true,
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.userId as string;

            const tasks = await this.taskFacade.getUserTasks(userId);

            res.status(StatusCodes.OK).json({
                success: true,
                data: tasks,
            });
        } catch (error) {
            next(error);
        }
    }
}
