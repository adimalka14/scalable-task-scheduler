import { HealthService } from '../health.service';

describe('HealthService', () => {
    let healthService: HealthService;
    let mockDatabaseConnection: any;
    let mockRedisConnection: any;
    let mockRabbitConnection: any;

    beforeEach(() => {
        // Mock DatabaseConnection
        mockDatabaseConnection = {
            getClient: jest.fn().mockReturnValue({
                $queryRaw: jest.fn(),
            }),
        };

        // Mock RedisConnection
        mockRedisConnection = {
            getClient: jest.fn().mockReturnValue({
                ping: jest.fn(),
            }),
        };

        // Mock RabbitMQConnection
        mockRabbitConnection = {
            getChannel: jest.fn(),
        };

        healthService = new HealthService(
            mockDatabaseConnection,
            mockRedisConnection,
            mockRabbitConnection
        );

        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should return success when all checks pass', async () => {
            mockDatabaseConnection.getClient().$queryRaw.mockResolvedValue([]);
            mockRedisConnection.getClient().ping.mockResolvedValue('PONG');
            mockRabbitConnection.getChannel.mockResolvedValue({});

            const result = await healthService.check();

            expect(result.success).toBe(true);
            expect(result.checks.database).toBe(true);
            expect(result.checks.redis).toBe(true);
            expect(result.checks.rabbitmq).toBe(true);
            expect(result.timestamp).toBeDefined();
        });

        it('should return failure when database check fails', async () => {
            mockDatabaseConnection.getClient().$queryRaw.mockRejectedValue(new Error('DB connection failed'));
            mockRedisConnection.getClient().ping.mockResolvedValue('PONG');
            mockRabbitConnection.getChannel.mockResolvedValue({});

            const result = await healthService.check();

            expect(result.success).toBe(false);
            expect(result.checks.database).toBe(false);
            expect(result.checks.redis).toBe(true);
            expect(result.checks.rabbitmq).toBe(true);
        });

        it('should return failure when redis check fails', async () => {
            mockDatabaseConnection.getClient().$queryRaw.mockResolvedValue([]);
            mockRedisConnection.getClient().ping.mockRejectedValue(new Error('Redis connection failed'));
            mockRabbitConnection.getChannel.mockResolvedValue({});

            const result = await healthService.check();

            expect(result.success).toBe(false);
            expect(result.checks.database).toBe(true);
            expect(result.checks.redis).toBe(false);
            expect(result.checks.rabbitmq).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            mockDatabaseConnection.getClient().$queryRaw.mockRejectedValue(new Error('Unexpected error'));
            mockRedisConnection.getClient().ping.mockRejectedValue(new Error('Unexpected error'));
            mockRabbitConnection.getChannel.mockRejectedValue(new Error('Unexpected error'));

            const result = await healthService.check();

            expect(result.success).toBe(false);
            expect(result.checks.database).toBe(false);
            expect(result.checks.redis).toBe(false);
            expect(result.checks.rabbitmq).toBe(false);
            expect(result.timestamp).toBeDefined();
        });
    });
});
