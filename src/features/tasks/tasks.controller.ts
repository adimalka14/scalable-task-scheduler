import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ITaskFacade } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto } from './tasks.types';
import logger from '../../shared/utils/logger';

export class TaskController {
    constructor(private taskFacade: ITaskFacade) {}

    async createTask(req: Request, res: Response): Promise<void> {
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
            logger.error('TASK_CTRL', 'Error creating task', { 
                error, 
                reqId: req.headers['x-request-id'] 
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async updateTask(req: Request, res: Response): Promise<void> {
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
            logger.error('TASK_CTRL', 'Error updating task', { 
                error, 
                taskId: req.params.taskId,
                reqId: req.headers['x-request-id'] 
            });
            
            if (error instanceof Error && error.message === 'Task not found') {
                res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Task not found',
                });
                return;
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async deleteTask(req: Request, res: Response): Promise<void> {
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
            logger.error('TASK_CTRL', 'Error deleting task', { 
                error, 
                taskId: req.params.taskId,
                reqId: req.headers['x-request-id'] 
            });
            
            if (error instanceof Error && error.message === 'Task not found') {
                res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Task not found',
                });
                return;
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async getTask(req: Request, res: Response): Promise<void> {
        try {
            const taskId = req.params.taskId as string;

            const task = await this.taskFacade.getTask(taskId);

            logger.debug('TASK_CTRL', 'Task retrieved successfully', { 
                taskId, 
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: task,
            });
        } catch (error) {
            logger.error('TASK_CTRL', 'Error getting task', { 
                error, 
                taskId: req.params.taskId,
                reqId: req.headers['x-request-id'] 
            });
            
            if (error instanceof Error && error.message === 'Task not found') {
                res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Task not found',
                });
                return;
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    async getUserTasks(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId as string;

            const tasks = await this.taskFacade.getUserTasks(userId);

            logger.debug('TASK_CTRL', 'User tasks retrieved successfully', { 
                userId, 
                taskCount: tasks.length,
                reqId: req.headers['x-request-id'] 
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: tasks,
            });
        } catch (error) {
            logger.error('TASK_CTRL', 'Error getting user tasks', { 
                error, 
                userId: req.params.userId,
                reqId: req.headers['x-request-id'] 
            });
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}
