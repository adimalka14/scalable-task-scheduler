import { createTaskSchema, updateTaskSchema, taskIdSchema, userIdSchema } from '../tasks.validators';

describe('Task Validators', () => {
    describe('createTaskSchema', () => {
        it('should validate valid task data', () => {
            const validData = {
                title: 'Test Task',
                dueDate: '2024-01-01T10:00:00Z',
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = createTaskSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty title', () => {
            const invalidData = {
                title: '',
                dueDate: '2024-01-01T10:00:00Z',
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = createTaskSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Title is required');
            }
        });

        it('should reject title too long', () => {
            const invalidData = {
                title: 'a'.repeat(256),
                dueDate: '2024-01-01T10:00:00Z',
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = createTaskSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Title too long');
            }
        });

        it('should reject invalid date format', () => {
            const invalidData = {
                title: 'Test Task',
                dueDate: 'invalid-date',
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = createTaskSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid date format');
            }
        });

        it('should reject invalid UUID', () => {
            const invalidData = {
                title: 'Test Task',
                dueDate: '2024-01-01T10:00:00Z',
                userId: 'invalid-uuid',
            };
            
            const result = createTaskSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid user ID');
            }
        });
    });

    describe('updateTaskSchema', () => {
        it('should validate valid update data', () => {
            const validData = {
                title: 'Updated Task',
                dueDate: '2024-01-02T10:00:00Z',
            };
            
            const result = updateTaskSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate partial update data', () => {
            const validData = {
                title: 'Updated Task',
            };
            
            const result = updateTaskSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate empty object', () => {
            const validData = {};
            
            const result = updateTaskSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty title', () => {
            const invalidData = {
                title: '',
            };
            
            const result = updateTaskSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Title is required');
            }
        });

        it('should reject invalid date format', () => {
            const invalidData = {
                dueDate: 'invalid-date',
            };
            
            const result = updateTaskSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid date format');
            }
        });
    });

    describe('taskIdSchema', () => {
        it('should validate valid task ID', () => {
            const validData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = taskIdSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid task ID', () => {
            const invalidData = {
                taskId: 'invalid-uuid',
            };
            
            const result = taskIdSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid task ID');
            }
        });
    });

    describe('userIdSchema', () => {
        it('should validate valid user ID', () => {
            const validData = {
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = userIdSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid user ID', () => {
            const invalidData = {
                userId: 'invalid-uuid',
            };
            
            const result = userIdSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid user ID');
            }
        });
    });
}); 