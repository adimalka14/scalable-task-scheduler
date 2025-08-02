import { Worker, Job } from 'bullmq';
import logger from '../shared/utils/logger';
import { RedisOptions } from 'ioredis';

export type JobHandler<T = any> = (data: T, job: Job) => Promise<void>;

export interface WorkerJob {
    name: string;
    handler: JobHandler;
}

export interface AppWorkerConfig {
    queueName: string;
    redis: RedisOptions;
    jobs: WorkerJob[];
    concurrency: number;
}

export class AppWorker {
    private worker: Worker;

    constructor(private readonly config: AppWorkerConfig) {
        const processor = async (job: Job) => {
            const jobEntry = this.config.jobs.find((j) => j.name === job.name);
            if (!jobEntry) {
                logger.warn('AppWorker', `No handler for job: ${job.name}`);
                return;
            }

            try {
                await jobEntry.handler(job.data, job);
                logger.info('AppWorker', `Handled job: ${job.name}`);
            } catch (err) {
                logger.error('AppWorker', `Failed to handle job: ${job.name}`, err);
            }
        };

        this.worker = new Worker(this.config.queueName, processor, {
            connection: this.config.redis,
            concurrency: this.config.concurrency,
        });

        logger.info('AppWorker', `Worker started for queue: ${this.config.queueName}`);
    }

    async shutdown(): Promise<void> {
        await this.worker.close();
        logger.info('AppWorker', 'Worker stopped');
    }
}
