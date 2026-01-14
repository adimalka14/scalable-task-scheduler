import request from 'supertest';
import express, { Express } from 'express';
import { createTaskRoutes } from '../tasks.routes';
import { TaskController } from '../tasks.controller';

// Mock TaskController
const mockController = {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTask: jest.fn(),
    getUserTasks: jest.fn(),
} as unknown as TaskController;

describe('Task Routes', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        const router = createTaskRoutes(mockController);
        app.use('/tasks', router);

        jest.clearAllMocks();
    });

    describe('POST /tasks', () => {
        it('should delegate to controller.createTask on valid payload', async () => {
            const validPayload = {
                title: 'Test Task',
                dueDate: '2024-12-25T10:00:00Z',
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };

            (mockController.createTask as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ success: true });
            });

            await request(app)
                .post('/tasks')
                .send(validPayload)
                .expect(201);

            expect(mockController.createTask).toHaveBeenCalled();
        });
    });

    describe('GET /tasks/user/:userId', () => {
        it('should delegate to controller.getUserTasks on valid userId', async () => {
            const userId = '123e4567-e89b-12d3-a456-426614174000';

            (mockController.getUserTasks as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .get(`/tasks/user/${userId}`)
                .expect(200);

            expect(mockController.getUserTasks).toHaveBeenCalled();
        });
    });

    describe('GET /tasks/:taskId', () => {
        it('should delegate to controller.getTask on valid taskId', async () => {
            const taskId = '123e4567-e89b-12d3-a456-426614174000';

            (mockController.getTask as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .get(`/tasks/${taskId}`)
                .expect(200);

            expect(mockController.getTask).toHaveBeenCalled();
        });
    });

    describe('PUT /tasks/:taskId', () => {
        it('should delegate to controller.updateTask on valid input', async () => {
            const taskId = '123e4567-e89b-12d3-a456-426614174000';
            const validUpdate = {
                title: 'Updated Task',
            };

            (mockController.updateTask as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .put(`/tasks/${taskId}`)
                .send(validUpdate)
                .expect(200);

            expect(mockController.updateTask).toHaveBeenCalled();
        });
    });

    describe('DELETE /tasks/:taskId', () => {
        it('should delegate to controller.deleteTask on valid taskId', async () => {
            const taskId = '123e4567-e89b-12d3-a456-426614174000';

            (mockController.deleteTask as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({ success: true });
            });

            await request(app)
                .delete(`/tasks/${taskId}`)
                .expect(200);

            expect(mockController.deleteTask).toHaveBeenCalled();
        });
    });
});
