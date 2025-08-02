import { LocalEventBus } from '../local-event-bus';

describe('LocalEventBus', () => {
    let bus: LocalEventBus;

    beforeEach(() => {
        bus = new LocalEventBus();
    });

    it('should call handler when event is published', async () => {
        const handler = jest.fn();
        await bus.subscribe('test.event', handler);

        await bus.publish('test.event', { $message: 'hello' });

        expect(handler).toHaveBeenCalledWith({ $message: 'hello' });
    });

    it('should support multiple handlers for the same event', async () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        await bus.subscribe('multi.event', handler1);
        await bus.subscribe('multi.event', handler2);

        await bus.publish('multi.event', { data: 123 });

        expect(handler1).toHaveBeenCalledWith({ data: 123 });
        expect(handler2).toHaveBeenCalledWith({ data: 123 });
    });

    it('should do nothing if no handlers exist', async () => {
        // Should not throw
        await expect(bus.publish('no.listeners', {})).resolves.not.toThrow();
    });

    it('should continue calling other handlers even if one throws', async () => {
        const handler1 = jest.fn().mockImplementation(() => {
            throw new Error('Handler failed');
        });
        const handler2 = jest.fn();

        await bus.subscribe('faulty.event', handler1);
        await bus.subscribe('faulty.event', handler2);

        await expect(bus.publish('faulty.event', {})).resolves.not.toThrow();

        expect(handler1).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
    });
});
