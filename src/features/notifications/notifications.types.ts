export enum NotificationType {
    TASK_REMINDER = 'TASK_REMINDER',
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
}

export interface Notification {
    id: string;
    taskId: string;
    type: NotificationType;
    status: NotificationStatus;
    message: string;
    sentAt: Date | null;
    createdAt: Date;
}

export interface CreateNotificationDto {
    taskId: string;
    type: NotificationType;
    status: NotificationStatus;
    message: string;
    sentAt?: Date | null;
}

export interface UpdateNotificationDto {
    type?: NotificationType;
    status?: NotificationStatus;
    message?: string;
    sentAt?: Date | null;
}

export interface TaskTimedArrivalEvent {
    taskId: string;
    userId: string;
    dueDate: string;
}
