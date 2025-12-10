import { Router } from 'express';
import { TaskController } from './tasks.controller';
import { validateBodyMW, validateParamsMW } from '../../shared/middlewares';
import { createTaskSchema, updateTaskSchema, taskIdSchema, userIdSchema } from './tasks.validators';

export function createTaskRoutes(taskController: TaskController): Router {
    const router = Router();

    /**
     * @swagger
     * /tasks:
     *   post:
     *     summary: Create a new task
     *     tags: [Tasks]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - title
     *               - dueDate
     *               - userId
     *             properties:
     *               title:
     *                 type: string
     *                 description: Task title
     *                 example: "Complete project documentation"
     *               dueDate:
     *                 type: string
     *                 format: date-time
     *                 description: Task due date
     *                 example: "2025-12-25T10:00:00Z"
     *               userId:
     *                 type: string
     *                 description: User ID who owns the task
     *                 example: "user-123"
     *     responses:
     *       201:
     *         description: Task created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Task'
     *       400:
     *         description: Bad request - validation error
     *       500:
     *         description: Internal server error
     */
    router.post('/', validateBodyMW(createTaskSchema), (req, res, next) => taskController.createTask(req, res, next));

    /**
     * @swagger
     * /tasks/user/{userId}:
     *   get:
     *     summary: Get all tasks for a specific user
     *     tags: [Tasks]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *         example: "user-123"
     *     responses:
     *       200:
     *         description: List of user tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Task'
     *       400:
     *         description: Bad request - validation error
     *       500:
     *         description: Internal server error
     */
    router.get('/user/:userId', validateParamsMW(userIdSchema), (req, res, next) =>
        taskController.getUserTasks(req, res, next),
    );

    /**
     * @swagger
     * /tasks/{taskId}:
     *   get:
     *     summary: Get a task by ID
     *     tags: [Tasks]
     *     parameters:
     *       - in: path
     *         name: taskId
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *         example: "7cf4cbf6-c06b-492b-bfdd-44574af451"
     *     responses:
     *       200:
     *         description: Task details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Task'
     *       400:
     *         description: Bad request - validation error
     *       404:
     *         description: Task not found
     *       500:
     *         description: Internal server error
     */
    router.get('/:taskId', validateParamsMW(taskIdSchema), (req, res, next) => taskController.getTask(req, res, next));

    /**
     * @swagger
     * /tasks/{taskId}:
     *   put:
     *     summary: Update a task
     *     tags: [Tasks]
     *     parameters:
     *       - in: path
     *         name: taskId
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *         example: "7cf4cbf6-c06b-492b-bfdd-44574af451"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *                 description: Task title
     *                 example: "Updated task title"
     *               dueDate:
     *                 type: string
     *                 format: date-time
     *                 description: Task due date
     *                 example: "2025-12-30T10:00:00Z"
     *     responses:
     *       200:
     *         description: Task updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Task'
     *       400:
     *         description: Bad request - validation error
     *       404:
     *         description: Task not found
     *       500:
     *         description: Internal server error
     */
    router.put('/:taskId', validateBodyMW(updateTaskSchema), (req, res, next) =>
        taskController.updateTask(req, res, next),
    );

    /**
     * @swagger
     * /tasks/{taskId}:
     *   delete:
     *     summary: Delete a task
     *     tags: [Tasks]
     *     parameters:
     *       - in: path
     *         name: taskId
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *         example: "7cf4cbf6-c06b-492b-bfdd-44574af451"
     *     responses:
     *       200:
     *         description: Task deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Task deleted successfully"
     *       404:
     *         description: Task not found
     *       500:
     *         description: Internal server error
     */
    router.delete('/:taskId', (req, res, next) => taskController.deleteTask(req, res, next));

    return router;
}
