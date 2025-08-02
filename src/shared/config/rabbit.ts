import amqp, { Channel, ChannelModel } from 'amqplib';
import { RABBITMQ_URL } from './env.config';
import logger from '../utils/logger';

export const RABBIT_PREFETCH_COUNT = Number(process.env.RABBIT_PREFETCH_COUNT) || 5;

let connection: ChannelModel;
const channels: Record<string, Channel> = {};
let reconnecting = false;

export async function createConnection(): Promise<void> {
    if (!connection || (connection as any).connection?.stream?.destroyed) {
        try {
            connection = await amqp.connect(RABBITMQ_URL);
            logger.info('RABBITMQ', 'Connected to RabbitMQ');

            (connection as any).connection.on('close', async () => {
                logger.warn('RABBITMQ', 'Connection closed. Reconnecting...');
                if (!reconnecting) {
                    reconnecting = true;
                    await retryConnection();
                }
            });

            (connection as any).connection.on('error', (err: any) => {
                logger.error('RABBITMQ', 'Connection error', err);
            });
        } catch (err) {
            logger.error('RABBITMQ', 'Initial connection failed', err);
            await retryConnection();
        }
    }
}

async function retryConnection() {
    setTimeout(async () => {
        try {
            await createConnection();
            reconnecting = false;
        } catch (err) {
            logger.error('RABBITMQ', 'Retry failed. Retrying again...');
            await retryConnection();
        }
    }, 5000);
}

export async function getChannel(channelName: string = 'default'): Promise<Channel> {
    if (!channels[channelName]) {
        const ch = await connection.createChannel();

        await ch.prefetch(RABBIT_PREFETCH_COUNT);
        logger.info('RABBITMQ', 'Channel created', { channelName });

        await ch.assertExchange('dlx', 'direct', { durable: true });
        await ch.assertQueue('dead-letter', { durable: true });
        await ch.bindQueue('dead-letter', 'dlx', 'dead');

        channels[channelName] = ch;
    }

    return channels[channelName];
}
