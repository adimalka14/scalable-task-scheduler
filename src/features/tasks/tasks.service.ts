import { ITaskService, ITaskRepository } from './tasks.interfaces';
import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';

export class TaskService implements ITaskService {
    constructor(private repository: ITaskRepository) {}

    async createTask(dto: CreateTaskDto): Promise<Task> {
        return this.repository.create(dto);
    }

    async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
        return this.repository.update(id, dto);
    }

    async deleteTask(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async getTask(id: string): Promise<Task> {
        return this.repository.findById(id);
    }

    async getUserTasks(userId: string): Promise<Task[]> {
        return this.repository.findByUserId(userId);
    }
}
