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
        expect(instance.add).toHaveBeenCalledWith('sendWelcome', { userId: 1 }, undefined);

        // Logger check
        expect(mockLogger.info).toHaveBeenCalledWith('QUEUE', 'Created queue: emails');
    });

    it('should reuse existing queue without creating a new one', async () => {
        await scheduler.scheduleJob('jobs', 'task1', { x: 1 });
        await scheduler.scheduleJob('jobs', 'task2', { x: 2 });

        // Queue should be constructed only once
        expect(Queue).toHaveBeenCalledTimes(1);

        const instance = (scheduler as any).queues.get('jobs');
        expect(instance.add).toHaveBeenCalledWith('task1', { x: 1 }, undefined);
        expect(instance.add).toHaveBeenCalledWith('task2', { x: 2 }, undefined);
    });

    it('should pass delay, attempts, and backoff options', async () => {
        const options = { delay: 5000, attempts: 3, backoff: 2000 };
        await scheduler.scheduleJob('delayed-jobs', 'retryThis', { foo: 'bar' }, options);

        const instance = (scheduler as any).queues.get('delayed-jobs');
        expect(instance.add).toHaveBeenCalledWith('retryThis', { foo: 'bar' }, options);
    });
});
