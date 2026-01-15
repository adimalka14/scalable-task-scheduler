jest.mock('bullmq', () => ({
    Worker: jest.fn().mockImplementation((_queue, fn, _options) => ({
        name: _queue,
        process: fn,
        close: jest.fn(),
    })),
}));

jest.mock('../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

import { Worker } from 'bullmq';
import { QueueWorker } from '../worker-scheduler';
import logger from '../../../utils/logger';

const redisMock = {};

describe('Bull Worker Scheduler', () => {
    it('should create one Worker per queue', () => {
        const jobs = [
            { queue: 'email', jobName: 'sendEmail', handler: jest.fn(), concurrency: 2 },
            { queue: 'notifications', jobName: 'sendPush', handler: jest.fn(), concurrency: 1 },
        ];

        const queueWorker = new QueueWorker(jobs, redisMock as any);
        queueWorker.run();

        expect(Worker).toHaveBeenCalledTimes(2);
    });

    it('should call the correct handler when job is processed', async () => {
        const handler = jest.fn().mockResolvedValue(undefined);

        const jobs = [{ queue: 'email', jobName: 'sendEmail', handler, concurrency: 1 }];

        const queueWorker = new QueueWorker(jobs, redisMock as any);

        queueWorker.run();

        const called = (Worker as unknown as jest.Mock).mock.calls[0][1];

        await called({ name: 'sendEmail', data: { to: 'test@test.com' } });

        expect(handler).toHaveBeenCalledWith({ to: 'test@test.com' });
    });

    it('should log a warning if no handler is found', async () => {
        const jobs = [{ queue: 'tasks', jobName: 'task1', handler: jest.fn(), concurrency: 1 }];

        const warnSpy = jest.spyOn(logger, 'warn');

        const queueWorker = new QueueWorker(jobs, redisMock as any);
        queueWorker.run();

        const fn = (Worker as unknown as jest.Mock).mock.calls[0][1];
        await fn({ name: 'unknownJob', data: {} });

        expect(warnSpy).toHaveBeenCalledWith('WORKER', 'No handler for job: unknownJob');
    });

    it('should log error and throw if handler fails', async () => {
        const handler = jest.fn().mockRejectedValue(new Error('handler failed'));
        const jobs = [{ queue: 'email', jobName: 'sendEmail', handler, concurrency: 1 }];

        const errorSpy = jest.spyOn(logger, 'error');

        const queueWorker = new QueueWorker(jobs, redisMock as any);
        queueWorker.run();

        const fn = (Worker as unknown as jest.Mock).mock.calls[0][1];

        await expect(fn({ name: 'sendEmail', data: {} })).rejects.toThrow('handler failed');
        expect(errorSpy).toHaveBeenCalledWith('WORKER', 'Job failed: sendEmail', expect.any(Error));
    });

    it('should use max concurrency for queue', () => {
        const jobs = [
            { queue: 'same', jobName: 'job1', handler: jest.fn(), concurrency: 1 },
            { queue: 'same', jobName: 'job2', handler: jest.fn(), concurrency: 5 },
        ];

        const queueWorker = new QueueWorker(jobs, redisMock as any);
        queueWorker.run();

        expect(Worker).toHaveBeenCalledWith('same', expect.any(Function), expect.objectContaining({ concurrency: 5 }));
    });
});
