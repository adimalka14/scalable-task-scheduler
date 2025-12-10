import { QueueWorker, WorkerJobConfig } from '../../shared/queue/scheduler/worker-scheduler';
import { EVENTS } from '../../shared/queue/queue.constants';
import { initWorkerContainer } from '../../container';
import { IEventBus } from '../../shared/interfaces';

let eventBus: IEventBus;

(async () => {
    const { eventBus: _eventBus } = await initWorkerContainer();
    eventBus = _eventBus;
})();

const remind = async (data) => {
    eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_TIMED_ARRIVAL, data);
};

const jobs: WorkerJobConfig[] = [
    {
        queue: EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
        jobName: EVENTS.SCHEDULER_QUEUE.TASK_REMINDER,
        handler: remind,
        concurrency: 1,
    },
];

const queueWorker = new QueueWorker(jobs);
queueWorker.run();
