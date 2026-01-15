import logger from './logger';

/**
 * Circuit Breaker States
 */
export enum CircuitState {
    /** Circuit is healthy, all requests pass through */
    CLOSED = 'CLOSED',
    /** Circuit is broken, requests fail immediately */
    OPEN = 'OPEN',
    /** Circuit is testing if system recovered, limited requests pass through */
    HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects against cascading failures when calling external dependencies
 * (database, cache, external APIs, etc.)
 * 
 * State Machine:
 * CLOSED → (failures > threshold) → OPEN
 * OPEN → (timeout elapsed) → HALF_OPEN
 * HALF_OPEN → (successes > threshold) → CLOSED
 * HALF_OPEN → (any failure) → OPEN
 * 
 * @example
 * const dbCircuit = new CircuitBreaker('database', 5, 2, 30000);
 * 
 * try {
 *   const result = await dbCircuit.execute(async () => {
 *     return await db.query('SELECT * FROM users');
 *   });
 * } catch (err) {
 *   // Either the query failed, or circuit is OPEN
 * }
 */
export class CircuitBreaker {
    private failures = 0;
    private successes = 0;
    private state: CircuitState = CircuitState.CLOSED;
    private nextAttempt = 0;
    private lastStateChange = Date.now();

    /**
     * @param name - Identifier for this circuit (for logging)
     * @param failureThreshold - Number of failures before opening circuit (default: 5)
     * @param successThreshold - Number of successes in HALF_OPEN before closing (default: 2)
     * @param timeout - Time in ms before trying HALF_OPEN (default: 30000 = 30s)
     */
    constructor(
        private name: string,
        private failureThreshold: number = 5,
        private successThreshold: number = 2,
        private timeout: number = 30000,
    ) {
        logger.info('CIRCUIT_BREAKER', `Circuit breaker [${name}] initialized`, {
            failureThreshold,
            successThreshold,
            timeout,
        });
    }

    /**
     * Execute function with circuit breaker protection
     * 
     * @throws Error if circuit is OPEN or if the function fails
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // If circuit is OPEN, check if we should try HALF_OPEN
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttempt) {
                throw new Error(
                    `Circuit breaker [${this.name}] is OPEN. ` +
                    `Retry after ${new Date(this.nextAttempt).toISOString()}`
                );
            }

            // Timeout elapsed, try HALF_OPEN
            this.state = CircuitState.HALF_OPEN;
            this.lastStateChange = Date.now();
            logger.info('CIRCUIT_BREAKER', `Circuit [${this.name}] entering HALF_OPEN`, {
                previousFailures: this.failures,
            });
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (err) {
            this.onFailure();
            throw err;
        }
    }

    /**
     * Handle successful execution
     */
    private onSuccess() {
        this.failures = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successes++;

            if (this.successes >= this.successThreshold) {
                // Enough successes, close the circuit
                this.state = CircuitState.CLOSED;
                this.successes = 0;
                this.lastStateChange = Date.now();

                logger.info('CIRCUIT_BREAKER', `Circuit [${this.name}] is now CLOSED`, {
                    successesRequired: this.successThreshold,
                });
            }
        }
    }

    /**
     * Handle failed execution
     */
    private onFailure() {
        this.successes = 0;
        this.failures++;

        if (this.state === CircuitState.HALF_OPEN) {
            // Any failure in HALF_OPEN immediately opens the circuit
            this.openCircuit();
        } else if (this.failures >= this.failureThreshold) {
            // Too many failures, open the circuit
            this.openCircuit();
        }
    }

    /**
     * Open the circuit and set next attempt time
     */
    private openCircuit() {
        this.state = CircuitState.OPEN;
        this.nextAttempt = Date.now() + this.timeout;
        this.lastStateChange = Date.now();

        logger.error('CIRCUIT_BREAKER', `Circuit [${this.name}] is now OPEN`, {
            failures: this.failures,
            threshold: this.failureThreshold,
            nextAttempt: new Date(this.nextAttempt).toISOString(),
            timeoutMs: this.timeout,
        });
    }

    /**
     * Get current circuit state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get detailed status (for monitoring)
     */
    getStatus() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            nextAttempt: this.state === CircuitState.OPEN
                ? new Date(this.nextAttempt).toISOString()
                : null,
            lastStateChange: new Date(this.lastStateChange).toISOString(),
            uptime: this.state === CircuitState.CLOSED
                ? Date.now() - this.lastStateChange
                : null,
        };
    }

    /**
     * Manually reset circuit (use with caution, primarily for testing)
     */
    reset() {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastStateChange = Date.now();

        logger.warn('CIRCUIT_BREAKER', `Circuit [${this.name}] manually reset`);
    }
}
