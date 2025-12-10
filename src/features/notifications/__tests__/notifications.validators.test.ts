import {
    createNotificationSchema,
    updateNotificationSchema,
    notificationIdSchema,
    taskIdSchema,
    statusSchema,
} from '../notifications.validators';

describe('Notification Validators', () => {
    describe('createNotificationSchema', () => {
        it('should validate valid notification data', () => {
            const validData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
            };

            const result = createNotificationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty type', () => {
            const invalidData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
                type: '',
                status: 'PENDING',
                message: 'Task due soon',
            };

            const result = createNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Type must be one of: REMINDER');
            }
        });

        it('should reject empty status', () => {
            const invalidData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
                type: 'REMINDER',
                status: '',
                message: 'Task due soon',
            };

            const result = createNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Status must be one of: PENDING, SENT');
            }
        });

        it('should reject status too long', () => {
            const invalidData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
                type: 'REMINDER',
                status: 'a'.repeat(21),
                message: 'Task due soon',
            };

            const result = createNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Status must be one of: PENDING, SENT');
            }
        });

        it('should reject empty message', () => {
            const invalidData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
                type: 'REMINDER',
                status: 'PENDING',
                message: '',
            };

            const result = createNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Message is required');
            }
        });

        it('should reject message too long', () => {
            const invalidData = {
                taskId: '123e4567-e89b-12d3-a456-426614174000',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'a'.repeat(501),
            };

            const result = createNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Message too long');
            }
        });

        it('should reject invalid task ID', () => {
            const invalidData = {
                taskId: 'invalid-uuid',
                type: 'REMINDER',
                status: 'PENDING',
                message: 'Task due soon',
            };

            const result = createNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid task ID');
            }
        });
    });

    describe('updateNotificationSchema', () => {
        it('should validate valid update data', () => {
            const validData = {
                type: 'REMINDER',
                status: 'SENT',
                message: 'Task overdue',
            };

            const result = updateNotificationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate partial update data', () => {
            const validData = {
                status: 'SENT',
            };

            const result = updateNotificationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate empty object', () => {
            const validData = {};

            const result = updateNotificationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty type', () => {
            const invalidData = {
                type: '',
            };

            const result = updateNotificationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Type must be one of: REMINDER');
            }
        });
    });

    describe('notificationIdSchema', () => {
        it('should validate valid notification ID', () => {
            const validData = {
                notificationId: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = notificationIdSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid notification ID', () => {
            const invalidData = {
                notificationId: 'invalid-uuid',
            };

            const result = notificationIdSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid notification ID');
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

    describe('statusSchema', () => {
        it('should validate valid status', () => {
            const validData = {
                status: 'PENDING',
            };

            const result = statusSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty status', () => {
            const invalidData = {
                status: '',
            };

            const result = statusSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Status must be one of: PENDING, SENT');
            }
        });
    });
});
