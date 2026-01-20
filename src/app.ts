import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { NODE_ENV, PORT } from './shared/config/env.config';
import { swaggerOptions } from './shared/config/swagger';
import logger from './shared/utils/logger';
import { initContainer, container } from './container';

import { errorHandlerMW, requestIdMW } from './shared/middlewares';
import { createMetricsMW } from './shared/middlewares/metrics.mw';
import { traceContextMW } from './shared/middlewares/trace-context.mw';

import { createRoutes } from './routes';

const app = express();

app.use(cors());
app.use(helmet());
//app.use(generalLimiterMW);
app.use(requestIdMW);
app.use(traceContextMW); // ✨ Trace context - must be after requestIdMW

if (NODE_ENV !== 'production') {
    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

(async () => {
    await initContainer();

    // ✨ Adaptive rate limiting for backpressure protection
    const { AdaptiveLimiter } = await import('./shared/middlewares/adaptive-limiter.mw');
    const adaptiveLimiter = new AdaptiveLimiter(container.metricsService);
    app.use(adaptiveLimiter.middleware());

    // Use metricsService from container (includes smart logging)
    app.use(createMetricsMW(container.metricsService));

    // Start queue depth tracking
    const { QueueDepthService } = await import('./shared/metrics/queue-depth.service');
    const queueDepthService = new QueueDepthService(
        container.databaseConnection.getClient(),
        container.metricsService
    );
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
