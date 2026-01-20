import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from '../config/env.config';
import logger from '../utils/logger';

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
}

/**
 * RedisConnection - manages only the connection to Redis.
 * No business logic - just connection management.
 */
export class RedisConnection {
    private client: Redis;

    constructor(config?: RedisConfig) {
        const redisConfig = config ?? {
            host: REDIS_HOST,
            port: REDIS_PORT,
            password: REDIS_PASSWORD,
        };

        this.client = new Redis({
            ...redisConfig,
            maxRetriesPerRequest: null,
        });

        this.client.on('connect', () => {
            logger.info('REDIS', 'Connected to Redis');
        });

        this.client.on('error', (err) => {
            logger.error('REDIS', 'Error connecting to Redis', err);
        });
    }

    /**
     * Get the Redis client instance
     */
    getClient(): Redis {
        return this.client;
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        await this.client.quit();
        logger.info('REDIS', 'Disconnected from Redis');
    }
}
