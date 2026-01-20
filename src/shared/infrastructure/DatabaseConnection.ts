import { PrismaClient } from '@prisma/client';
import { DATABASE_URL } from '../config/env.config';
import logger from '../utils/logger';

/**
 * DatabaseConnection - manages only the connection to the database.
 * Preserves all original connection logic including retries.
 */
export class DatabaseConnection {
    private prisma: PrismaClient;

    constructor(client?: PrismaClient, middleware?: any) {
        this.prisma = client ?? new PrismaClient();

        if (middleware) {
            this.prisma.$use(middleware);
        }
    }

    /**
     * Get the Prisma client instance
     */
    getClient(): PrismaClient {
        return this.prisma;
    }

    /**
     * Connect to database with retry logic (preserves original logic)
     */
    async connect(retries = 5, delay = 5000): Promise<void> {
        while (retries) {
            try {
                await this.prisma.$connect();
                logger.info('DB', 'Database connected', { url: DATABASE_URL });
                return;
            } catch (err) {
                logger.error('DB', 'Database connection failed, retrying...', { retriesLeft: retries - 1 });
                retries -= 1;
                await new Promise((res) => setTimeout(res, delay));
            }
        }
        process.exit(1);
    }

    /**
     * Disconnect from database
     */
    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
        logger.info('DB', 'Database disconnected');
    }
}
