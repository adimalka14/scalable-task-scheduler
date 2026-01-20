import { QueueWorker, WorkerJobConfig } from '../../shared/queue/scheduler/worker-scheduler';
import { EVENTS } from '../../shared/queue/queue.constants';
import { initWorkerContainer } from '../../container';
import { IEventBus } from '../../shared/interfaces';
import { ITaskService } from '../../features/tasks/tasks.interfaces';
import { TaskStatus } from '../../features/tasks/tasks.types';
import type { RedisConnection } from '../../shared/infrastructure';
import logger from '../../shared/utils/logger';

interface WorkerDependencies {
    eventBus: IEventBus;
    taskService: ITaskService;
    redisConnection: RedisConnection;
}

let dependencies: WorkerDependencies | null = null;

async function initializeWorker(): Promise<WorkerDependencies> {
    if (dependencies) {
        return dependencies;
    }

    try {
        logger.info('REMINDER_WORKER', 'Initializing worker dependencies...');
        const container = await initWorkerContainer();
        dependencies = {
            eventBus: container.eventBus,
            taskService: container.taskService,
            redisConnection: container.redisConnection,
        };
        logger.info('REMINDER_WORKER', 'Worker dependencies initialized successfully');
        return dependencies;
    } catch (error) {
        logger.error('REMINDER_WORKER', 'Failed to initialize worker dependencies', { error });
        process.exit(1);
    }
}

const createRemindHandler = (dependencies: WorkerDependencies) => async (data: { taskId: string; userId: string; dueDate: string }) => {
    const { eventBus, taskService } = dependencies;
    const { taskId } = data;

    // 1) Atomic claim: ONLY ONE worker should pass this
    const claimed = await taskService.claimForExecution(taskId);
    if (!claimed) {
        logger.info('REMINDER_WORKER', 'Task not claimable (already handled/cancelled/final)', { taskId });
        return;
    }

    logger.info('REMINDER_WORKER', 'Task claimed for execution', { taskId });

    // 2) Publish event
    try {
        await eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_TIMED_ARRIVAL, data);

        // 3) Finalize success
        await taskService.markExecuted(taskId);
        logger.info('REMINDER_WORKER', 'Task reminder executed successfully', { taskId });
    } catch (error) {
        logger.error('REMINDER_WORKER', 'Failed to publish task timed arrival event', { taskId, error });

        // 4) Finalize failure (retry policy stays in BullMQ OR your attempts policy)
        const updatedTask = await taskService.markPublishFailed(
            taskId,
            error instanceof Error ? error.message : 'Failed to publish event',
        );

        if (updatedTask.status === TaskStatus.FAILED) {
            logger.error('REMINDER_WORKER', 'Task failed after max attempts', {
                taskId,
                attempts: updatedTask.attempts,
            });
        } else {
            logger.info('REMINDER_WORKER', 'Task will be retried', {
                taskId,
                attempts: updatedTask.attempts,
            });
        }
    }
};

async function startWorker() {
    try {
        // Initialize dependencies before starting the worker
        const dependencies = await initializeWorker();
        const { redisConnection } = dependencies;

        // Create handler with injected dependencies
        const remindHandler = createRemindHandler(dependencies);

        const jobs: WorkerJobConfig[] = [
            {
                queue: EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                jobName: EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
                handler: remindHandler,
                concurrency: 1,
            },
        ];

        const queueWorker = new QueueWorker(jobs, redisConnection.getClient());
        queueWorker.run();

        logger.info('REMINDER_WORKER', 'Reminder worker started successfully');
    } catch (error) {
        logger.error('REMINDER_WORKER', 'Failed to start reminder worker', { error });
        process.exit(1);
    }
}

// Start the worker
startWorker();
