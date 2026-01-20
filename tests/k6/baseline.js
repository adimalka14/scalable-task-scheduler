import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp to 20 users
        { duration: '1m', target: 20 }, // Stay at 20 users
        { duration: '30s', target: 0 }, // Ramp down
    ],
    thresholds: {
        // 95% of requests must complete below 500ms
        http_req_duration: ['p(95)<500'],
        // Error rate must be less than 1%
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    // Generate a valid UUID v4 (version=4, variant=8)
    const userId = '00000000-0000-4000-8000-' + String(__VU).padStart(12, '0');


    // 1. Create Task
    const payload = JSON.stringify({
        title: `Load Test Task ${__VU}-${__ITER}`,
        dueDate: new Date(Date.now() + 86400000).toISOString(), // +1 day
        userId: userId,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const createRes = http.post(`${BASE_URL}/tasks`, payload, params);

    check(createRes, {
        'create status is 201': (r) => r.status === 201,
    });

    // Short pause
    sleep(1);

    // 2. List Tasks
    const listRes = http.get(`${BASE_URL}/tasks/user/${userId}`);

    check(listRes, {
        'list status is 200': (r) => r.status === 200,
        'list has data': (r) => r.json('data') && r.json('data').length > 0,
    });

    sleep(1);
}
