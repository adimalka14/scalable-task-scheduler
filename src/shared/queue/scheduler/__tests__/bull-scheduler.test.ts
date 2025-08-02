const redisMock = {};
jest.mock('../../../config/cache.config', () => redisMock);
const mockLogger = {
    info: jest.fn(),
};
jest.mock('../../../utils/logger', () => mockLogger);

import { BullScheduler } from '../bull-scheduler';
import { Queue } from 'bullmq';

jest.mock('bullmq', () => {
    return {
        Queue: jest.fn().mockImplementation((name: string) => ({
            name,
            add: jest.fn(),
        })),
    };
});

describe('BullScheduler', () => {
    let scheduler: BullScheduler;

    beforeEach(() => {
        jest.clearAllMocks();
        scheduler = new BullScheduler();
    });

    it('should create a queue and store it internally', async () => {
        await scheduler.scheduleJob('emails', 'sendWelcome', { userId: 1 });

        // Check that Queue constructor was called
        expect(Queue).toHaveBeenCalledWith('emails', { connection: redisMock });

        // Check that job was added
        const instance = (scheduler as any).queues.get('emails');
        expect(instance.add).toHaveBeenCalledWith('sendWelcome', { userId: 1 }, {});

        // Logger check
        expect(mockLogger.info).toHaveBeenCalledWith('QUEUE', 'Created queue: emails');
    });

    it('should reuse existing queue without creating a new one', async () => {
        await scheduler.scheduleJob('jobs', 'task1', { x: 1 });
        await scheduler.scheduleJob('jobs', 'task2', { x: 2 });

        // Queue should be constructed only once
        expect(Queue).toHaveBeenCalledTimes(1);

        const instance = (scheduler as any).queues.get('jobs');
        expect(instance.add).toHaveBeenCalledWith('task1', { x: 1 }, {});
        expect(instance.add).toHaveBeenCalledWith('task2', { x: 2 }, {});
    });

    it('should pass delay, attempts, and backoff options', async () => {
        const options = { delay: 5000, attempts: 3, backoff: 2000 };
        await scheduler.scheduleJob('delayed-jobs', 'retryThis', { foo: 'bar' }, options);

        const instance = (scheduler as any).queues.get('delayed-jobs');
        expect(instance.add).toHaveBeenCalledWith('retryThis', { foo: 'bar' }, options);
    });

    it('should cancel a job if it exists', async () => {
        const remove = jest.fn();
        const mockJob = { remove };
        const getJob = jest.fn().mockResolvedValue(mockJob);
        const queueInstance = { add: jest.fn(), getJob };

        (Queue as unknown as jest.Mock).mockImplementation(() => queueInstance);

        await scheduler.cancelJob('cancel-queue', 'job-1');

        expect(getJob).toHaveBeenCalledWith('job-1');
        expect(remove).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('QUEUE', 'Removed job job-1 from cancel-queue');
    });

    it('should update a job by removing and re-adding it', async () => {
        const remove = jest.fn();
        const jobName = 'my-task';
        const mockJob = { remove, name: jobName };
        const getJob = jest.fn().mockResolvedValue(mockJob);
        const add = jest.fn();

        const queueInstance = { getJob, add };
        (Queue as unknown as jest.Mock).mockImplementation(() => queueInstance);

        await scheduler.updateJob('update-queue', 'job-2', { data: 123 }, 3000);

        expect(getJob).toHaveBeenCalledWith('job-2');
        expect(remove).toHaveBeenCalled();
        expect(add).toHaveBeenCalledWith(
            jobName,
            { data: 123 },
            {
                jobId: 'job-2',
                delay: 3000,
            },
        );

        expect(mockLogger.info).toHaveBeenCalledWith('QUEUE', 'Updated job job-2 in update-queue');
    });

    it('should return job data when found', async () => {
        const getJob = jest.fn().mockResolvedValue({ data: { a: 1 } });
        const queueInstance = { getJob, add: jest.fn() };

        (Queue as unknown as jest.Mock).mockImplementation(() => queueInstance);

        const result = await scheduler.getJob('read-queue', 'job-3');
        expect(result).toEqual({ a: 1 });
    });

    it('should return null when job not found', async () => {
        const getJob = jest.fn().mockResolvedValue(null);
        const queueInstance = { getJob, add: jest.fn() };

        (Queue as unknown as jest.Mock).mockImplementation(() => queueInstance);

        const result = await scheduler.getJob('read-queue', 'job-4');
        expect(result).toBeNull();
    });
});
