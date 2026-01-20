import { ITaskQueue } from '../../interfaces';
import type { RabbitMQConnection } from '../../infrastructure';
import { RABBITMQ_PREFETCH_COUNT } from '../../config/env.config';
import logger from '../../utils/logger';

export class RabbitTaskQueue implements ITaskQueue {
    constructor(
        private readonly channelName = 'default',
        private readonly rabbitConnection?: RabbitMQConnection,
        private readonly prefetchCount = RABBITMQ_PREFETCH_COUNT,
    ) {}

    async enqueue<T>(queue: string, data: T): Promise<void> {
        const channel = await this.rabbitConnection!.getChannel(this.channelName);
        await channel.assertQueue(queue, {
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dead',
        });

        await channel.prefetch(this.prefetchCount);

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
            persistent: true,
        });

        logger.info('QUEUE', `Enqueued task to '${queue}'`, data);
    }

    async consume<T>(queue: string, handler: (data: T) => Promise<void>): Promise<void> {
        const channel = await this.rabbitConnection!.getChannel(this.channelName);
        await channel.assertQueue(queue, {
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dead',
        });

        await channel.prefetch(5);

        // No need to await consume – it's a registration, not a blocking call
        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());

                const headers = msg.properties.headers ?? {};
                const xDeath = headers['x-death'] as Array<{ count: number }> | undefined;
                const retryCount = xDeath?.[0]?.count ?? 0;

                if (retryCount >= 3) {
                    logger.warn('QUEUE', `Max retries reached for '${queue}'`);
                    channel.nack(msg, false, false); // move to DLQ
                    return;
                }

                await handler(data);
                channel.ack(msg);
            } catch (err) {
                logger.error('QUEUE', `Error processing task from '${queue}'`, err);
                channel.nack(msg, false, true); // retry later
            }
        });

        logger.info('QUEUE', `Consuming from '${queue}'`);
    }
}
