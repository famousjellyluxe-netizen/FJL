# Performance Testing Guide - Real-Time Stock Synchronization

**Phase**: 3.5
**Status**: Ready for Testing
**Date**: 2025-11-26

---

## Overview

This guide provides comprehensive performance testing procedures to ensure real-time stock synchronization doesn't negatively impact page load times, memory usage, CPU usage, network performance, or render performance.

**Target Metrics**:
- Page Load Time: < 100ms increase from baseline
- Memory Usage: < 5MB increase for synchronizer
- CPU Usage: < 20% during idle, < 50% during updates
- Network Usage: SSE connection + occasional POST/PUT requests
- Render Performance: Consistent 60 FPS during updates
- Connection Stability: 99%+ uptime, <1s latency

---

## Performance Testing Tools

### Browser DevTools Performance Tools

#### Chrome/Edge DevTools
```
Path: F12 → Performance tab
Capabilities:
- Record page load performance
- Analyze rendering timeline
- CPU flame graph
- Memory allocation
- Network activity timeline
```

#### Firefox Developer Tools
```
Path: F12 → Performance tab
Capabilities:
- Frame rate recording
- CPU usage profiling
- Memory allocation tracking
- Network monitoring
```

#### Safari Web Inspector
```
Path: Cmd+Option+I → Timelines
Capabilities:
- Page load timeline
- Memory usage tracking
- CPU usage monitoring
```

### Command-Line Tools

#### Lighthouse (Chrome)
```bash
# Install globally
npm install -g lighthouse

# Run audit
lighthouse https://localhost:5000 --view

# Save report
lighthouse https://localhost:5000 --output=html --output-path=./report.html
```

#### WebPageTest
```
Website: https://www.webpagetest.org/
- Free online performance testing
- Real browser testing from various locations
- Waterfall charts and video playback
```

#### Artillery (Load Testing)
```bash
# Install
npm install -g artillery

# Load test API endpoints
artillery quick --count 100 --num 10 https://api.example.com/products
```

---

## Test Cases

### Test 1: Page Load Performance Baseline

**Objective**: Establish baseline page load time without real-time features

**Prerequisites**:
- Fresh browser cache
- No developer tools open
- Stable network connection
- Server in normal operating state

**Steps** (for each page):

1. **Measure baseline (without synchronizer)**:
   ```javascript
   // Temporarily disable UniversalStockSynchronizer initialization
   // Open DevTools → Performance tab
   // Click Record
   // Refresh page
   // Wait for page to fully load
   // Click Stop and analyze
   ```

2. **Measure with synchronizer enabled**:
   ```javascript
   // Re-enable UniversalStockSynchronizer
   // Repeat measurement process
   ```

3. **Compare metrics**:
   - Time to First Paint (FP)
   - Time to First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Total Blocking Time (TBT)
   - Cumulative Layout Shift (CLS)

**Expected Results**:
- [ ] FCP: < 1.5 seconds
- [ ] LCP: < 2.5 seconds
- [ ] Synchronizer adds < 100ms to load time
- [ ] CLS: < 0.1 (no layout shifts)

**Pages to Test**:
- [ ] index.html
- [ ] shop.html
- [ ] product.html
- [ ] cart.html
- [ ] checkout.html

**Test Results Template**:
```markdown
| Page | Baseline FCP | With Sync FCP | Difference | Status |
|------|-------------|---------------|------------|--------|
| index.html | 800ms | 850ms | +50ms | ✅ PASS |
| shop.html | 1200ms | 1280ms | +80ms | ✅ PASS |
| product.html | 950ms | 1020ms | +70ms | ✅ PASS |
| cart.html | 1100ms | 1150ms | +50ms | ✅ PASS |
| checkout.html | 1300ms | 1380ms | +80ms | ✅ PASS |
```

---

### Test 2: Memory Usage During Normal Operation

**Objective**: Verify memory usage stays stable and doesn't leak

**Prerequisites**:
- DevTools open
- Fresh page load
- Network stable

**Steps**:

1. **Record baseline memory**:
   ```javascript
   // In console:
   if (performance.memory) {
     console.log('Initial memory:',
       (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
     );
   }
   ```

