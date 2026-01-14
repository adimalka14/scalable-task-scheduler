import { prisma } from '../config/db.config';
import redis from '../config/cache.config';
import { getChannel } from '../config/rabbit';
import logger from '../utils/logger';
import type { PrismaClient } from '@prisma/client';

export interface HealthCheckResult {
    database: boolean;
    redis: boolean;
    rabbitmq: boolean;
}

export interface ReadinessCheckResponse {
    success: boolean;
    checks: HealthCheckResult;
    timestamp: string;
    error?: string;
}

export class ReadinessCheck {
    private prisma: PrismaClient;
    private redis: any;
    private getChannel: (queueName: string) => Promise<any>;

    constructor(
        prismaClient = prisma,
        redisClient = redis,
        channelGetter = getChannel
    ) {
        this.prisma = prismaClient;
        this.redis = redisClient;
        this.getChannel = channelGetter;
    }

    async check(): Promise<ReadinessCheckResponse> {
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
            logger.error('READINESS_CHECK', 'Health check failed', {
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
            logger.warn('READINESS_CHECK', 'Database check failed', {
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
            logger.warn('READINESS_CHECK', 'Redis check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    private async checkRabbitMQ(): Promise<boolean> {
        try {
            const channel = await this.getChannel('health-check');
            return channel !== null && channel !== undefined;
        } catch (error) {
            logger.warn('READINESS_CHECK', 'RabbitMQ check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}

