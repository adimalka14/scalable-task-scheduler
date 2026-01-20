import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import path from 'path';

const configPath = path.resolve(process.cwd(), '.env');

expand(config({ path: configPath }));

export const NODE_ENV = process.env.NODE_ENV ?? 'local';

export const PORT = +(process.env.PORT ?? 3000);

export const DATABASE_URL = process.env.DATABASE_URL;

export const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@127.0.0.1:5672';
export const RABBITMQ_PREFETCH_COUNT = +(process.env.RABBITMQ_PREFETCH_COUNT ?? 5);

export const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
export const REDIS_PORT = +(process.env.REDIS_PORT ?? 6379);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? undefined;
export const USE_CACHE = process.env.USE_CACHE?.toLowerCase() === 'true' || false;

export const SESSION_SECRET = process.env.SESSION_SECRET ?? 'default_secret';
export const LOGGING_MODE = process.env.LOGGING_MODE ?? 'silly';
export const LOGGING_LINE_TRACE: string[] = process.env.LOGGING_LINE_TRACE?.split(',') ?? ['error'];
export const LOG_DIR_PATH = path.resolve(__dirname, '../../..', 'logs');
