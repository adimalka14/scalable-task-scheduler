import http from 'k6/http';
import { check, sleep } from 'k6';

// Burst profile: Massive spike in scheduled tasks
export const options = {
    scenarios: {
        burst_scheduling: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 100,
            stages: [
                { target: 50, duration: '10s' }, // Ramp up to 50 reqs/sec quickly
                { target: 100, duration: '20s' }, // Hold high throughput
                { target: 0, duration: '10s' }, // Cooldown
            ],
        },
    },
    thresholds: {
        // We expect some queuing, so we accept higher latency, but successful acceptance (201) is key
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    // Generate a valid UUID v4 (version=4, variant=8)
    const userId = '00000000-0001-4000-8000-' + String(__VU).padStart(12, '0');


    // Schedule task for immediate execution (or slightly future to test scheduler pick-up)
    const payload = JSON.stringify({
        title: `Burst Task ${__VU}-${__ITER}`,
        // Set to now + 5 seconds to test scheduler picking it up
        dueDate: new Date(Date.now() + 5000).toISOString(),
        userId: userId,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(`${BASE_URL}/tasks`, payload, params);

    check(res, {
        'task scheduled (201)': (r) => r.status === 201,
    });
}