2. **Simulate 10 stock updates**:
   ```javascript
   const sync = await UniversalStockSynchronizer.getInstance();
   const handlers = sync.pageHandlers;
   const handler = handlers.values().next().value;

   for (let i = 0; i < 10; i++) {
     handler({
       productId: 'test-' + i,
       newQuantity: Math.random() * 10,
       oldQuantity: 10
     });
   }
   ```

3. **Record memory after updates**:
   ```javascript
   if (performance.memory) {
     console.log('After updates:',
       (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
     );
   }
   ```

4. **Force garbage collection** (Chrome DevTools):
   - Memory tab → Click trash can icon
   - Wait 2 seconds
   - Record memory again

5. **Check DevTools Memory tab** (heap snapshots):
   - Take heap snapshot #1 at page load
   - Send 50+ stock updates
   - Take heap snapshot #2
   - Compare - should be similar sizes

**Expected Results**:
- [ ] Memory increase < 5MB during 50+ updates
- [ ] Memory released after GC
- [ ] No growing memory with repeated operations
- [ ] Heap snapshots show similar object counts

**Detached DOM Nodes Check**:
```javascript
// Count detached DOM nodes (sign of memory leak)
// In Chrome DevTools:
// Detached nodes should be < 100
// After GC, should reduce to < 10
```

---

### Test 3: CPU Usage During Updates

**Objective**: Verify CPU doesn't spike excessively during stock updates

**Prerequisites**:
- DevTools Performance tab open
- Baseline measure (idle page)

**Steps**:

1. **Measure idle CPU** (30 seconds):
   - Open Performance tab
   - Click Record
   - Wait 30 seconds without any interaction
   - Stop and note CPU percentage

2. **Measure during updates**:
   - Start recording
   - Trigger 100+ rapid stock updates:
     ```javascript
     const sync = await UniversalStockSynchronizer.getInstance();
     const handlers = sync.pageHandlers;
     const handler = handlers.values().next().value;

     for (let i = 0; i < 100; i++) {
       handler({
         productId: 'cpu-test-' + i,
         newQuantity: Math.random() * 10,
         oldQuantity: 10
       });
     }
     ```
   - Stop recording after updates complete
   - Analyze CPU timeline

3. **Review CPU flame graph**:
   - Long tasks should be < 50ms
   - JavaScript execution should take < 30ms per update
   - Total CPU during updates < 50%

**Expected Results**:
- [ ] Idle CPU: < 5%
- [ ] During updates: < 50% (brief spikes acceptable)
- [ ] No long tasks (> 50ms)
- [ ] CPU returns to idle levels after updates stop

**Metrics to Check**:
```
Frame rate: 60 FPS (no dropped frames)
JavaScript time: < 30ms
Rendering time: < 10ms
Idle time: > 50ms
```

---

### Test 4: Network Performance

**Objective**: Verify network usage is reasonable and SSE connection stable

**Prerequisites**:
- DevTools Network tab open
- Backend running normally

**Steps**:

1. **Monitor SSE connection**:
   - Open DevTools Network tab
   - Navigate to product.html
   - Look for `/api/products/stock/subscribe` request
   - Should be "EventStream" type
   - Should stay open and connected

2. **Measure data transfer**:
   - Filter to "Fetch/XHR" in Network tab
   - Monitor for 5 minutes during normal operation
   - Note total data transferred
   - Check individual request sizes

3. **Measure API requests**:
   - Monitor product list loads
   - Check response times (should be < 500ms)
   - Check payload sizes (should be < 100KB)

4. **Test under poor network**:
   - DevTools Network tab
   - Set throttling: "Slow 3G" or "4G"
   - Perform stock update test
   - Verify system still works (just slower)

**Expected Results**:
- [ ] SSE connection establishes in < 1 second
- [ ] SSE connection stays open (no reconnects every second)
- [ ] Stock update payloads < 1KB each
- [ ] API responses < 500ms on normal network
- [ ] Works on slow network (3G) with increased latency

**Network Throttling Test**:
```
Condition: Slow 3G (400kbps down, 400kbps up, 400ms latency)

Expected:
- [ ] Stock updates arrive with 400-500ms delay
- [ ] UI updates smoothly despite delay
- [ ] No connection errors
- [ ] No exponential backoff issues
```

---

### Test 5: Render Performance (FPS)

**Objective**: Verify UI updates smoothly without frame drops

**Prerequisites**:
- DevTools Performance tab ready
- Page fully loaded

