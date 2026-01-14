import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBodyMW, validateParamsMW } from '../validationErrorHandler.mw';

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
            headers: {},
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
            headers: {},
        } as Request;

        const middleware = validateBodyMW(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 400,
                name: 'ValidationError',
                message: 'Invalid request body',
                details: expect.any(Object),
            })
        );

        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('validateParams middleware', () => {
    const schema = z.object({
        id: z.string().uuid(),
    });

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if params are valid', () => {
        const req = {
            params: {
                id: '123e4567-e89b-12d3-a456-426614174000',
            },
            headers: {},
        } as unknown as Request;

        const middleware = validateParamsMW(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should pass error to next if params are invalid', () => {
        const req = {
            params: {
                id: 'invalid-uuid',
            },
            headers: {},
        } as unknown as Request;

        const middleware = validateParamsMW(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 400,
                name: 'ValidationError',
                message: 'Invalid route parameters',
                details: expect.any(Object),
            })
        );

        expect(res.status).not.toHaveBeenCalled();
    });
});
