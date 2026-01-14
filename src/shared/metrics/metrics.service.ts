import { Registry, collectDefaultMetrics, Histogram, Counter, Gauge } from 'prom-client';
import logger from '../utils/logger';

export class MetricsService {
    public readonly register: Registry;

    // HTTP Metrics
    public readonly httpRequestDuration: Histogram;
    public readonly httpRequestErrors: Counter;

    // Queue Metrics
    public readonly taskQueueWaitTime: Histogram;
    public readonly taskExecutionDuration: Histogram;
    public readonly taskQueueDepth: Gauge;

    // Cache Metrics
    public readonly cacheOperations: Counter;

    // Database Metrics
    public readonly dbQueryDuration: Histogram;

    constructor() {
        this.register = new Registry();

        // Add default nodejs metrics (memory, cpu, etc.)
        collectDefaultMetrics({ register: this.register });

        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.register],
        });

        this.httpRequestErrors = new Counter({
            name: 'http_request_errors_total',
            help: 'Total number of HTTP errors',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register],
        });

        this.taskQueueWaitTime = new Histogram({
            name: 'task_queue_wait_time_seconds',
            help: 'Time a task waits in queue (scheduledAt -> executingAt)',
            buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600],
            registers: [this.register],
        });

        this.taskExecutionDuration = new Histogram({
            name: 'task_execution_duration_seconds',
            help: 'Duration of task execution (executingAt -> executedAt)',
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
            registers: [this.register],
        });

        this.taskQueueDepth = new Gauge({
            name: 'task_queue_depth',
            help: 'Current number of tasks in queue by status',
            labelNames: ['status'],
            registers: [this.register],
        });

        this.cacheOperations = new Counter({
            name: 'cache_operations_total',
            help: 'Total number of cache operations',
            labelNames: ['operation'], // hit, miss
            registers: [this.register],
        });

        this.dbQueryDuration = new Histogram({
            name: 'db_query_duration_seconds',
            help: 'Duration of database queries in seconds',
            labelNames: ['operation', 'model'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
            registers: [this.register],
        });

        logger.info('METRICS', 'Metrics service initialized');
    }

    public recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
        this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);

        if (statusCode >= 400) {
            this.httpRequestErrors.inc({ method, route, status_code: statusCode.toString() });
        }
    }

    public recordCacheHit() {
        this.cacheOperations.inc({ operation: 'hit' });
    }


    public recordCacheMiss() {
        this.cacheOperations.inc({ operation: 'miss' });
    }
}

export const metricsService = new MetricsService();
