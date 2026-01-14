import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Realistic mixed workload:
 * - Each VU represents a single user (stable userId)
 * - Each VU maintains its own known task IDs to avoid artificial 404s
 * - Still does "realistic" list-first behavior, but doesn't depend on it for state
 * - Adds tags so you can break down latency per operation in Grafana/Prometheus
 */

export const options = {
    stages: [
        { duration: '30s', target: 30 }, // Ramp up
        { duration: '2m', target: 30 }, // Sustained load
        { duration: '30s', target: 0 }, // Ramp down
    ],
    thresholds: {
        // Overall system SLOs for this scenario (tune after first run)
        http_req_duration: ['p(95)<300'],
        http_req_failed: ['rate<0.01'], // We avoid 404s, so failures should be real
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Operation weights (percentages)
const WEIGHTS = {
    CREATE: 15, // Create new tasks
    READ: 60, // Read tasks (cache hits)
    UPDATE: 20, // Update tasks (reschedule)
    DELETE: 5, // Delete tasks
};

// Per-VU local state (k6 isolates JS runtime per VU)
let knownTaskIds = [];

// Tunables
const MIN_LOCAL_TASKS = 3; // Keep at least N tasks per user in local state
const MAX_LOCAL_TASKS = 30; // Prevent unbounded growth
const LIST_REFRESH_PROB = 0.35; // Probability to refresh list from server for realism
const READ_SPECIFIC_PROB = 0.7; // When READ picked, probability to read specific task

function userIdForVu() {
    return `00000000-0003-4000-8000-${String(__VU).padStart(12, '0')}`;
}

function pickWeightedOperation() {
    const rand = Math.random() * 100;
    if (rand < WEIGHTS.CREATE) return 'CREATE';
    if (rand < WEIGHTS.CREATE + WEIGHTS.READ) return 'READ';
    if (rand < WEIGHTS.CREATE + WEIGHTS.READ + WEIGHTS.UPDATE) return 'UPDATE';
    return 'DELETE';
}

function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function safePushTaskId(id) {
    if (!id) return;
    if (knownTaskIds.includes(id)) return;

    knownTaskIds.push(id);

    // Cap size (keep most recent)
    if (knownTaskIds.length > MAX_LOCAL_TASKS) {
        knownTaskIds = knownTaskIds.slice(knownTaskIds.length - MAX_LOCAL_TASKS);
    }
}

/**
 * LIST tasks (realistic client behavior)
 * - Used to simulate typical UI usage and cache hits
 * - We can optionally merge ids into local state if API returns items
 */
function listUserTasks(userId) {
    const res = http.get(`${BASE_URL}/tasks/user/${userId}`, {
        tags: { name: 'GET /tasks/user/:userId' },
    });

    const ok = check(res, {
        'list user tasks: 200': (r) => r.status === 200,
    });

    if (!ok) return [];

    // Try common response shapes:
    // 1) { data: [...] }
    // 2) [...]
    // 3) { items: [...] }
    let items = [];
    try {
        const body = res.json();
        if (Array.isArray(body)) items = body;
        else if (Array.isArray(body?.data)) items = body.data;
        else if (Array.isArray(body?.items)) items = body.items;
    } catch (_) {
        // ignore parse errors
    }

    // Merge into local known IDs (best-effort)
    for (const t of items) {
        if (t?.id) safePushTaskId(t.id);
    }

    return items;
}

function createTask(userId) {
    const payload = JSON.stringify({
        title: `Task ${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId,
    });

    const res = http.post(`${BASE_URL}/tasks`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'POST /tasks' },
    });

    const ok = check(res, {
        'create: 201': (r) => r.status === 201,
    });

    if (!ok) return;

    // Extract id from common shapes:
    // 1) { data: { id } }
    // 2) { id }
    // 3) { data: { task: { id } } }
    try {
        const body = res.json();
        const id = body?.data?.id ?? body?.id ?? body?.data?.task?.id ?? body?.task?.id;

        safePushTaskId(id);
    } catch (_) {
        // ignore
    }
}

function readTask(taskId) {
    const res = http.get(`${BASE_URL}/tasks/${taskId}`, {
        tags: { name: 'GET /tasks/:id' },
    });

    check(res, {
        'read task: 200': (r) => r.status === 200,
    });
}

function updateTask(taskId) {
    const payload = JSON.stringify({
        title: `Updated ${Date.now()}`,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 days
    });

    const res = http.put(`${BASE_URL}/tasks/${taskId}`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'PUT /tasks/:id' },
    });

    // We aim to avoid 404 by choosing from known IDs. If it happens, treat as failure.
    check(res, {
        'update: 200': (r) => r.status === 200,
    });
}

function deleteTask(taskId) {
    const res = http.del(`${BASE_URL}/tasks/${taskId}`, {
        tags: { name: 'DELETE /tasks/:id' },
    });

    const ok = check(res, {
        'delete: 200': (r) => r.status === 200,
    });

    if (ok) {
        // Remove locally so we don't keep hitting deleted IDs
        knownTaskIds = knownTaskIds.filter((id) => id !== taskId);
    }
}

export default function () {
    const userId = userIdForVu();

    // --- Bootstrap local state (minimal, realistic) ---
    // Keep a small pool of tasks per user to enable reads/updates/deletes.
    // We do NOT want "no tasks -> create -> return" because it pollutes stats.
    while (knownTaskIds.length < MIN_LOCAL_TASKS) {
        createTask(userId);
        sleep(0.2);
    }

    // Optional realism: sometimes refresh list from server
    if (Math.random() < LIST_REFRESH_PROB) {
        listUserTasks(userId);
    } else {
        // Even when not refreshing, a UI often lists once per loop - we simulate that lightly
        // by doing it less often (above). This avoids too much extra GET traffic.
    }

    const op = pickWeightedOperation();

    switch (op) {
        case 'CREATE': {
            createTask(userId);
            break;
        }

        case 'READ': {
            // Many clients will show list, then open one item. We do list occasionally above.
            if (Math.random() < READ_SPECIFIC_PROB && knownTaskIds.length > 0) {
                readTask(randomFromArray(knownTaskIds));
            }
            break;
        }

        case 'UPDATE': {
            if (knownTaskIds.length > 0) {
                updateTask(randomFromArray(knownTaskIds));
            }
            break;
        }

        case 'DELETE': {
            // Avoid deleting too aggressively: keep at least MIN_LOCAL_TASKS
            if (knownTaskIds.length > MIN_LOCAL_TASKS) {
                deleteTask(randomFromArray(knownTaskIds));
            }
            break;
        }
    }

    // Think time: realistic user pacing
    sleep(0.5 + Math.random() * 1.5);
}
