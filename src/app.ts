import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { NODE_ENV, PORT } from './shared/config/env.config';
import { swaggerOptions } from './shared/config/swagger';
import logger from './shared/utils/logger';
import { connectDB } from './shared/config/db.config';
import { initContainer, container } from './container';

import { errorHandlerMW, requestIdMW, logApiMW, metricsMW } from './shared/middlewares';

import { createRoutes } from './routes';

const app = express();

app.use(cors());
app.use(helmet());
//app.use(generalLimiterMW);
app.use(requestIdMW);
app.use(metricsMW);
app.use(logApiMW);


if (NODE_ENV !== 'production') {
    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

(async () => {
    await connectDB();
    await initContainer();

    // Start queue depth tracking
    const { QueueDepthService } = await import('./shared/metrics/queue-depth.service');
    const { prisma } = await import('./shared/config/db.config');
    const queueDepthService = new QueueDepthService(prisma);
    queueDepthService.startQueueDepthTracking();

    // use webhook here if needed


    app.use(express.json());

    app.use(createRoutes(container));
    app.use(errorHandlerMW);

    app.listen(PORT, () => {
        logger.info('SYSTEM', 'Server started', {
            url: `http://localhost:${PORT}`,
            port: PORT,
        });
    });
})();

export default app;
