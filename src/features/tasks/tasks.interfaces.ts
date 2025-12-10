import { CreateTaskDto, UpdateTaskDto, Task } from './tasks.types';

export interface ITaskRepository {
    create(dto: CreateTaskDto): Promise<Task>;
    update(id: string, dto: UpdateTaskDto): Promise<Task>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Task>;
    findByUserId(userId: string): Promise<Task[]>;
}

export interface ITaskService {
    createTask(dto: CreateTaskDto): Promise<Task>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<Task>;
    deleteTask(id: string): Promise<void>;
    getTask(id: string): Promise<Task>;
    getUserTasks(userId: string): Promise<Task[]>;
}

export interface ITaskFacade {
    createTask(dto: CreateTaskDto): Promise<Task>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<Task>;
    deleteTask(id: string): Promise<void>;
    getTask(id: string): Promise<Task>;
    getUserTasks(userId: string): Promise<Task[]>;
}
