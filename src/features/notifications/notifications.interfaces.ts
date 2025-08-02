import { CreateNotificationDto, UpdateNotificationDto, Notification } from './notifications.types';

export interface INotificationRepository {
    create(dto: CreateNotificationDto): Promise<Notification>;
    update(id: string, dto: UpdateNotificationDto): Promise<Notification>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Notification>;
    findByTaskId(taskId: string): Promise<Notification[]>;
    findByStatus(status: string): Promise<Notification[]>;
}

export interface INotificationService {
    createNotification(dto: CreateNotificationDto): Promise<Notification>;
    updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification>;
    deleteNotification(id: string): Promise<void>;
    getNotification(id: string): Promise<Notification>;
    getTaskNotifications(taskId: string): Promise<Notification[]>;
    getNotificationsByStatus(status: string): Promise<Notification[]>;
}

export interface INotificationFacade {
    createNotification(dto: CreateNotificationDto): Promise<Notification>;
    updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification>;
    deleteNotification(id: string): Promise<void>;
    getNotification(id: string): Promise<Notification>;
    getTaskNotifications(taskId: string): Promise<Notification[]>;
    getNotificationsByStatus(status: string): Promise<Notification[]>;
}

export interface INotificationGateway {
    getNotification(id: string): Promise<Notification>;
    getTaskNotifications(taskId: string): Promise<Notification[]>;
} 