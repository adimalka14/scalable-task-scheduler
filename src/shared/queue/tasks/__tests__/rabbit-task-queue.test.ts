import { RabbitTaskQueue } from '../rabbitTaskQueue';
import { Channel } from 'amqplib';

const mockSendToQueue = jest.fn();
const mockAssertQueue = jest.fn();
const mockConsume = jest.fn();
const mockAck = jest.fn();
const mockNack = jest.fn();
const mockPrefetch = jest.fn();

const mockRabbitConnection = {
    getChannel: jest.fn().mockResolvedValue({
        sendToQueue: mockSendToQueue,
        assertQueue: mockAssertQueue,
        consume: mockConsume,
        ack: mockAck,
        nack: mockNack,
        prefetch: mockPrefetch,
    } as unknown as Channel),
};

describe('RabbitTaskQueue', () => {
    let taskQueue: RabbitTaskQueue;

    beforeEach(() => {
        jest.clearAllMocks();
        taskQueue = new RabbitTaskQueue('test-channel', mockRabbitConnection as any);
    });

    describe('enqueue', () => {
        it('should assert the queue and send data', async () => {
            const data = { name: 'Adi' };
            await taskQueue.enqueue('test-queue', data);

            expect(mockAssertQueue).toHaveBeenCalledWith('test-queue', {
                durable: true,
                deadLetterExchange: 'dlx',
                deadLetterRoutingKey: 'dead',
            });

            expect(mockSendToQueue).toHaveBeenCalledWith('test-queue', Buffer.from(JSON.stringify(data)), {
                persistent: true,
            });
        });
    });

    describe('consume', () => {
        it('should register consumer and call handler with parsed data', async () => {
            const handler = jest.fn();
            await taskQueue.consume('test-queue', handler);

            const message = {
                content: Buffer.from(JSON.stringify({ foo: 'bar' })),
                properties: { headers: {} },
            };

            const consumeFn = mockConsume.mock.calls[0][1];
            await consumeFn(message);

            expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
            expect(mockAck).toHaveBeenCalledWith(message);
        });

        it('should nack if handler throws error', async () => {
            const handler = jest.fn().mockRejectedValue(new Error('fail'));
            await taskQueue.consume('test-queue', handler);

            const message = {
                content: Buffer.from(JSON.stringify({ foo: 'bar' })),
                properties: { headers: {} },
            };

            const consumeFn = mockConsume.mock.calls[0][1];
            await consumeFn(message);

            expect(mockNack).toHaveBeenCalledWith(message, false, true);
        });

        it('should nack without requeue if retryCount >= 3', async () => {
            const handler = jest.fn();
            await taskQueue.consume('test-queue', handler);

            const message = {
                content: Buffer.from(JSON.stringify({ foo: 'bar' })),
                properties: {
                    headers: {
                        'x-death': [{ count: 3 }],
                    },
                },
            };

            const consumeFn = mockConsume.mock.calls[0][1];
            await consumeFn(message);

            expect(handler).not.toHaveBeenCalled();
            expect(mockNack).toHaveBeenCalledWith(message, false, false);
        });

        it('should nack and requeue if JSON.parse fails', async () => {
            const handler = jest.fn();
            await taskQueue.consume('test-queue', handler);

            const message = {
                content: Buffer.from('{invalid-json}'),
                properties: { headers: {} },
            };

            const consumeFn = mockConsume.mock.calls[0][1];
            await consumeFn(message);

            expect(handler).not.toHaveBeenCalled();
            expect(mockNack).toHaveBeenCalledWith(message, false, true);
        });
    });
});
