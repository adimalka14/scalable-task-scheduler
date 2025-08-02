import { requestIdMW }  from '../requestId.mw';
import { Request, Response, NextFunction } from 'express';

describe('requestIdMiddleware', () => {
    it('should assign a uuid to req.id', () => {
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        requestIdMW(req, res, next);

        expect(req.id).toBeDefined();
        expect(typeof req.id).toBe('string');
        expect(next).toHaveBeenCalled();
    });
});
