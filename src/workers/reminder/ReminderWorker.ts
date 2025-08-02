import { Worker, Job } from 'bullmq';
import { IEventBus } from '../../infra/event-bus/IEventBus';
import { ILogger } from '../../utils/logger.interface';

export interface ReminderWorkerConfig {
    queueName: string;
    redis: {
        host: string;
        port: number;
    };
}

export interface IReminderWorker {
    start(): void;
    shutdown(): Promise<void>;
}

export class ReminderWorker implements IReminderWorker {
    private readonly worker: Worker;

    constructor(
        private readonly config: ReminderWorkerConfig,
        private readonly eventBus: IEventBus,
        private readonly logger: ILogger,
    ) {
        this.worker = new Worker(this.config.queueName, this.handleJob.bind(this), { connection: this.config.redis });
    }

    private async handleJob(job: Job) {
        const { taskId } = job.data;
        this.logger.info('ReminderWorker', `Task ready: ${taskId}`);
        await this.eventBus.publish('task.ready', { taskId });
    }

    public start(): void {
        this.logger.info('ReminderWorker', `Started on queue: ${this.config.queueName}`);
    }

    public async shutdown(): Promise<void> {
        await this.worker.close();
        this.logger.info('ReminderWorker', `Stopped`);
    }
}
