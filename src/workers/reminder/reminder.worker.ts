import { QueueWorker, WorkerJobConfig } from '../../shared/queue/scheduler/worker-scheduler';

const remind = async (data) => {
    console.log('reminder job data', data);
};

const jobs: WorkerJobConfig[] = [
    {
        queue: 'reminders',
        jobName: 'reminder',
        handler: remind,
        concurrency: 1,
    },
];

const queueWorker = new QueueWorker(jobs);
queueWorker.run();
