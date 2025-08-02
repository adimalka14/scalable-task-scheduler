import { TaskReminderWorker } from './task-reminder.worker';
import { initContainer } from '../container';
import logger from '../shared/utils/logger';

async function startWorker() {
    try {
        // Initialize container
        await initContainer();
        
        // Get services from container
        const { taskGateway, notificationService, eventBus } = (global as any).container;

        // Initialize and start task reminder worker
        const taskReminderWorker = new TaskReminderWorker(
            taskGateway,
            notificationService,
            eventBus
        );

        await taskReminderWorker.start();

        logger.info('All workers started successfully');

        // Keep the process alive
        process.on('SIGINT', async () => {
            logger.info('Shutting down workers...');
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('Shutting down workers...');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Error starting workers:', error);
        process.exit(1);
    }
}

// Start the worker if this file is run directly
if (require.main === module) {
    startWorker();
}

export { startWorker }; 