import path from 'path';
import { PORT } from './env.config';

export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'payments-api API Documentation',
            version: '1.0.0',
            description: 'This is the API documentation for our project - Dog adopters.',
        },
        tags: [],
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
    },
    apis: [path.join(__dirname, '../features/**/*.routes.ts')],
};
