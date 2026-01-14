import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress & Recovery: High load for longer duration to test system resilience
// Instructions: While this test is running, restart the service or database to see recovery
export const options = {
    stages: [
        { duration: '2m', target: 50 }, // Ramp to 50 users (Normal high load)
        { duration: '5m', target: 50 }, // Hold for 5 minutes (FAILURE WINDOW: Kill container here)
        { duration: '5m', target: 50 }, // Continue holding (RECOVERY WINDOW)
        { duration: '1m', target: 0 }, // Ramp down
    ],
    thresholds: {
        // We expect errors during failure, but overall rate should recover
        // This threshold prevents the CI from failing immediately on chaos,
        // but useful for observing the "Failed" rate in output.
        http_req_failed: ['rate<0.10'],
        http_req_duration: ['p(95)<1000'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    // Generate a valid UUID v4 (version=4, variant=8)
    const userId = '00000000-0002-4000-8000-' + String(__VU).padStart(12, '0');


    // Mix of operations

    // 1. Create (Heavy write)
    const payload = JSON.stringify({
        title: `Stress Task ${__VU}-${__ITER}`,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        userId: userId,
    });

    const params = {
        headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${BASE_URL}/tasks`, payload, params);

    // We record check regardless of success to see failure rate in summary
    check(res, { 'status is 201': (r) => r.status === 201 });

    sleep(Math.random() * 2); // Random thinking time 0-2s

    // 2. Read (Heavy read)
    // Only attempt read if we think we might have tasks, or just hit random user
    const readRes = http.get(`${BASE_URL}/tasks/user/${userId}`);

    check(readRes, { 'status is 200': (r) => r.status === 200 });

    sleep(Math.random() * 2);
}
