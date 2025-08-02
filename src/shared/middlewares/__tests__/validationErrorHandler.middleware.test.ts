import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBodyMW } from '../validationErrorHandler.mw';

describe('validateBody middleware', () => {
    const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
    });

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if body is valid', () => {
        const req = {
            body: {
                name: 'John',
                age: 25,
            },
        } as Request;

        const middleware = validateBodyMW(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should pass error to next if body is invalid', () => {
        const req = {
            body: {
                name: 'John',
                age: -5,
            },
        } as Request;

        const middleware = validateBodyMW(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 400,
                name: 'Bad Request',
                message: 'Invalid request body',
                details: expect.any(Object),
            })
        );

        expect(res.status).not.toHaveBeenCalled();
    });
});
