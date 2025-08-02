import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';

import { LOGGING_MODE, LOGGING_LINE_TRACE, LOG_DIR_PATH } from '../config/env.config';

const appName = 'payments-api';

const enum LEVELS {
    error = 'error',
    warning = 'warning',
    info = 'info',
    debug = 'debug',
    verbose = 'verbose',
    userAction = 'userAction',
    silly = 'silly',
}

interface PRINTF {
    request_id: string;
    timestamp: number;
    message: string;
    level: LEVELS;

    [key: string]: any;
}

function stringifyMetaData(metadata: string | object = '') {
    if (!metadata || typeof metadata === 'string') return metadata;
    return Object.keys(metadata).length ? `\n\t${JSON.stringify(metadata, null, 2)}` : '';
}

class Logger {
    private logger: winston.Logger;

    constructor() {
        const transportDailyRotateFile = new winstonDailyRotateFile({
            dirname: LOG_DIR_PATH,
            extension: '.log',
            filename: `${appName}- %DATE%`,
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: LOGGING_MODE,
        });
        transportDailyRotateFile.on('rotate', function (_oldFileName: string, _newFileName: string) {});
        this.logger = winston.createLogger({
            transports: [transportDailyRotateFile, new winston.transports.Console({ level: LOGGING_MODE })],
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.splat(),
                winston.format.printf(
                    ({
                        timestamp,
                        level,
                        request_id,
                        message,
                        ...metadata
                    }: winston.Logform.TransformableInfo | PRINTF): string => {
                        return `${timestamp} [${level}] [${request_id}] ${message} ${stringifyMetaData(metadata)}`;
                    }
                )
            ),
        });

        this.logger.on('error', (err: Error) => {
            console.error('Logger error Caught: ', err);
        });
    }

    private getLineTrace(err: Error): string | undefined {
        if (!err.stack) return undefined;

        const stackLines = err.stack.split('\n');

        const traceLine = stackLines.find((line) => line.includes('at'));

        if (!traceLine) return undefined;

        const match = traceLine.match(/\((.*):(\d+):(\d+)\)/) || traceLine.match(/at (.*):(\d+):(\d+)/);

        if (!match) return undefined;

        const [, filePath, line, column] = match;

        return `File: ${filePath}, Line: ${line}, Column: ${column}`;
    }

    writeLog(level: LEVELS, request_id: string, message: string, options: any = {}) {
        if (Object.prototype.hasOwnProperty.call(options, 'message')) {
            options.$message = options.message;
            delete options.message;
        }

        let lineTrace;
        if (LOGGING_LINE_TRACE.includes(level) || level === LEVELS.error) {
            const error = new Error(message);
            lineTrace = this.getLineTrace(error);
        }

        if (lineTrace) {
            options.lineTrace = lineTrace;
        }

        this.logger.log(level, message, { request_id, ...options });
    }

    error(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.error, request_id, message, metadata);
    }

    warn(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.warning, request_id, message, metadata);
    }

    info(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.info, request_id, message, metadata);
    }

    debug(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.debug, request_id, message, metadata);
    }

    verbose(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.verbose, request_id, message, metadata);
    }

    userAction(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.userAction, request_id, message, metadata);
    }

    silly(request_id: string, message: string, metadata: any = {}) {
        this.writeLog(LEVELS.silly, request_id, message, metadata);
    }
}

const logger = new Logger();
export default logger;

// print the first log with the current logging mode
(<any>logger)[LOGGING_MODE]('LOGGER', 'logger instance created', { LOGGING_MODE });
