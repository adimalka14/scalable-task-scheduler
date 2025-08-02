import { TaskGateway } from '../tasks.gateway';
import { TaskFacade } from '../tasks.facade';
import { Task } from '../tasks.types';

describe('TaskGateway', () => {
    let gateway: TaskGateway;
    let mockFacade: jest.Mocked<TaskFacade>;

    beforeEach(() => {
        mockFacade = {
            createTask: jest.fn(),
            updateTask: jest.fn(),
            deleteTask: jest.fn(),
            getTask: jest.fn(),
            getUserTasks: jest.fn(),
        } as any;
        
        gateway = new TaskGateway(mockFacade);
    });

    describe('getTask', () => {
        it('should get task successfully', async () => {
            const taskId = 'task-123';
            const expectedTask: Task = {
                id: taskId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01T10:00:00Z'),
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            mockFacade.getTask.mockResolvedValue(expectedTask);
            
            const result = await gateway.getTask(taskId);
            
            expect(result).toEqual(expectedTask);
            expect(mockFacade.getTask).toHaveBeenCalledWith(taskId);
        });

        it('should throw error when facade fails', async () => {
            const taskId = 'task-123';
            const error = new Error('Task not found');
            
            mockFacade.getTask.mockRejectedValue(error);
            
            await expect(gateway.getTask(taskId)).rejects.toThrow('Task not found');
            expect(mockFacade.getTask).toHaveBeenCalledWith(taskId);
        });
    });
}); 