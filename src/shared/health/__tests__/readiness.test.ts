import { ReadinessCheck } from '../readiness';

// Mock config files to prevent side effects (real connections) during tests
jest.mock('../../config/db.config', () => ({
    prisma: {},
}));

jest.mock('../../config/cache.config', () => ({
    default: {
        ping: jest.fn(),
        on: jest.fn(),
        quit: jest.fn(),
    },
}));

jest.mock('../../config/rabbit', () => ({
    getChannel: jest.fn(),
}));

describe('ReadinessCheck', () => {
    let readinessCheck: ReadinessCheck;
    let mockPrisma: any;
    let mockRedis: any;
    let mockGetChannel: jest.Mock;

    beforeEach(() => {
        mockPrisma = {
            $queryRaw: jest.fn(),
        };

        mockRedis = {
            ping: jest.fn(),
        };

        mockGetChannel = jest.fn();

        readinessCheck = new ReadinessCheck(mockPrisma, mockRedis, mockGetChannel);

        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should return success when all checks pass', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([]);
            mockRedis.ping.mockResolvedValue('PONG');
            mockGetChannel.mockResolvedValue({});

            const result = await readinessCheck.check();

            expect(result.success).toBe(true);
            expect(result.checks.database).toBe(true);
            expect(result.checks.redis).toBe(true);
            expect(result.checks.rabbitmq).toBe(true);
            expect(result.timestamp).toBeDefined();
        });

        it('should return failure when database check fails', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));
            mockRedis.ping.mockResolvedValue('PONG');
            mockGetChannel.mockResolvedValue({});

            const result = await readinessCheck.check();

            expect(result.success).toBe(false);
            expect(result.checks.database).toBe(false);
            expect(result.checks.redis).toBe(true);
            expect(result.checks.rabbitmq).toBe(true);
        });

        it('should return failure when redis check fails', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([]);
            mockRedis.ping.mockRejectedValue(new Error('Redis connection failed'));
            mockGetChannel.mockResolvedValue({});

            const result = await readinessCheck.check();

            expect(result.success).toBe(false);
            expect(result.checks.database).toBe(true);
            expect(result.checks.redis).toBe(false);
            expect(result.checks.rabbitmq).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('Unexpected error'));
            mockRedis.ping.mockRejectedValue(new Error('Unexpected error'));
            mockGetChannel.mockRejectedValue(new Error('Unexpected error'));

            const result = await readinessCheck.check();

            expect(result.success).toBe(false);
            expect(result.checks.database).toBe(false);
            expect(result.checks.redis).toBe(false);
            expect(result.checks.rabbitmq).toBe(false);
            expect(result.timestamp).toBeDefined();
        });
    });
});
