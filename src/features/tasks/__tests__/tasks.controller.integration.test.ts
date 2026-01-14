import { TaskController } from '../tasks.controller';
import { TaskFacade } from '../tasks.facade';
import { CreateTaskDto, UpdateTaskDto, Task, TaskStatus } from '../tasks.types';
import { Request, Response } from 'express';

describe('TaskController Integration', () => {
    let controller: TaskController;
    let mockFacade: jest.Mocked<TaskFacade>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;

    beforeEach(() => {
        mockFacade = {
            createTask: jest.fn(),
            updateTask: jest.fn(),
            deleteTask: jest.fn(),
            getTask: jest.fn(),
            getUserTasks: jest.fn(),
        } as any;

        responseJson = jest.fn();
        responseStatus = jest.fn().mockReturnValue({ json: responseJson });

        mockResponse = {
            status: responseStatus,
            json: responseJson,
        } as any;

        controller = new TaskController(mockFacade);
    });

    describe('createTask', () => {
        it('should create task successfully', async () => {
            const taskData = {
                title: 'Test Task',
                dueDate: '2024-01-01T10:00:00Z',
                userId: 'user-123',
            };

            const expectedTask: Task = {
                id: 'task-123',
                title: 'Test Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
                status: TaskStatus.SCHEDULED,
                scheduledAt: new Date(),
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

            mockRequest = {
                body: taskData,
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.createTask.mockResolvedValue(expectedTask);

            await controller.createTask(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.createTask).toHaveBeenCalledWith({
                title: 'Test Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
            });
            expect(responseStatus).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedTask,
            });
        });

        it('should handle facade error', async () => {
            const taskData = {
                title: 'Test Task',
                dueDate: '2024-01-01T10:00:00Z',
                userId: 'user-123',
            };

            mockRequest = {
                body: taskData,
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Database error');
            mockFacade.createTask.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.createTask(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
            expect(responseJson).not.toHaveBeenCalled();
        });
    });

    describe('updateTask', () => {
        it('should update task successfully', async () => {
            const taskId = 'task-123';
            const updateData = {
                title: 'Updated Task',
            };

            const expectedTask: Task = {
                id: taskId,
                title: 'Updated Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
                status: TaskStatus.SCHEDULED,
                scheduledAt: new Date(),
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

            mockRequest = {
                params: { taskId },
                body: updateData,
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.updateTask.mockResolvedValue(expectedTask);

            await controller.updateTask(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.updateTask).toHaveBeenCalledWith(taskId, updateData);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedTask,
            });
        });

        it('should handle task not found error', async () => {
            const taskId = 'task-123';
            const updateData = {
                title: 'Updated Task',
            };

            mockRequest = {
                params: { taskId },
                body: updateData,
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Task not found');
            (error as any).status = 404;
            mockFacade.updateTask.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.updateTask(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
            expect(responseJson).not.toHaveBeenCalled();
        });
    });

    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            const taskId = 'task-123';

            mockRequest = {
                params: { taskId },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.deleteTask.mockResolvedValue();

            await controller.deleteTask(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.deleteTask).toHaveBeenCalledWith(taskId);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                message: 'Task deleted successfully',
            });
        });

        it('should handle error when deleting task', async () => {
            const taskId = 'task-123';

            mockRequest = {
                params: { taskId },
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Delete error');
            mockFacade.deleteTask.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.deleteTask(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
        });
    });

    describe('getTask', () => {
        it('should get task successfully', async () => {
            const taskId = 'task-123';
            const expectedTask: Task = {
                id: taskId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
                status: TaskStatus.SCHEDULED,
                scheduledAt: new Date(),
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

            mockRequest = {
                params: { taskId },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.getTask.mockResolvedValue(expectedTask);

            await controller.getTask(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.getTask).toHaveBeenCalledWith(taskId);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedTask,
            });
        });

        it('should handle error when getting task', async () => {
            const taskId = 'task-123';

            mockRequest = {
                params: { taskId },
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Get task error');
            mockFacade.getTask.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.getTask(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
        });
    });

    describe('getUserTasks', () => {
        it('should get user tasks successfully', async () => {
            const userId = 'user-123';
            const expectedTasks: Task[] = [
                {
                    id: 'task-1',
                    title: 'Task 1',
                    dueDate: new Date('2024-01-01T10:00:00Z'),
                    userId,
                    status: TaskStatus.SCHEDULED,
                    scheduledAt: new Date(),
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
                },
                {
                    id: 'task-2',
                    title: 'Task 2',
                    dueDate: new Date('2024-01-02T10:00:00Z'),
                    userId,
                    status: TaskStatus.SCHEDULED,
                    scheduledAt: new Date(),
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
                },
            ];

            mockRequest = {
                params: { userId },
                headers: { 'x-request-id': 'req-123' },
            };

            mockFacade.getUserTasks.mockResolvedValue(expectedTasks);

            await controller.getUserTasks(mockRequest as Request, mockResponse as Response, jest.fn());

            expect(mockFacade.getUserTasks).toHaveBeenCalledWith(userId);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: expectedTasks,
            });
        });

        it('should handle error when getting user tasks', async () => {
            const userId = 'user-123';

            mockRequest = {
                params: { userId },
                headers: { 'x-request-id': 'req-123' },
            };

            const error = new Error('Get user tasks error');
            mockFacade.getUserTasks.mockRejectedValue(error);

            const mockNext = jest.fn();
            await controller.getUserTasks(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(responseStatus).not.toHaveBeenCalled();
        });
    });
}); 