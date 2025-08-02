import { IEventBus } from '../../interfaces';
import { getChannel, RABBIT_PREFETCH_COUNT } from '../../config/rabbit';
import logger from '../../utils/logger';

export class RabbitEventBus implements IEventBus {
    constructor(
        private readonly channelName: string = 'event-bus',
        private readonly prefetchCount = RABBIT_PREFETCH_COUNT,
    ) {}

    async publish(event: string, payload: any): Promise<void> {
        const channel = await getChannel(this.channelName);
        await channel.assertExchange(event, 'fanout', { durable: true });

        const buffer = Buffer.from(JSON.stringify(payload));
        channel.publish(event, '', buffer, { persistent: true });

        logger.info('EVENT BUS', `Published event '${event}'`, payload);
    }

    async subscribe(event: string, handler: (payload: any) => Promise<void>): Promise<void> {
        const channel = await getChannel(this.channelName);
        await channel.assertExchange(event, 'fanout', { durable: true });

        const { queue } = await channel.assertQueue('', {
            exclusive: true,
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dead',
        });

        await channel.bindQueue(queue, event, '');
        await channel.prefetch(this.prefetchCount);

        // No need to await consume – it's a registration, not a blocking call
        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const payload = JSON.parse(msg.content.toString());

                const headers = msg.properties.headers ?? {};
                const xDeath = headers['x-death'] as Array<{ count: number }> | undefined;
                const retryCount = xDeath?.[0]?.count ?? 0;

                if (retryCount >= 3) {
                    logger.warn('EVENT BUS', `Max retries reached for event '${event}'`);
                    channel.nack(msg, false, false);
                    return;
                }

                await handler(payload);
                channel.ack(msg);
            } catch (err) {
                logger.error('EVENT BUS', `Error handling event '${event}'`, err);
                channel.nack(msg, false, true);
            }
        });

        logger.info('EVENT BUS', `Subscribed to '${event}'`);
    }
}
