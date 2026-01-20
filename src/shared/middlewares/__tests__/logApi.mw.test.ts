import { Request, Response, NextFunction } from 'express';
import { logApiMW } from '../logApi.mw';
import logger from '../../utils/logger';

// Mock the logger
jest.mock('../../utils/logger', () => ({
    debug: jest.fn(),
}));

describe('logApi middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            id: 'req-123',
            method: 'GET',
            originalUrl: '/test-url',
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should log request details and call next', () => {
        logApiMW(req as Request, res as Response, next);

        expect(logger.debug).toHaveBeenCalledWith(
            'req-123',
            'call to api',
            {
                method: 'GET',
                originalUrl: '/test-url',
            }
        );
        expect(next).toHaveBeenCalled();
    });
});
