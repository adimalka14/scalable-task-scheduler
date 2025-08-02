import { TaskService } from '../tasks.service';
import { TaskRepository } from '../tasks.repository';
import { CreateTaskDto, UpdateTaskDto, Task } from '../tasks.types';

describe('TaskService', () => {
    let service: TaskService;
    let mockRepository: jest.Mocked<TaskRepository>;

    beforeEach(() => {
        mockRepository = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
        } as any;
        
        service = new TaskService(mockRepository);
    });

    describe('createTask', () => {
        it('should create task successfully', async () => {
            const dto: CreateTaskDto = {
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
            };
            
            const expectedTask: Task = {
                id: 'task-123',
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            mockRepository.create.mockResolvedValue(expectedTask);
            
            const result = await service.createTask(dto);
            
            expect(result).toEqual(expectedTask);
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
        });

        it('should throw error when repository fails', async () => {
            const dto: CreateTaskDto = {
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
            };
            
            const error = new Error('Database error');
            mockRepository.create.mockRejectedValue(error);
            
            await expect(service.createTask(dto)).rejects.toThrow('Database error');
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('updateTask', () => {
        it('should update task successfully', async () => {
            const taskId = 'task-123';
            const dto: UpdateTaskDto = {
                title: 'Updated Task',
            };
            
            const expectedTask: Task = {
                id: taskId,
                title: 'Updated Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            mockRepository.update.mockResolvedValue(expectedTask);
            
            const result = await service.updateTask(taskId, dto);
            
            expect(result).toEqual(expectedTask);
            expect(mockRepository.update).toHaveBeenCalledWith(taskId, dto);
        });
    });

    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            const taskId = 'task-123';
            mockRepository.delete.mockResolvedValue();
            
            await service.deleteTask(taskId);
            
            expect(mockRepository.delete).toHaveBeenCalledWith(taskId);
        });
    });

    describe('getTask', () => {
        it('should get task successfully', async () => {
            const taskId = 'task-123';
            const expectedTask: Task = {
                id: taskId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            mockRepository.findById.mockResolvedValue(expectedTask);
            
            const result = await service.getTask(taskId);
            
            expect(result).toEqual(expectedTask);
            expect(mockRepository.findById).toHaveBeenCalledWith(taskId);
        });
    });

    describe('getUserTasks', () => {
        it('should get user tasks successfully', async () => {
            const userId = 'user-123';
            const expectedTasks: Task[] = [
                {
                    id: 'task-1',
                    title: 'Task 1',
                    dueDate: new Date('2024-01-01'),
                    userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'task-2',
                    title: 'Task 2',
                    dueDate: new Date('2024-01-02'),
                    userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            
            mockRepository.findByUserId.mockResolvedValue(expectedTasks);
            
            const result = await service.getUserTasks(userId);
            
            expect(result).toEqual(expectedTasks);
            expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
        });
    });
}); 