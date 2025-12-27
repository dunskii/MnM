# Load Testing for Music 'n Me

This directory contains load testing configuration using [Artillery](https://artillery.io) to ensure the Music 'n Me platform can handle production traffic loads.

## Target Performance

**Concurrent Users**: 200 (Music 'n Me has ~200 students, assumes peak usage)

**Performance Goals**:
- Error rate: < 1%
- p95 response time: < 1000ms
- p99 response time: < 2000ms
- Calendar with 500+ events: < 2500ms
- Hybrid booking race conditions: < 5% failure rate (acceptable for double-booking prevention)

## Installation

Artillery is included as a dev dependency. Install it with:

```bash
cd apps/backend
npm install
```

## Available Test Suites

### 1. Full Load Test (Recommended)

Tests all major workflows with 200 concurrent users over 6 minutes.

```bash
npm run load-test
```

**Scenarios Tested**:
- Health checks
- User authentication
- Dashboard loading (Admin, Teacher, Parent)
- Calendar operations (read/write)
- Student data access
- Attendance marking
- Hybrid lesson booking

**Load Profile**:
- Warm up: 60s @ 10 users/sec
- Ramp up: 120s @ 50 users/sec
- Sustained: 180s @ 200 users/sec

### 2. Dashboard Load Test

Focuses on dashboard performance under load.

```bash
npm run load-test:dashboard
```

**Tests**:
- Admin dashboard (40% of traffic)
- Teacher dashboard (35% of traffic)
- Parent dashboard (25% of traffic)

**Each dashboard loads**:
- Overview stats
- Recent activity
- Upcoming lessons
- Financial summaries
- Student statistics

**Load Profile**:
- Baseline: 60s @ 20 users/sec
- Peak: 120s @ 50 users/sec

### 3. Calendar Load Test

Tests calendar with 500+ events (typical school term).

```bash
npm run load-test:calendar
```

**Tests**:
- Full month view (500+ events)
- Week view scrolling
- Drag-and-drop reschedule
- Calendar refresh after updates

**Load Profile**:
- Baseline: 60s @ 15 users/sec
- Peak: 120s @ 40 users/sec

**Expected Behavior**:
- p95 < 1200ms (calendar queries are more expensive)
- p99 < 2500ms

### 4. Hybrid Booking Concurrency Test

Tests race condition handling for hybrid lesson slot booking.

```bash
npm run load-test:hybrid
```

**Tests**:
- Multiple parents booking same slot simultaneously
- Booking cancellation and rebooking
- Admin schedule management
- Conflict logging

**Load Profile**:
- Warmup: 30s @ 5 users/sec
- Concurrent rush: 90s @ 20 users/sec
- Peak rush: 60s @ 30 users/sec

**Expected Behavior**:
- Some bookings will fail (409 Conflict) - this is correct behavior
- Failure rate < 5% acceptable
- No data corruption
- First request wins, others get clear error message

### 5. Full Report Generation

Runs full load test and generates HTML report.

```bash
npm run load-test:report
```

This will:
1. Run the full load test suite
2. Save results to `tests/load/report.json`
3. Generate HTML report from results
4. Open report in browser automatically

## Test Configuration

### artillery.yml

Main configuration file with all scenarios.

**Key Settings**:
- `target`: Base URL (default: http://localhost:5000)
- `phases`: Load profile definition
- `ensure`: Performance assertions
- `scenarios`: Test workflows with weights

### processor.js

Custom functions for test data generation.

**Functions**:
- `generateRandomData`: Creates random emails, IDs, names
- `logResponse`: Logs errors for debugging
- `trackCustomMetrics`: Custom metric tracking

### Scenarios Directory

Individual test suites for focused testing:
- `dashboard.yml`: Dashboard load tests
- `calendar.yml`: Calendar performance tests
- `hybrid-booking.yml`: Concurrency tests

## Running Tests

### Prerequisites

1. **Start the backend server**:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Ensure database is seeded**:
   ```bash
   npm run db:seed
   ```

3. **Ensure Redis is running**:
   ```bash
   # Docker
   docker run -d -p 6379:6379 redis:7-alpine

   # Or use local Redis installation
   ```

### Running Against Local Environment

Default configuration targets `http://localhost:5000`:

```bash
npm run load-test
```

### Running Against Staging

Update target URL in test files or override via command line:

```bash
artillery run tests/load/artillery.yml --target https://staging.musicnme.com.au
```

### Running Against Production

**⚠️ WARNING**: Only run load tests against production during off-peak hours and with reduced load.

```bash
# Reduce load for production testing
artillery run tests/load/artillery.yml \
  --target https://musicnme.com.au \
  --overrides '{"config":{"phases":[{"duration":60,"arrivalRate":10}]}}'
```

## Interpreting Results

### Console Output

Artillery displays real-time metrics during test execution:

```
Summary report @ 14:23:45(+1000)
------------------------------------------------------------------
Scenarios launched:  1200
Scenarios completed: 1195
Requests completed:  4780
Mean response/sec:   79.67
Response time (msec):
  min: 12
  max: 1823
  median: 145
  p95: 687
  p99: 1234
Scenario counts:
  User Authentication Flow: 240 (20%)
  Dashboard Load: 300 (25%)
  Calendar Operations: 240 (20%)
Errors:
  ECONNREFUSED: 2
  HTTP 409: 23
```

### Key Metrics

**Scenarios launched vs completed**:
- Should be nearly equal
- Large difference indicates timeouts or failures

**Response times**:
- `p95`: 95% of requests faster than this
- `p99`: 99% of requests faster than this
- Focus on p95/p99, not max (outliers happen)

**Error rate**:
- `(Errors / Requests) * 100`
- Target: < 1%
- Hybrid booking 409 errors are expected (race conditions)

**Throughput**:
- `Mean response/sec`
- Should match or exceed `arrivalRate` in config

### HTML Report

Generate detailed HTML report:

```bash
npm run load-test:report
```

**Report includes**:
- Request rate over time
- Response time distribution
- Error breakdown
- Percentile graphs
- Custom metrics

## Debugging Failed Tests

### High Error Rate (> 1%)

**Check**:
1. Server logs for errors
2. Database connection pool exhausted
3. Redis connection issues
4. Rate limiting triggered
5. Memory leaks

**Solutions**:
- Increase database pool size
- Add connection retry logic
- Optimize slow queries
- Increase server resources

### Slow Response Times

**Check**:
1. Database query performance (use `EXPLAIN`)
2. Missing database indexes
3. N+1 query problems
4. Large payload sizes
5. CPU/memory usage

**Solutions**:
- Add database indexes
- Implement query optimization
- Add caching layer (Redis)
- Paginate large result sets

### Timeouts

**Check**:
1. Default timeout in Artillery (30s)
2. Server timeout settings
3. Database query timeout
4. Network issues

**Solutions**:
- Increase timeout for slow endpoints
- Optimize long-running queries
- Add progress indicators for long operations

### Race Condition Issues (Hybrid Booking)

**Expected behavior**:
- First request succeeds (200)
- Subsequent requests fail (409 Conflict)
- No data corruption
- Clear error messages

**Red flags**:
- Double bookings (data corruption)
- Deadlocks
- Database constraint violations

## Performance Optimization Tips

### Database

1. **Add indexes** for frequently queried columns:
   ```sql
   CREATE INDEX idx_lessons_school_date ON lessons(schoolId, startTime);
   CREATE INDEX idx_students_school ON students(schoolId);
   ```

2. **Use connection pooling** (Prisma default: 10):
   ```env
   DATABASE_POOL_SIZE=20
   ```

3. **Optimize queries** with `select`:
   ```typescript
   // Only fetch needed fields
   const students = await prisma.student.findMany({
     select: { id: true, firstName: true, lastName: true }
   });
   ```

### API

1. **Add caching** for frequently accessed data:
   ```typescript
   // Cache dashboard stats for 5 minutes
   const stats = await redis.get(`dashboard:admin:${schoolId}`);
   if (!stats) {
     // Fetch from database and cache
   }
   ```

2. **Paginate large responses**:
   ```typescript
   const lessons = await prisma.lesson.findMany({
     take: 50,
     skip: page * 50
   });
   ```

3. **Use compression** (already enabled via helmet)

### Background Jobs

1. **Process jobs concurrently**:
   ```typescript
   emailQueue.process(5, async (job) => { /* ... */ });
   ```

2. **Rate limit external APIs**:
   ```typescript
   // Limit Google Drive API calls
   await rateLimiter.wait();
   ```

## Continuous Integration

Add load testing to CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run load-test:report
      - uses: actions/upload-artifact@v3
        with:
          name: load-test-report
          path: apps/backend/tests/load/report.json
```

## Monitoring in Production

While load testing is for pre-production, monitor these metrics in production:

**Application Metrics**:
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Active connections

**Database Metrics**:
- Connection pool usage
- Query execution time
- Slow query log
- Lock wait time

**Redis Metrics**:
- Memory usage
- Evicted keys
- Queue depth
- Job processing time

**Business Metrics**:
- Booking completion rate
- Payment success rate
- Email delivery rate
- User login success rate

## Troubleshooting

### "ECONNREFUSED" Errors

Server not running or wrong port.

```bash
# Check server is running
curl http://localhost:5000/health

# Check correct port
echo $PORT
```

### "Too Many Connections" Errors

Database connection pool exhausted.

```env
# Increase pool size
DATABASE_POOL_SIZE=20
```

### "Redis connection failed"

Redis not running or wrong URL.

```bash
# Check Redis
redis-cli ping

# Should return: PONG
```

### "Artillery not found"

Artillery not installed.

```bash
npm install
```

## Best Practices

1. **Always test locally first** before running against staging/production
2. **Gradually increase load** to identify breaking point
3. **Monitor server resources** during tests (CPU, memory, disk I/O)
4. **Run tests multiple times** to account for variability
5. **Test with realistic data** (500+ events for calendar)
6. **Document baseline metrics** to track performance over time
7. **Schedule regular load tests** (weekly or after major changes)
8. **Don't test during production peak hours**

## Resources

- [Artillery Documentation](https://artillery.io/docs)
- [Load Testing Best Practices](https://artillery.io/docs/guides/guides/best-practices)
- [Artillery GitHub](https://github.com/artilleryio/artillery)

## Support

For issues or questions:
- Check Artillery docs first
- Review server logs
- Check database performance
- Contact DevOps team

---

**Last Updated**: 2025-12-26
