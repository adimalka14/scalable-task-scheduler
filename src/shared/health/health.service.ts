import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import logger from '../utils/logger';
import type { DatabaseConnection } from '../infrastructure/DatabaseConnection';
import type { RedisConnection } from '../infrastructure/RedisConnection';
import type { RabbitMQConnection } from '../infrastructure/RabbitMQConnection';

export interface HealthCheckResult {
    database: boolean;
    redis: boolean;
    rabbitmq: boolean;
}

export interface HealthCheckResponse {
    success: boolean;
    checks: HealthCheckResult;
    timestamp: string;
    error?: string;
}

/**
 * HealthService - performs health checks on all infrastructure dependencies.
 * Uses composition to access connection instances.
 */
export class HealthService {
    private prisma: PrismaClient;
    private redis: Redis;
    private rabbitConnection: RabbitMQConnection;

    constructor(
        databaseConnection: DatabaseConnection,
        redisConnection: RedisConnection,
        rabbitConnection: RabbitMQConnection
    ) {
        this.prisma = databaseConnection.getClient();
        this.redis = redisConnection.getClient();
        this.rabbitConnection = rabbitConnection;
    }

    async check(): Promise<HealthCheckResponse> {
        const checks: HealthCheckResult = {
            database: false,
            redis: false,
            rabbitmq: false,
        };

        try {
            checks.database = await this.checkDatabase();
            checks.redis = await this.checkRedis();
            checks.rabbitmq = await this.checkRabbitMQ();

            const allHealthy = Object.values(checks).every((v) => v);

            return {
                success: allHealthy,
                checks,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('HEALTH_CHECK', 'Health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                checks,
            });

            return {
                success: false,
                checks,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }

    private async checkDatabase(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            logger.warn('HEALTH_CHECK', 'Database check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    private async checkRedis(): Promise<boolean> {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        } catch (error) {
            logger.warn('HEALTH_CHECK', 'Redis check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    private async checkRabbitMQ(): Promise<boolean> {
        try {
            const channel = await this.rabbitConnection.getChannel('health-check');
            return channel !== null && channel !== undefined;
        } catch (error) {
            logger.warn('HEALTH_CHECK', 'RabbitMQ check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
