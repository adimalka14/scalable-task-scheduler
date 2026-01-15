import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import logger from '../../utils/logger';

export type JobHandler<T = any> = (data: T) => Promise<void>;

export interface WorkerJobConfig {
    queue: string;
    jobName: string;
    handler: JobHandler;
    concurrency: number;
}

export class QueueWorker {
    private workers: Worker[] = [];

    constructor(
        private readonly jobs: WorkerJobConfig[],
        private readonly redis: Redis
    ) { }

    run() {
        const grouped = this.groupByQueue();

        for (const [queueName, jobConfigs] of Object.entries(grouped)) {
            const handlerMap = new Map<string, WorkerJobConfig>();
            for (const config of jobConfigs) {
                handlerMap.set(config.jobName, config);
            }

            const concurrency = Math.max(...jobConfigs.map((j) => j.concurrency || 1));

            const worker = new Worker(
                queueName,
                async (job) => {
                    const config = handlerMap.get(job.name);

                    if (!config) {
                        logger.warn('WORKER', `No handler for job: ${job.name}`);
                        return;
                    }

                    try {
                        await config.handler(job.data);
                        logger.info('WORKER', `Job done: ${job.name}`);
                    } catch (err) {
                        logger.error('WORKER', `Job failed: ${job.name}`, err);
                        throw err;
                    }
                },
                {
                    concurrency,
                    connection: this.redis,
                },
            );

            this.workers.push(worker);
        }
    }

    private groupByQueue() {
        return this.jobs.reduce(
            (acc, job) => {
                if (!acc[job.queue]) acc[job.queue] = [];
                acc[job.queue].push(job);
                return acc;
            },
            {} as Record<string, WorkerJobConfig[]>,
        );
    }
}
