import { CreateTaskDto, UpdateTaskDto, Task, TaskStatus } from './tasks.types';

export interface ITaskRepository {
    create(dto: CreateTaskDto): Promise<Task>;
    update(id: string, dto: UpdateTaskDto): Promise<Task>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Task>;
    findByUserId(userId: string): Promise<Task[]>;
    updateStatus(id: string, status: TaskStatus, additionalData?: Partial<UpdateTaskDto>): Promise<Task>;
    claimForExecution(taskId: string): Promise<boolean>;
    markExecuted(taskId: string): Promise<Task>;
    markPublishFailed(taskId: string, errorMessage: string): Promise<Task>;
}

export interface ITaskService {
    createTask(dto: CreateTaskDto): Promise<Task>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<Task>;
    deleteTask(id: string): Promise<void>;
    getTask(id: string): Promise<Task>;
    getUserTasks(userId: string): Promise<Task[]>;
    updateStatus(id: string, status: TaskStatus, additionalData?: Partial<UpdateTaskDto>): Promise<Task>;
    claimForExecution(taskId: string): Promise<boolean>;
    markExecuted(taskId: string): Promise<Task>;
    markPublishFailed(taskId: string, errorMessage: string): Promise<Task>;
}

export interface ITaskFacade {
    createTask(dto: CreateTaskDto): Promise<Task>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<Task>;
    deleteTask(id: string): Promise<void>;
    getTask(id: string): Promise<Task>;
    getUserTasks(userId: string): Promise<Task[]>;
}
