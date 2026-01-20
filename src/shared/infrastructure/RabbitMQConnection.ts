import amqp, { Channel, ChannelModel } from 'amqplib';
import { RABBITMQ_URL, RABBITMQ_PREFETCH_COUNT } from '../config/env.config';
import logger from '../utils/logger';

/**
 * RabbitMQConnection - manages only the connection to RabbitMQ.
 * Preserves all original connection/reconnection logic.
 */
export class RabbitMQConnection {
    private connection: ChannelModel | null = null;
    private channels: Record<string, Channel> = {};
    private reconnecting = false;
    private url: string;

    constructor(url?: string) {
        this.url = url ?? RABBITMQ_URL;
    }

    /**
     * Create connection to RabbitMQ (preserves original logic)
     */
    async createConnection(): Promise<void> {
        if (!this.connection || (this.connection as any).connection?.stream?.destroyed) {
            try {
                this.connection = await amqp.connect(this.url);
                logger.info('RABBITMQ', 'Connected to RabbitMQ');

                (this.connection as any).connection.on('close', async () => {
                    logger.warn('RABBITMQ', 'Connection closed. Reconnecting...');
                    if (!this.reconnecting) {
                        this.reconnecting = true;
                        await this.retryConnection();
                    }
                });

                (this.connection as any).connection.on('error', (err: any) => {
                    logger.error('RABBITMQ', 'Connection error', err);
                });
            } catch (err) {
                logger.error('RABBITMQ', 'Initial connection failed', err);
                await this.retryConnection();
            }
        }
    }

    /**
     * Get or create a channel (preserves original logic)
     */
    async getChannel(channelName: string = 'default'): Promise<Channel> {
        if (!this.channels[channelName]) {
            if (!this.connection) {
                throw new Error('RabbitMQ connection not established');
            }

            const ch = await this.connection.createChannel();

            await ch.prefetch(RABBITMQ_PREFETCH_COUNT);
            logger.info('RABBITMQ', 'Channel created', { channelName });

            await ch.assertExchange('dlx', 'direct', { durable: true });
            await ch.assertQueue('dead-letter', { durable: true });
            await ch.bindQueue('dead-letter', 'dlx', 'dead');

            this.channels[channelName] = ch;
        }

        return this.channels[channelName];
    }

    /**
     * Disconnect from RabbitMQ
     */
    async disconnect(): Promise<void> {
        for (const channel of Object.values(this.channels)) {
            await channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
        logger.info('RABBITMQ', 'Disconnected from RabbitMQ');
    }

    /**
     * Retry connection logic (preserves original logic)
     */
    private async retryConnection(): Promise<void> {
        setTimeout(async () => {
            try {
                await this.createConnection();
                this.reconnecting = false;
            } catch (err) {
                logger.error('RABBITMQ', 'Retry failed. Retrying again...');
                await this.retryConnection();
            }
        }, 5000);
    }
}
