import { ITaskGateway, ITaskFacade } from './tasks.interfaces';
import { Task } from './tasks.types';

export class TaskGateway implements ITaskGateway {
    constructor(private facade: ITaskFacade) {}

    async getTask(id: string): Promise<Task> {
        return this.facade.getTask(id);
    }
}
