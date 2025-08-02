import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from './env.config';
import logger from '../utils/logger';

const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD
});

redis.on('connect', () => {
    logger.info('SYSTEM', 'Connected to Redis');
});

redis.on('error', (err) => {
    logger.error('SYSTEM', 'Error connecting to Redis', err);
});

export default redis;