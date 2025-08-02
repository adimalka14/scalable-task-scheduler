import { ITaskService, INotificationService, IEventBus } from '../shared/interfaces';
import logger from '../shared/utils/logger';

export class TaskReminderWorker {
    private taskService: ITaskService;
    private notificationService: INotificationService;
    private eventBus: IEventBus;

    constructor(
        taskService: ITaskService,
        notificationService: INotificationService,
        eventBus: IEventBus
    ) {
        this.taskService = taskService;
        this.notificationService = notificationService;
        this.eventBus = eventBus;
    }

    async handleTaskReminder(taskData: { taskId: string }): Promise<void> {
        try {
            logger.info(`Processing task reminder for task: ${taskData.taskId}`);

            // Get the task details
            const task = await this.taskService.getTask(taskData.taskId);
            
            if (!task) {
                logger.warn(`Task not found: ${taskData.taskId}`);
                return;
            }

            // Handle the reminder through notification service
            await this.notificationService.handleTaskReminder({
                taskId: task.id,
                title: task.title,
                userId: task.userId,
            });

            logger.info(`Task reminder processed successfully for task: ${taskData.taskId}`);
        } catch (error) {
            logger.error('Error processing task reminder:', error);
            throw error;
        }
    }

    async subscribeToEvents(): Promise<void> {
        try {
            // Subscribe to task reminder events
            await this.eventBus.subscribe('task.reminder', async (payload) => {
                await this.handleTaskReminder(payload);
            });

            // Subscribe to task creation events
            await this.eventBus.subscribe('task.created', async (payload) => {
                logger.info(`Task created event received: ${payload.taskId}`);
            });

            // Subscribe to task update events
            await this.eventBus.subscribe('task.updated', async (payload) => {
                logger.info(`Task updated event received: ${payload.taskId}`);
            });

            // Subscribe to task deletion events
            await this.eventBus.subscribe('task.deleted', async (payload) => {
                logger.info(`Task deleted event received: ${payload.taskId}`);
            });

            // Subscribe to notification events
            await this.eventBus.subscribe('notification.created', async (payload) => {
                logger.info(`Notification created event received: ${payload.notificationId}`);
            });

            await this.eventBus.subscribe('notification.sent', async (payload) => {
                logger.info(`Notification sent event received: ${payload.notificationId}`);
            });

            logger.info('Task reminder worker subscribed to events successfully');
        } catch (error) {
            logger.error('Error subscribing to events:', error);
            throw error;
        }
    }

    async start(): Promise<void> {
        try {
            await this.subscribeToEvents();
            logger.info('Task reminder worker started successfully');
        } catch (error) {
            logger.error('Error starting task reminder worker:', error);
            throw error;
        }
    }
} 