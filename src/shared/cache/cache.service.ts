import type { Redis } from 'ioredis';
import { ICacheService } from '../interfaces';
import type { MetricsService } from '../metrics/metrics.service';


export class RedisCacheService implements ICacheService {
    constructor(
        private enabled: boolean,
        private redis: Redis,
        private metricsService: MetricsService,
    ) { }

    async get<T>(key: string): Promise<T | null> {
        if (!this.enabled) return null;

        const value = await this.redis.get(key);

        if (value) {
            this.metricsService.recordCacheHit();
            return JSON.parse(value) as T;
        } else {
            this.metricsService.recordCacheMiss();
            return null;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!this.enabled) return;

        const data = JSON.stringify(value);
        if (ttl && ttl > 0) {
            await this.redis.set(key, data, 'EX', ttl);
        } else {
            await this.redis.set(key, data);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.enabled) return;
        await this.redis.del(key);
    }
}

