export interface Notification {
    id: string;
    taskId: string;
    type: NotificationType;
    status: NotificationStatus;
    message: string;
    sentAt: Date;
    createdAt: Date;
}

export interface CreateNotificationDto {
    taskId: string;
    type: NotificationType;
    status: NotificationStatus;
    message: string;
    sentAt: Date;
}

export interface UpdateNotificationDto {
    type?: NotificationType;
    status?: NotificationStatus;
    message?: string;
    sentAt?: Date;
}

export interface TaskTimedArrivalEvent {
    taskId: string;
    userId: string;
    dueDate: string;
}

export const NOTIFICATION_TYPES = {
    REMINDER: 'REMINDER',
} as const;

export const NOTIFICATION_STATUS = {
    PENDING: 'PENDING',
    SENT: 'SENT',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];
