import { Queue, JobsOptions } from 'bullmq';
import { ISchedulerQueue } from '../../interfaces';
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
        options?: { delay?: number; attempts?: number; backoff?: number; jobId?: string },
    ) {
        const queue = this.getQueue(queueName);
        const cleanedOptions = Object.fromEntries(
            Object.entries({
                jobId: options?.jobId,
                delay: options?.delay,
                attempts: options?.attempts,
                backoff: options?.backoff,
            }).filter(([_, v]) => v !== undefined),
        ) as JobsOptions;

        await queue.add(jobName, data, cleanedOptions);
        logger.info('QUEUE', `Scheduled job ${jobName} in ${queueName}`);
    }

    async cancelJob(queueName: string, jobId: string): Promise<void> {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(jobId);
        if (job) {
            await job.remove();
            logger.info('QUEUE', `Removed job ${jobId} from ${queueName}`);
        }
    }

    async getJob(queueName: string, jobId: string): Promise<any | null> {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(jobId);
        return job ? job.data : null;
    }

    async updateJob<T>(queueName: string, jobId: string, data: T, delay: number = 0): Promise<void> {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(jobId);
        if (job) {
            await job.remove(); // remove old
        }
        await queue.add(job.name, data, {
            jobId,
            delay,
        });
        logger.info('QUEUE', `Updated job ${jobId} in ${queueName}`);
    }
}
