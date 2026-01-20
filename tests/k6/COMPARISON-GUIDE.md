# Performance Comparison Guide

## Quick Comparison: Cache Impact

### Test 1: WITH Cache (Baseline)
```powershell
# Terminal 1: Start server WITH cache
npm run dev

# Terminal 2: Run realistic test
npm run k6:realistic
```

**📝 Record these numbers:**
- HTTP Latency P95: _______ ms
- HTTP Latency P99: _______ ms
- Requests/sec: _______

---

### Test 2: WITHOUT Cache
```powershell
# Terminal 1: Restart server WITHOUT cache
# Stop the previous server (Ctrl+C), then:
npm run dev:no-cache

# Terminal 2: Run the same test
npm run k6:realistic
```

**📝 Record these numbers:**
- HTTP Latency P95: _______ ms
- HTTP Latency P99: _______ ms
- Requests/sec: _______

---

## Expected Results

Typically you'll see:
- **With Cache**: P95 ~10-15ms
- **Without Cache**: P95 ~30-50ms (3-5x slower!)

This demonstrates the **3-5x performance improvement** from Redis caching! 🚀

---

## Viewing in Grafana

1. Open `http://localhost:3030` (admin/admin)
2. Go to "Management Overview" dashboard
3. Compare the two runs:
   - First spike = WITH cache
   - Second spike = WITHOUT cache
4. Take screenshots for documentation!

---

## Advanced: Scheduler Comparison

To test BullMQ vs Synchronous (future):
1. Create a sync variant that bypasses queue
2. Run same test
3. Compare throughput and reliability

For now, focus on **cache impact** - it's the most measurable!
