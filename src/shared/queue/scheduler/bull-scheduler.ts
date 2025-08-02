import { Queue } from 'bullmq';
import { ISchedulerQueue } from '../../interfaces/ISchedulerQueue';
import redis from '../../config/cache.config';
import logger from '../../utils/logger';

export class BullScheduler implements ISchedulerQueue {
    private queues: Map<string, Queue> = new Map();

    private getQueue(name: string): Queue {
        if (!this.queues.has(name)) {
            const queue = new Queue(name, {
                connection: redis,
            });

            this.queues.set(name, queue);
            logger.info('QUEUE', `Created queue: ${name}`);
        }

        return this.queues.get(name)!;
    }

    async scheduleJob<T>(
        queueName: string,
        jobName: string,
        data: T,
        options?: { delay?: number; attempts?: number; backoff?: number },
    ) {
        const queue = this.getQueue(queueName);
        await queue.add(jobName, data, options);
    }
}
