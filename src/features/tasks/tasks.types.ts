export interface Task {
    id: string;
    title: string;
    dueDate: Date;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTaskDto {
    title: string;
    dueDate: Date;
    userId: string;
}

export interface UpdateTaskDto {
    title?: string;
    dueDate?: Date;
}
