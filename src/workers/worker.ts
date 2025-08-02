import { Worker } from 'bullmq';
import redis from '../redis';
import { logger } from '../utils/logger';

export class QueueWorker {
    constructor(
        private readonly queueName: string,
        private readonly handler: (job: any) => Promise<void>,
    ) {}

    run() {
        const worker = new Worker(
            this.queueName,
            async (job) => {
                logger.info('WORKER', `Received job ${job.name}`);
                await this.handler(job);
            },
            { connection: redis },
        );

        worker.on('completed', (job) => {
            logger.info('WORKER', `Completed job ${job.id}`);
        });

        worker.on('failed', (job, err) => {
            logger.error('WORKER', `Failed job ${job?.id}`, err);
        });

        return worker;
    }
}
