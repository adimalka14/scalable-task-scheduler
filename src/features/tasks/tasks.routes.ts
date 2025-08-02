import { Router } from 'express';
import { TaskController } from './tasks.controller';
import { validateBodyMW } from '../../shared/middlewares/validationErrorHandler.mw';
import { createTaskSchema, updateTaskSchema, taskIdSchema, userIdSchema } from './tasks.validators';

export function createTaskRoutes(taskController: TaskController): Router {
    const router = Router();

    router.post('/', validateBodyMW(createTaskSchema), (req, res) => taskController.createTask(req, res));
    router.get('/:taskId', (req, res) => taskController.getTask(req, res));
    router.put('/:taskId', validateBodyMW(updateTaskSchema), (req, res) => taskController.updateTask(req, res));
    router.delete('/:taskId', (req, res) => taskController.deleteTask(req, res));
    router.get('/user/:userId', (req, res) => taskController.getUserTasks(req, res));

    return router;
} 