export interface ISchedulerQueue {
    scheduleJob<T>(
        queueName: string,
        jobName: string,
        data: T,
        options?: {
            delay?: number;
            attempts?: number;
            backoff?: number;
            jobId?: string;
        },
    ): Promise<void>;

    cancelJob(queueName: string, jobId: string): Promise<void>;
    getJob(queueName: string, jobId: string): Promise<any | null>;
    updateJob<T>(queueName: string, jobId: string, data: T, delay?: number): Promise<void>;
}
