import { Channel } from 'amqplib';
import { RabbitEventBus } from '../rabbit-event-bus';
import { getChannel } from '../../../config/rabbit';

jest.mock('../../../config/rabbit', () => ({
    getChannel: jest.fn(),
    RABBIT_PREFETCH_COUNT: 5,
}));

const mockPublish = jest.fn();
const mockAssertExchange = jest.fn();
const mockConsume = jest.fn();
const mockAck = jest.fn();
const mockNack = jest.fn();
const mockBindQueue = jest.fn();
const mockAssertQueue = jest.fn().mockResolvedValue({ queue: 'mockQueue' });
const prefetch = jest.fn();

(getChannel as jest.Mock).mockResolvedValue({
    publish: mockPublish,
    assertExchange: mockAssertExchange,
    consume: mockConsume,
    ack: mockAck,
    nack: mockNack,
    bindQueue: mockBindQueue,
    assertQueue: mockAssertQueue,
    prefetch,
} as unknown as Channel);

describe('RabbitEventBus', () => {
    let eventBus: RabbitEventBus;

    beforeEach(() => {
        jest.clearAllMocks();
        eventBus = new RabbitEventBus('event-bus');
    });

    it('should publish event with correct payload', async () => {
        const payload = { $message: 'Hello' };
        await eventBus.publish('order.created', payload);

        expect(mockAssertExchange).toHaveBeenCalledWith('order.created', 'fanout', { durable: true });
        expect(mockPublish).toHaveBeenCalledWith('order.created', '', Buffer.from(JSON.stringify(payload)), {
            persistent: true,
        });
    });

    it('should subscribe and handle messages', async () => {
        const mockHandler = jest.fn();
        await eventBus.subscribe('order.created', mockHandler);

        expect(mockAssertExchange).toHaveBeenCalledWith('order.created', 'fanout', { durable: true });
        expect(mockAssertQueue).toHaveBeenCalled();
        expect(mockBindQueue).toHaveBeenCalledWith('mockQueue', 'order.created', '');
        expect(mockConsume).toHaveBeenCalledWith('mockQueue', expect.any(Function));
        expect(prefetch).toHaveBeenCalledWith(5);
    });

    it('should call the handler with parsed payload and ack', async () => {
        const mockHandler = jest.fn();
        await eventBus.subscribe('order.created', mockHandler);

        const payload = { some: 'data' };
        const message = {
            content: Buffer.from(JSON.stringify(payload)),
            properties: { headers: {} },
        };

        const consumeFn = mockConsume.mock.calls[0][1]!;
        await consumeFn(message);

        expect(mockHandler).toHaveBeenCalledWith(payload);
        expect(mockAck).toHaveBeenCalledWith(message);
    });

    it('should nack the message if handler throws error', async () => {
        const mockHandler = jest.fn().mockRejectedValue(new Error('handler failed'));
        await eventBus.subscribe('order.created', mockHandler);

        const message = {
            content: Buffer.from(JSON.stringify({})),
            properties: { headers: {} },
        };

        const consumeFn = mockConsume.mock.calls[0][1]!;
        await consumeFn(message);

        expect(mockNack).toHaveBeenCalledWith(message, false, true);
    });

    it('should nack without requeue if retryCount >= 3', async () => {
        const mockHandler = jest.fn();
        await eventBus.subscribe('order.created', mockHandler);

        const message = {
            content: Buffer.from(JSON.stringify({})),
            properties: {
                headers: {
                    'x-death': [{ count: 3 }],
                },
            },
        };

        const consumeFn = mockConsume.mock.calls[0][1]!;
        await consumeFn(message);

        expect(mockHandler).not.toHaveBeenCalled();
        expect(mockNack).toHaveBeenCalledWith(message, false, false);
    });

    it('should nack if message content is invalid JSON', async () => {
        const mockHandler = jest.fn();
        await eventBus.subscribe('order.created', mockHandler);

        const message = {
            content: Buffer.from('{invalid-json'),
            properties: { headers: {} },
        };

        const consumeFn = mockConsume.mock.calls[0][1]!;
        await consumeFn(message);

        expect(mockHandler).not.toHaveBeenCalled();
        expect(mockNack).toHaveBeenCalledWith(message, false, true);
    });

    it('should not crash if x-death is undefined', async () => {
        const mockHandler = jest.fn();
        await eventBus.subscribe('order.created', mockHandler);

        const message = {
            content: Buffer.from(JSON.stringify({})),
            properties: {
                headers: {
                    'x-death': undefined,
                },
            },
        };

        const consumeFn = mockConsume.mock.calls[0][1]!;
        await consumeFn(message);

        expect(mockHandler).toHaveBeenCalled();
        expect(mockAck).toHaveBeenCalledWith(message);
    });
});
