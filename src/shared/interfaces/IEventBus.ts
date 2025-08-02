export interface IEventBus {
    publish(event: string, payload: any): Promise<void>;
    subscribe(event: string, handler: (payload: any) => void | Promise<void>): Promise<void>;
}