**Steps**:

1. **Record rendering performance**:
   ```javascript
   // Enable frame rate monitoring in DevTools
   // Performance tab → Record
   // Trigger rapid stock updates
   const sync = await UniversalStockSynchronizer.getInstance();
   const handlers = sync.pageHandlers;
   const handler = handlers.values().next().value;

   // Send 50 updates over 5 seconds
   const interval = setInterval(() => {
     handler({
       productId: 'render-test',
       newQuantity: Math.random() * 10,
       oldQuantity: 10
     });
   }, 100);

   setTimeout(() => clearInterval(interval), 5000);
   ```

2. **Analyze frame rate**:
   - Should maintain 60 FPS
   - No frames > 16.67ms
   - Rendering time < 10ms per frame

3. **Check for layout thrashing**:
   - No forced synchronous layouts
   - Read → Write → Read operations minimize DOM access

4. **Visual smoothness**:
   - Watch product card updates
   - Should see smooth transitions
   - No stuttering or pauses
   - Numbers update smoothly

**Expected Results**:
- [ ] Maintain 60 FPS during updates
- [ ] No dropped frames
- [ ] Rendering time < 10ms per frame
- [ ] Visual updates are smooth and flicker-free
- [ ] Animations (if any) play smoothly

**Performance Budget**:
```
Per stock update:
- JavaScript: < 15ms
- Rendering: < 5ms
- Total: < 20ms (leaves 13.33ms buffer for 60 FPS)
```

---

### Test 6: Concurrent Users Load Test

**Objective**: Verify backend and frontend handle multiple simultaneous users

**Prerequisites**:
- Artillery or load testing tool installed
- Backend running
- Database with test data

**Steps**:

1. **Simulate 50 concurrent users**:
   ```bash
   # Create load-test.yml
   config:
     target: "https://localhost:5000"
     phases:
       - duration: 60
         arrivalRate: 10  # 10 new users per second
         rampTo: 50       # Ramp to 50 concurrent users

   scenarios:
     - name: "Stock Sync Load Test"
       flow:
         - get:
             url: "/index.html"
         - think: 3
         - get:
             url: "/api/products"
         - think: 5

   # Run test
   artillery run load-test.yml
   ```

2. **Monitor metrics**:
   - Average response time
   - 95th percentile response time
   - Error rate
   - Throughput (requests/second)

3. **Backend monitoring**:
   - Check CPU usage
   - Check memory usage
   - Check database connection count
   - Check SSE connection count

**Expected Results**:
- [ ] Response times < 500ms (avg)
- [ ] Response times < 2s (95th percentile)
- [ ] Error rate < 0.1%
- [ ] Backend stays stable
- [ ] No connection leaks

**Load Test Report Example**:
```
Summary Report @ 17:45:23 (+0000)
  Scenarios launched:  500
  Scenarios completed: 498
  Requests completed:  2490
  RPS sent: 41.5
  Concurrency: 49.8
  Errors: 1
  Mean latency: 245 ms
  p95 latency: 892 ms
  p99 latency: 1247 ms
```

---

### Test 7: SSE Connection Stability

**Objective**: Verify SSE maintains stable connection and properly handles issues

**Prerequisites**:
- Product detail page loaded
- Network DevTools available

**Steps**:

1. **Measure connection uptime** (5 minutes):
   - Monitor `/api/products/stock/subscribe` in Network tab
   - Should remain connected entire time
   - Look for any "close" or "error" events

2. **Test connection interruption recovery**:
   - Open Network DevTools
   - Block SSE endpoint temporarily
   - Observe fallback to polling
   - Unblock endpoint
   - Observe reconnection

3. **Test heartbeat/keep-alive**:
   - Monitor SSE event stream
   - Should see periodic events even without stock changes
   - Interval should be < 30 seconds
   - Prevents proxy timeouts

4. **Test message ordering**:
   - Trigger sequential stock updates
   - Verify updates arrive in order
   - No duplicates
   - No missing updates

**Expected Results**:
- [ ] SSE connection stays open > 99% of time
- [ ] Handles network interruptions gracefully
- [ ] Reconnects within < 5 seconds
- [ ] Heartbeat keeps connection alive
- [ ] All messages received in order
- [ ] No duplicate messages

---

### Test 8: Storage Performance (localStorage)

