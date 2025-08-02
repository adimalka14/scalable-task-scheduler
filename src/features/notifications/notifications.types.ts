export interface Notification {
    id: string;
    taskId: string;
    type: string;
    status: string;
    message: string;
    sentAt: Date;
    createdAt: Date;
    // TODO: Add task relation when Task DTO is available
    // task: Task;
}

export interface CreateNotificationDto {
    taskId: string;
    type: string;
    status: string;
    message: string;
    sentAt: Date;
}

export interface UpdateNotificationDto {
    type?: string;
    status?: string;
    message?: string;
    sentAt?: Date;
} 