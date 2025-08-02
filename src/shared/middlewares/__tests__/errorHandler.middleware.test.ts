import { errorHandlerMW } from '../errorHandler.mw';
import { Request, Response } from 'express';

describe('errorHandler middleware', () => {
    it('should return error response and log the error', () => {
        const err = new Error('Something went wrong');
        const req = { originalUrl: '/test', method: 'GET' } as Request;

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });

        const res = { status } as unknown as Response;
        const next = jest.fn();

        errorHandlerMW(err, req, res, next);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: 'Error',
            message: 'Something went wrong',
        });
    });

    it('should use custom status code from error object', () => {
        const err = new Error('Bad Request') as any;
        err.status = 400;

        const req = { originalUrl: '/bad', method: 'POST' } as Request;

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });

        const res = { status } as unknown as Response;
        const next = jest.fn();

        errorHandlerMW(err, req, res, next);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: 'Error',
            message: 'Bad Request',
        });
    });

    it('should use default error name if not provided', () => {
        const err = { message: 'Unknown error', status: 500 };

        const req = { originalUrl: '/unknown', method: 'DELETE' } as Request;

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });

        const res = { status } as unknown as Response;
        const next = jest.fn();

        errorHandlerMW(err, req, res, next);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: 'Internal Server Error', // ReasonPhrases.INTERNAL_SERVER_ERROR
            message: 'Unknown error',
        });
    });
});