**Objective**: Verify localStorage operations don't cause performance issues

**Prerequisites**:
- DevTools Performance tab
- localStorage available

**Steps**:

1. **Measure localStorage write time**:
   ```javascript
   // Time localStorage operations
   const startWrite = performance.now();

   // Write a large product object
   const largeProduct = {
     id: 'test-1',
     name: 'Test Product',
     variants: new Array(100).fill(0).map((_, i) => ({
       id: i,
       size: 'M',
       color: 'Red',
       stock_quantity: 10
     }))
   };

   localStorage.setItem('fjl_test', JSON.stringify(largeProduct));

   const writeTime = performance.now() - startWrite;
   console.log('localStorage write time:', writeTime.toFixed(2) + 'ms');
   ```

2. **Measure localStorage read time**:
   ```javascript
   const startRead = performance.now();
   const data = localStorage.getItem('fjl_test');
   JSON.parse(data);
   const readTime = performance.now() - startRead;
   console.log('localStorage read time:', readTime.toFixed(2) + 'ms');
   ```

3. **Measure quota usage**:
   ```javascript
   // Check localStorage size
   let total = 0;
   for (let key in localStorage) {
     total += localStorage.getItem(key).length;
   }
   console.log('localStorage size:', (total / 1024 / 1024).toFixed(2) + ' MB');
   ```

4. **Test rapid updates**:
   - Send 100+ stock updates
   - Measure total time
   - Should complete smoothly

**Expected Results**:
- [ ] localStorage write time < 5ms
- [ ] localStorage read time < 2ms
- [ ] Total storage used < 10MB
- [ ] No QuotaExceededError
- [ ] Operations don't block main thread

---

### Test 9: Browser Memory Profiling

**Objective**: Deep analysis of memory usage and potential leaks

**Prerequisites**:
- Chrome/Edge (best tools)
- DevTools Memory tab

**Steps**:

1. **Take initial heap snapshot**:
   - DevTools Memory tab
   - Click "Take heap snapshot"
   - Save as baseline.heapsnapshot

2. **Perform operations**:
   - Add products to cart
   - Add to favorites
   - Change filters
   - Update stock 50+ times
   - Navigate to different pages
   - Navigate back

3. **Take second heap snapshot**:
   - Click "Take heap snapshot"
   - Save as after-operations.heapsnapshot

4. **Compare snapshots**:
   - Open both in DevTools
   - Look for "Detached DOM nodes"
   - Look for event listeners not removed
   - Look for growing arrays/caches

5. **Force garbage collection**:
   - Click trash icon
   - Wait 2 seconds
   - Take third snapshot
   - Should be closer to baseline

**Expected Results**:
- [ ] No significant increase in heap size
- [ ] Detached DOM nodes < 50
- [ ] Event listeners properly cleaned up
- [ ] Memory released after GC
- [ ] No growing object counts

**Heap Snapshot Analysis**:
```javascript
// After taking snapshot, look for:
- Retained objects: Should decrease over time
- Detached DOM nodes: Should be < 100
- Event listeners: Should be removed on page unload
- Cache objects: Should have size limits
```

---

### Test 10: Real-World Performance Monitoring

**Objective**: Monitor actual user experience metrics

**Prerequisites**:
- Lighthouse installed
- Pages accessible

**Steps**:

1. **Run Lighthouse audit**:
   ```bash
   # Run on each page
   lighthouse https://localhost:5000/index.html --view
   lighthouse https://localhost:5000/shop.html --view
   lighthouse https://localhost:5000/product.html?id=xyz --view
   lighthouse https://localhost:5000/cart.html --view
   lighthouse https://localhost:5000/checkout.html --view
   ```

2. **Review scores**:
   - Performance score: > 85
   - Best Practices: > 85
   - Accessibility: > 85

3. **Check Core Web Vitals**:
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1

4. **Review recommendations**:
   - Address critical issues
   - Document any trade-offs
   - Plan improvements

**Expected Results**:
- [ ] Lighthouse Performance: > 85
- [ ] LCP: < 2.5 seconds
- [ ] FID: < 100ms
- [ ] CLS: < 0.1
- [ ] All metrics consistent across pages

---

## Performance Baseline Metrics

Record these metrics for each page before and after synchronizer:

