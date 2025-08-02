export interface ITaskQueue {
    enqueue<T>(queue: string, data: T): Promise<void>;
    consume<T>(queue: string, handler: (data: T) => Promise<void>): Promise<void>;
}
