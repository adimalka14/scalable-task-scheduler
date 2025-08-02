import { Worker } from 'bullmq';
import { REDIS_HOST, REDIS_PORT } from '../../shared/config/env.config';
import { container } from '../container';
import logger from '../../utils/logger';

new Worker(
    'reminderQueue',
    async (job) => {
        const { taskId } = job.data;
        logger.info('Worker', `Executing reminder for task: ${taskId}`);
        eventBus.publish('task.ready', { taskId });
    },
    {
        connection: {
            host: REDIS_HOST,
            port: Number(REDIS_PORT),
        },
    },
);
