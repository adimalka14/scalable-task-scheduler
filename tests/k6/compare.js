#!/usr/bin/env node

/**
 * Performance Comparison Runner
 * 
 * Runs the same K6 test under different system configurations:
 * 1. Full stack (cache + BullMQ)
 * 2. No cache (only BullMQ)
 * 3. Synchronous (no queue, direct execution)
 * 
 * Outputs a comparison table showing the performance impact of each component.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const K6_SCRIPT = 'tests/k6/realistic-usage.js';
const RESULTS_DIR = 'tests/k6/results';

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const scenarios = [
    {
        name: 'Full Stack (Cache + Queue)',
        env: {
            USE_CACHE: 'true',
            // BullMQ is always on in current setup
        },
        description: '✅ Optimal configuration with Redis cache and BullMQ'
    },
    {
        name: 'No Cache (Queue Only)',
        env: {
            USE_CACHE: 'false',
        },
        description: '⚠️  Without caching - hits DB every time'
    },
];

function runK6Test(scenario) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`${'='.repeat(60)}\n`);

    // Build env vars
    const envVars = Object.entries(scenario.env)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

    // Inform user to set env vars
    console.log(`⚠️  MANUAL STEP REQUIRED:`);
    console.log(`   Please restart your server with:`);
    console.log(`   ${envVars} npm run dev`);
    console.log(`\n   Press ENTER when ready to run the test...`);

    // Wait for user confirmation (in real script, would use readline)
    // For now, just show the command

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(RESULTS_DIR, `${scenario.name.replace(/\s+/g, '-')}-${timestamp}.json`);

    try {
        // Run K6 with JSON output
        const cmd = `k6 run --out json=${outputFile} ${K6_SCRIPT}`;
        console.log(`\nExecuting: ${cmd}\n`);

        execSync(cmd, {
            stdio: 'inherit',
            env: { ...process.env, ...scenario.env }
        });

        console.log(`\n✅ Test completed. Results saved to: ${outputFile}\n`);
        return outputFile;
    } catch (error) {
        console.error(`\n❌ Test failed for scenario: ${scenario.name}`);
        return null;
    }
}

function parseResults(jsonFile) {
    if (!jsonFile || !fs.existsSync(jsonFile)) return null;

    const lines = fs.readFileSync(jsonFile, 'utf-8').split('\n').filter(Boolean);
    const metrics = {};

    for (const line of lines) {
        try {
            const data = JSON.parse(line);
            if (data.type === 'Point' && data.data && data.data.tags) {
                const metricName = data.metric;
                if (!metrics[metricName]) metrics[metricName] = [];
                metrics[metricName].push(data.data.value);
            }
        } catch (e) {
            // Skip invalid lines
        }
    }

    // Calculate P95
    function percentile(arr, p) {
        if (!arr || arr.length === 0) return 0;
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index] || 0;
    }

    return {
        p95: percentile(metrics['http_req_duration'], 0.95),
        p99: percentile(metrics['http_req_duration'], 0.99),
        avgDuration: metrics['http_req_duration']?.reduce((a, b) => a + b, 0) / (metrics['http_req_duration']?.length || 1),
        totalRequests: metrics['http_reqs']?.length || 0,
    };
}

function displayComparison(results) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 PERFORMANCE COMPARISON RESULTS');
    console.log(`${'='.repeat(80)}\n`);

    console.log('┌─────────────────────────────┬──────────┬──────────┬─────────┬────────────┐');
    console.log('│ Scenario                    │ P95 (ms) │ P99 (ms) │ Avg (ms)│ Requests   │');
    console.log('├─────────────────────────────┼──────────┼──────────┼─────────┼────────────┤');

    results.forEach(({ name, data }) => {
        if (!data) {
            console.log(`│ ${name.padEnd(27)} │ FAILED   │ FAILED   │ FAILED  │ FAILED     │`);
        } else {
            console.log(
                `│ ${name.padEnd(27)} │ ` +
                `${data.p95.toFixed(2).padStart(8)} │ ` +
                `${data.p99.toFixed(2).padStart(8)} │ ` +
                `${data.avgDuration.toFixed(2).padStart(7)} │ ` +
                `${data.totalRequests.toString().padStart(10)} │`
            );
        }
    });

    console.log('└─────────────────────────────┴──────────┴──────────┴─────────┴────────────┘\n');

    // Calculate improvements
    const full = results.find(r => r.name === 'Full Stack (Cache + Queue)');
    const noCache = results.find(r => r.name === 'No Cache (Queue Only)');

    if (full?.data && noCache?.data) {
        const cacheImprovement = ((noCache.data.p95 - full.data.p95) / noCache.data.p95 * 100).toFixed(1);
        console.log(`💡 Cache Impact: ${cacheImprovement}% faster P95 latency\n`);
    }
}

async function main() {
    console.log('🚀 Starting Performance Comparison...\n');
    console.log('   This will run multiple tests under different configurations.');
    console.log('   Each test takes ~3 minutes.\n');

    const results = [];

    for (const scenario of scenarios) {
        const resultFile = runK6Test(scenario);
        const data = parseResults(resultFile);
        results.push({ name: scenario.name, data });
    }

    displayComparison(results);

    console.log('✅ Comparison complete!\n');
    console.log(`   Results saved in: ${RESULTS_DIR}\n`);
}

// Show instructions instead of running automatically
console.log('📋 MANUAL COMPARISON GUIDE');
console.log('='.repeat(60));
console.log('\nTo run a fair comparison:\n');
console.log('1️⃣  WITH CACHE (baseline):');
console.log('   - Restart server: npm run dev');
console.log('   - Run test: npm run k6:realistic');
console.log('   - Note the P95 latency\n');
console.log('2️⃣  WITHOUT CACHE:');
console.log('   - Restart server with: USE_CACHE=false npm run dev');
console.log('   - Run test: npm run k6:realistic');
console.log('   - Note the P95 latency\n');
console.log('3️⃣  Compare the results!\n');
console.log('TIP: Look at "HTTP Latency (P95/P99)" in Grafana during each run.\n');
