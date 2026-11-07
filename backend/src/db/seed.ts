/**
 * Database seed script — populates synthetic demonstration incidents.
 * These are clearly labeled as synthetic data for demo purposes only.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYNTHETIC_INCIDENTS = [
  {
    id: 'synth-incident-001',
    title: 'Payment API — Database Connection Pool Exhaustion',
    service: 'payment-api',
    severity: 'Critical',
    status: 'Resolved',
    isSynthetic: true,
    symptoms: [
      'HTTP 503 errors on /api/payments/* endpoints',
      'Database connection timeout errors appearing in application logs',
      'Connection pool at maximum capacity (pool_size=5, connections_used=5/5)',
      'Request queue depth increasing — 2,400 requests queued',
      'Average response time increased from 120ms to 45,000ms',
    ].join('\n'),
    logs: [
      '[ERROR] 2024-01-15T14:23:11Z payment-api: Too many connections: pool exhausted (pool_size=5)',
      '[ERROR] 2024-01-15T14:23:12Z payment-api: Connection timeout after 30000ms',
      '[WARN]  2024-01-15T14:23:15Z payment-api: Request queue depth: 2400',
      '[ERROR] 2024-01-15T14:23:18Z payment-api: Unable to acquire connection from pool within timeout',
      '[ERROR] 2024-01-15T14:23:22Z payment-api: HTTP 503 Service Unavailable returned to client',
      '[METRIC] 2024-01-15T14:23:30Z payment-api: db_connections_active=5, db_connections_idle=0',
    ].join('\n'),
  },
  {
    id: 'synth-incident-002',
    title: 'Auth Service — Elevated Login Latency and Intermittent Timeouts',
    service: 'auth-service',
    severity: 'High',
    status: 'Resolved',
    isSynthetic: true,
    symptoms: [
      'Login endpoint p99 latency increased from 180ms to 8,200ms',
      'Intermittent timeout errors on /auth/token endpoint',
      'Token validation taking 6-8 seconds instead of <100ms',
      'Cache hit rate dropped from 94% to 12%',
      'Increased load on user database — 480 queries/sec vs normal 50 queries/sec',
    ].join('\n'),
    logs: [
      '[WARN]  2024-01-20T09:14:33Z auth-service: Token cache miss rate: 88% (threshold: 20%)',
      '[ERROR] 2024-01-20T09:14:35Z auth-service: Token validation timeout after 8192ms',
      '[WARN]  2024-01-20T09:14:40Z auth-service: Cache backend unreachable — falling back to database',
      '[METRIC] 2024-01-20T09:15:00Z auth-service: cache_hit_rate=0.12, db_queries_per_sec=480',
      '[ERROR] 2024-01-20T09:15:02Z auth-service: Redis connection failed: ECONNREFUSED',
      '[WARN]  2024-01-20T09:15:10Z auth-service: Elevated DB load detected — circuit breaker threshold approaching',
    ].join('\n'),
  },
  {
    id: 'synth-incident-003',
    title: 'Order Processing — Queue Backlog and Consumer Throughput Degradation',
    service: 'order-processor',
    severity: 'High',
    status: 'Resolved',
    isSynthetic: true,
    symptoms: [
      'Order processing queue depth increasing — 12,000 messages backlogged',
      'Consumer throughput dropped from 500 orders/min to 18 orders/min',
      'Individual order processing time increased from 200ms to 45,000ms',
      'Consumer instances restarting frequently (avg restart every 90 seconds)',
      'DLQ (Dead Letter Queue) receiving 340 messages/minute',
    ].join('\n'),
    logs: [
      '[ERROR] 2024-01-25T16:45:22Z order-processor: Message processing failed, attempt 1/3: downstream timeout',
      '[WARN]  2024-01-25T16:45:25Z order-processor: Retry backoff: 30000ms (exponential retry misconfigured)',
      '[ERROR] 2024-01-25T16:45:55Z order-processor: Message processing failed, attempt 2/3: downstream timeout',
      '[WARN]  2024-01-25T16:45:58Z order-processor: Queue depth: 12000 messages (SLA threshold: 500)',
      '[ERROR] 2024-01-25T16:46:28Z order-processor: Message moved to DLQ after 3 failed attempts',
      '[METRIC] 2024-01-25T16:46:30Z order-processor: throughput=18/min, dlq_rate=340/min, consumers_active=4',
    ].join('\n'),
  },
];

const SYNTHETIC_RESOLUTIONS = [
  {
    id: 'synth-res-001',
    incidentId: 'synth-incident-001',
    proposedCause: 'Database query performance degradation',
    actualCause: 'Incorrect database connection pool configuration — pool_size=5 was insufficient for traffic load. Default pool size was not updated when traffic scaled 10x.',
    resolution: 'Updated database connection pool configuration: increased pool_size from 5 to 25, set pool_timeout=30000, configured pool_idle_timeout=600000. Verified service recovery by monitoring connection metrics for 30 minutes post-deployment.',
    outcome: 'Service fully recovered. HTTP 503 errors dropped to 0. Response times returned to baseline (p99: 145ms). Connection pool utilization stable at 40-60%.',
    hindsightRetained: true,
    hindsightMemoryRef: 'synth-memory-001',
  },
  {
    id: 'synth-res-002',
    incidentId: 'synth-incident-002',
    proposedCause: 'Database query optimization needed',
    actualCause: 'Token validation cache TTL was incorrectly set to 1 second (should be 300 seconds) due to a misconfigured environment variable CACHE_TTL=1 (interpreted as seconds, not minutes). This caused near-100% cache misses, forcing every token validation to query the database directly.',
    resolution: 'Corrected CACHE_TTL environment variable from 1 to 300. Restarted auth-service to apply configuration. Verified Redis cache health and confirmed hit rate recovery to 92% within 5 minutes. Added monitoring alert for cache_hit_rate < 70%.',
    outcome: 'Login latency returned to normal (p99: 165ms). Cache hit rate recovered to 92%. Database query rate returned to baseline (48 queries/sec). Added runbook for cache configuration validation.',
    hindsightRetained: true,
    hindsightMemoryRef: 'synth-memory-002',
  },
  {
    id: 'synth-res-003',
    incidentId: 'synth-incident-003',
    proposedCause: 'Consumer scaling insufficient for queue depth',
    actualCause: 'Message retry configuration used an exponential backoff starting at 30 seconds (RETRY_BASE_MS=30000) instead of 1 second (RETRY_BASE_MS=1000). This meant each failed message consumed a consumer slot for 30+ seconds during retry waits, effectively blocking throughput from 500 orders/min to 18 orders/min.',
    resolution: 'Updated RETRY_BASE_MS from 30000 to 1000 in order-processor configuration. Applied max retry cap of 3 attempts with max backoff of 30 seconds total. Redeployed consumers. Monitored queue drain for 20 minutes to confirm throughput recovery. Added alert for DLQ rate > 50/min.',
    outcome: 'Consumer throughput recovered to 520 orders/min. Queue depth drained from 12,000 to 0 within 25 minutes. DLQ rate dropped to 2/min. Runbook updated with retry configuration guidelines.',
    hindsightRetained: true,
    hindsightMemoryRef: 'synth-memory-003',
  },
];

async function seed() {
  console.log('🌱 Seeding database with synthetic demonstration incidents...');
  console.log('⚠️  These are SYNTHETIC data for demo purposes only.\n');

  // Clear existing synthetic data
  await prisma.resolution.deleteMany({ where: { incidentId: { startsWith: 'synth-' } } });
  await prisma.investigation.deleteMany({ where: { incidentId: { startsWith: 'synth-' } } });
  await prisma.activityLog.deleteMany({ where: { incidentId: { startsWith: 'synth-' } } });
  await prisma.incident.deleteMany({ where: { isSynthetic: true } });

  // Create incidents
  for (const incident of SYNTHETIC_INCIDENTS) {
    await prisma.incident.create({ data: incident });
    console.log(`  ✓ Created incident: ${incident.title}`);
  }

  // Create resolutions for resolved incidents
  for (const resolution of SYNTHETIC_RESOLUTIONS) {
    await prisma.resolution.create({ data: resolution });
    console.log(`  ✓ Created resolution for: ${resolution.incidentId}`);
  }

  // Seed activity log
  await prisma.activityLog.createMany({
    data: [
      {
        type: 'incident_created',
        incidentId: 'synth-incident-001',
        message: 'Synthetic incident created: Payment API connection exhaustion',
        metadata: JSON.stringify({ isSynthetic: true }),
      },
      {
        type: 'resolution_confirmed',
        incidentId: 'synth-incident-001',
        message: 'Resolution confirmed and lesson retained in Hindsight (synthetic demo data)',
        metadata: JSON.stringify({ isSynthetic: true }),
      },
      {
        type: 'incident_created',
        incidentId: 'synth-incident-002',
        message: 'Synthetic incident created: Auth service latency',
        metadata: JSON.stringify({ isSynthetic: true }),
      },
      {
        type: 'resolution_confirmed',
        incidentId: 'synth-incident-002',
        message: 'Resolution confirmed and lesson retained in Hindsight (synthetic demo data)',
        metadata: JSON.stringify({ isSynthetic: true }),
      },
      {
        type: 'incident_created',
        incidentId: 'synth-incident-003',
        message: 'Synthetic incident created: Order processing queue backlog',
        metadata: JSON.stringify({ isSynthetic: true }),
      },
      {
        type: 'resolution_confirmed',
        incidentId: 'synth-incident-003',
        message: 'Resolution confirmed and lesson retained in Hindsight (synthetic demo data)',
        metadata: JSON.stringify({ isSynthetic: true }),
      },
    ],
  });

  const count = await prisma.incident.count();
  console.log(`\n✅ Seeding complete. Total incidents in database: ${count}`);
  console.log('💡 Note: Run "npm run db:push" before seeding if tables don\'t exist.\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

