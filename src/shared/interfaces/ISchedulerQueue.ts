export interface ISchedulerQueue {
    scheduleJob<T>(
        queueName: string,
        jobName: string,
        data: T,
        options?: {
            delay?: number;
            attempts?: number;
        },
    ): Promise<void>;
}
