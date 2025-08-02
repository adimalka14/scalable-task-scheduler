import logger from '../logger';
import winston from 'winston';

jest.mock('winston', () => {
    const mLogger = {
        log: jest.fn(),
        on: jest.fn(),
    };
    const mCreateLogger = jest.fn(() => mLogger);
    return {
        createLogger: mCreateLogger,
        transports: { Console: jest.fn() },
        format: {
            combine: jest.fn(),
            colorize: jest.fn(),
            timestamp: jest.fn(),
            splat: jest.fn(),
            printf: jest.fn(),
        },
    };
});

describe('Logger', () => {
    let mockLogger: jest.Mocked<winston.Logger>;

    beforeEach(() => {
        mockLogger = winston.createLogger() as jest.Mocked<winston.Logger>;
        jest.clearAllMocks();
    });

    it('should log an error message', () => {
        const requestId = 'test-req-id';
        const message = 'Test error message';
        const metadata = { errorCode: 123 };

        logger.error(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('error', message, {
            request_id: requestId,
            ...metadata,
        });
    });

    it('should log a warning message', () => {
        const requestId = 'test-req-id';
        const message = 'Test warning message';
        const metadata = { warningLevel: 1 };

        logger.warn(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('warn', message, {
            request_id: requestId,
            ...metadata,
        });
    });

    it('should log an info message', () => {
        const requestId = 'test-req-id';
        const message = 'Test info message';
        const metadata = { infoKey: 'infoValue' };

        logger.info(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('info', message, {
            request_id: requestId,
            ...metadata,
        });
    });

    it('should log a debug message', () => {
        const requestId = 'test-req-id';
        const message = 'Test debug message';
        const metadata = { debugData: 'debugInfo' };

        logger.debug(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('debug', message, {
            request_id: requestId,
            ...metadata,
        });
    });

    it('should log a verbose message', () => {
        const requestId = 'test-req-id';
        const message = 'Test verbose message';
        const metadata = { verboseKey: 'verboseValue' };

        logger.verbose(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('verbose', message, {
            request_id: requestId,
            ...metadata,
        });
    });

    it('should log a user action message', () => {
        const requestId = 'test-req-id';
        const message = 'Test user action message';
        const metadata = { actionType: 'click' };

        logger.userAction(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('userAction', message, {
            request_id: requestId,
            ...metadata,
        });
    });

    it('should log a silly message', () => {
        const requestId = 'test-req-id';
        const message = 'Test silly message';
        const metadata = { sillyData: 'justForFun' };

        logger.silly(requestId, message, metadata);

        expect(mockLogger.log).toHaveBeenCalledWith('silly', message, {
            request_id: requestId,
            ...metadata,
        });
    });
});
