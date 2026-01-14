import { Registry } from 'prom-client';
import { MetricsService } from '../metrics.service';

// Mock prom-client
jest.mock('prom-client', () => {
    return {
        Registry: jest.fn().mockImplementation(() => ({
            contentType: 'text/plain',
            metrics: jest.fn().mockResolvedValue('metrics'),
            registerMetric: jest.fn(),
        })),
        collectDefaultMetrics: jest.fn(),
        Histogram: jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
        })),
        Counter: jest.fn().mockImplementation(() => ({
            inc: jest.fn(),
        })),
        Gauge: jest.fn().mockImplementation(() => ({
            set: jest.fn(),
        })),
    };
});

describe('MetricsService', () => {
    let metricsService: MetricsService;

    beforeEach(() => {
        // Reset mocks if needed or re-instantiate
        jest.clearAllMocks();
        metricsService = new MetricsService();
    });

    it('should initialize registry and default metrics', () => {
        expect(metricsService.register).toBeDefined();
    });

    it('should record http request duration and errors', () => {
        const observeSpy = jest.spyOn(metricsService.httpRequestDuration, 'observe');
        const incSpy = jest.spyOn(metricsService.httpRequestErrors, 'inc');

        metricsService.recordHttpRequest('GET', '/test', 200, 0.5);
        expect(observeSpy).toHaveBeenCalledWith(
            { method: 'GET', route: '/test', status_code: '200' },
            0.5
        );
        expect(incSpy).not.toHaveBeenCalled();

        metricsService.recordHttpRequest('POST', '/test', 500, 0.1);
        expect(incSpy).toHaveBeenCalledWith(
            { method: 'POST', route: '/test', status_code: '500' }
        );
    });

    it('should record cache operations', () => {
        const incSpy = jest.spyOn(metricsService.cacheOperations, 'inc');

        metricsService.recordCacheHit();
        expect(incSpy).toHaveBeenCalledWith({ operation: 'hit' });

        metricsService.recordCacheMiss();
        expect(incSpy).toHaveBeenCalledWith({ operation: 'miss' });
    });
});
