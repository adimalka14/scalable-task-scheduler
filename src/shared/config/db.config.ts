import { PrismaClient } from '@prisma/client';
import { DATABASE_URL } from './env.config';
import logger from '../utils/logger';
import { prismaMetricsMiddleware } from '../metrics/prisma-metrics.middleware';

export const prisma = new PrismaClient();
prisma.$use(prismaMetricsMiddleware());


export async function connectDB(retries = 5, delay = 5000) {
    while (retries) {
        try {
            await prisma.$connect();
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
