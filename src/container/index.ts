import { ICacheService, IEventBus } from '../shared/interfaces';
import { RedisCacheService } from '../shared/cache/cache.service';
import { RabbitEventBus } from '../shared/queue/event-bus';
import redis from '../shared/config/cache.config';
import { USE_CACHE } from '../shared/config/env.config';
import { createConnection as createBrokerConnection, getChannel } from '../shared/config/rabbit';

export let container: any;

export async function initContainer() {
    const cacheService = new RedisCacheService(USE_CACHE, redis) as ICacheService;

    await createBrokerConnection();
    const channel = await getChannel('event-bus');
    const eventBus = new RabbitEventBus(channel) as IEventBus;

    container = {
        cacheService,
        eventBus,
    };
}