```markdown
## Performance Baselines

### index.html
- **Page Load Time**: XXXms → XXXms (+XXms, +X%)
- **Memory**: XXMb → XXMb (+XMb)
- **Lighthouse Score**: XXX → XXX
- **LCP**: XXXms → XXXms
- **FID**: XXXms → XXXms
- **CLS**: 0.XXX → 0.XXX

### shop.html
- **Page Load Time**: XXXms → XXXms
- **Memory**: XXMb → XXMb
- **Lighthouse Score**: XXX → XXX
- **LCP**: XXXms → XXXms
- **FID**: XXXms → XXXms
- **CLS**: 0.XXX → 0.XXX

### [Continue for other pages...]
```

---

## Performance Goals

| Metric | Target | Acceptable | Fail |
|--------|--------|-----------|------|
| Page Load (FCP) | < 1.2s | < 1.5s | > 2s |
| Memory Increase | < 2MB | < 5MB | > 10MB |
| CPU (idle) | < 5% | < 10% | > 15% |
| CPU (updates) | < 30% | < 50% | > 75% |
| Frame Rate | 60 FPS | > 50 FPS | < 30 FPS |
| API Response | < 300ms | < 500ms | > 1s |
| SSE Latency | < 500ms | < 1s | > 2s |
| Lighthouse Score | > 90 | > 85 | < 75 |
| LCP | < 2s | < 2.5s | > 3s |
| FID | < 50ms | < 100ms | > 300ms |
| CLS | < 0.05 | < 0.1 | > 0.25 |

---

## Troubleshooting Performance Issues

### High Memory Usage

**Symptoms**: Memory increasing continuously

**Diagnosis**:
```javascript
// Check cache size
const sync = await UniversalStockSynchronizer.getInstance();
console.log('Cache size:', sync.stockCache.size);
console.log('Subscribed products:', sync.getSubscribedProducts().length);
```

**Solutions**:
1. Check for memory leak in handler functions
2. Verify event listeners are removed properly
3. Check localStorage for growing data
4. Reduce cache TTL if needed

---

### High CPU Usage

**Symptoms**: CPU constantly > 50%

**Diagnosis**:
```javascript
// Profile handler performance
const handler = sync.pageHandlers.values().next().value;
const startTime = performance.now();

// Call handler 100x
for (let i = 0; i < 100; i++) {
  handler({
    productId: 'test-' + i,
    newQuantity: Math.random() * 10
  });
}

console.log('Total time:', (performance.now() - startTime).toFixed(0) + 'ms');
console.log('Per call:', ((performance.now() - startTime) / 100).toFixed(2) + 'ms');
```

**Solutions**:
1. Check for expensive DOM operations in handler
2. Check for missing debounce/throttle
3. Check for unnecessary re-renders
4. Profile with flame graphs

---

### Slow Page Loads

**Symptoms**: FCP > 2 seconds

**Diagnosis**:
1. Run Lighthouse audit
2. Check Network tab for slow requests
3. Check for render-blocking resources
4. Check for large JavaScript files

**Solutions**:
1. Lazy load synchronizer (defer initialization)
2. Async load StockUpdateClient
3. Code splitting for large pages
4. Minify/compress resources

---

## Documentation & Sign-Off

After completing all performance tests:

### Performance Report Template

```markdown
# Performance Testing Report
**Date**: 2025-11-26
**Tester**: [Name]
**Environment**: [Browser, OS, Network]

## Summary
- All tests passed: ✅ YES / ❌ NO
- Performance acceptable: ✅ YES / ❌ NO
- Ready for production: ✅ YES / ❌ NO

## Detailed Results
[Include tables and metrics from each test]

## Issues Found
1. [Issue 1]
2. [Issue 2]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Sign-Off
- [ ] Tester sign-off
- [ ] Team lead approval
- [ ] Ready for deployment
```

---

## Continuous Performance Monitoring

### Recommended Tools

1. **Google Analytics 4**: Track real-world Core Web Vitals
2. **Sentry**: Error tracking and performance monitoring
3. **DataDog**: Advanced APM and infrastructure monitoring
4. **New Relic**: Full-stack observability
5. **Elastic**: Search and analytics platform

### Key Metrics to Monitor

- Page load times (by page)
- User interaction delays
- JavaScript errors
- API response times
- SSE connection health
- Memory usage trends
- CPU usage patterns

