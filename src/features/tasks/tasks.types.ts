export enum TaskStatus {
    CREATED = 'CREATED',
    SCHEDULED = 'SCHEDULED',
    CANCELLED = 'CANCELLED',
    EXECUTING = 'EXECUTING',
    EXECUTED = 'EXECUTED',
    FAILED = 'FAILED',
}

export interface Task {
    id: string;
    title: string;
    dueDate: Date;
    userId: string;
    status: TaskStatus;
    scheduledAt: Date | null;
    executingAt: Date | null;
    executedAt: Date | null;
    cancelledAt: Date | null;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    lockToken: string | null;
    lockedAt: Date | null;
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
    status?: TaskStatus;
    scheduledAt?: Date | null;
    executingAt?: Date | null;
    executedAt?: Date | null;
    cancelledAt?: Date | null;
    attempts?: number;
    maxAttempts?: number;
    lastError?: string | null;
    lockToken?: string | null;
    lockedAt?: Date | null;
}
