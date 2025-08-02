import { EventEmitter } from 'events';
import { IEventBus } from '../../interfaces';
import logger from '../../utils/logger';

export class LocalEventBus implements IEventBus {
    private eventEmitter: EventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(50);
        logger.info('LOCAL EVENT BUS', 'Local event bus initialized');
    }

    async publish(event: string, payload: any): Promise<void> {
        this.eventEmitter.emit(event, payload);
        logger.info('LOCAL EVENT BUS', `Published event '${event}'`, payload);
    }

    async subscribe(event: string, handler: (payload: any) => Promise<void>): Promise<void> {
        this.eventEmitter.on(event, async (payload) => {
            try {
                console.log('Handler received:', payload);
                await handler(payload);
                logger.info('LOCAL EVENT BUS', `Handled '${event}' successfully`);
            } catch (err) {
                logger.error('LOCAL EVENT BUS', `Error handling '${event}'`, err);
            }
        });

        logger.info('LOCAL EVENT BUS', `Subscribed to '${event}'`);
    }
}
