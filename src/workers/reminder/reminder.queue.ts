import { Queue } from 'bullmq';
import { REDIS_HOST, REDIS_PORT } from '../../shared/config/env.config';

export const reminderQueue = new Queue('reminderQueue', {
    connection: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
    },
});
