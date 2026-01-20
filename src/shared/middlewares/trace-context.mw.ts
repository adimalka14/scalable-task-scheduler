import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Trace context that is stored per-request using AsyncLocalStorage
 * This allows automatic propagation of trace information throughout the request lifecycle
 */
export interface TraceContext {
    /** Unique trace ID for the entire request (can be propagated from upstream) */
    traceId: string;
    /** Unique span ID for this specific service handling */
    spanId: string;
    /** Request start time in milliseconds */
    startTime: number;
    /** Request ID from Express (for backward compatibility) */
    requestId: string;
}

/**
 * AsyncLocalStorage instance for storing trace context
 * This provides automatic context propagation without passing parameters
 */
export const traceContext = new AsyncLocalStorage<TraceContext>();

/**
 * Middleware that creates and manages trace context for each request
 * 
 * - Extracts trace ID from X-Trace-Id header or generates a new one
 * - Generates a unique span ID for this service
 * - Sets X-Trace-Id response header for downstream propagation
 * - Stores context in AsyncLocalStorage for automatic access
 * 
 * @example
 * app.use(requestIdMW);
 * app.use(traceContextMW);
 */
export function traceContextMW(req: Request, res: Response, next: NextFunction) {
    // Extract trace ID from header (if present) or generate new one
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();

    // Generate unique span ID for this request handling
    const spanId = uuidv4();

    // Get request ID from previous middleware (requestIdMW)
    const requestId = req.id || uuidv4();

    // Record start time for latency calculation
    const startTime = Date.now();

    const context: TraceContext = {
        traceId,
        spanId,
        startTime,
        requestId,
    };

    // Propagate trace ID in response header
    // This allows downstream services to continue the trace
    res.setHeader('X-Trace-Id', traceId);

    // Run the rest of the request within this trace context
    // All code executed during this request will have access to this context
    traceContext.run(context, () => {
        next();
    });
}

/**
 * Helper function to get the current trace context
 * Returns undefined if called outside of a request context
 * 
 * @example
 * const context = getTraceContext();
 * if (context) {
 *   logger.info(context.requestId, 'Something happened', {
 *     // trace_id and span_id will be added automatically
 *   });
 * }
 */
export function getTraceContext(): TraceContext | undefined {
    return traceContext.getStore();
}

/**
 * Helper function to get just the trace ID
 * Useful for quick access without full context
 */
export function getTraceId(): string | undefined {
    return traceContext.getStore()?.traceId;
}

/**
 * Helper function to get just the span ID
 */
export function getSpanId(): string | undefined {
    return traceContext.getStore()?.spanId;
}
