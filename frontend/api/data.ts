/**
 * In-memory real incident and memory state for Vercel serverless execution.
 * Conforms 100% to Prisma schema and backend controller output.
 */

export interface IncidentRecord {
  id: string;
  title: string;
  service: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved';
  symptoms: string;
  logs: string;
  isSynthetic: boolean;
  createdAt: string;
  updatedAt: string;
  investigations: any[];
  resolution?: any;
}

export interface ActivityRecord {
  id: string;
  type: string;
  incidentId?: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export const initialIncidents: IncidentRecord[] = [
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
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    investigations: [
      {
        id: 'synth-inv-001',
        incidentId: 'synth-incident-001',
        summary: 'Database connection pool saturation under peak load causing cascading HTTP 503 errors across payment services.',
        confidence: 0.94,
        confidenceReason: 'Direct telemetry correlation between connection timeout rate and pool exhaustion metrics.',
        hindsightUsed: true,
        memoryCount: 2,
        rootCauses: [
          {
            type: 'verified_historical',
            hypothesis: 'PgBouncer pool size threshold capped at default 5 connections under traffic spike.',
            confidence: 0.95,
            evidence: 'Active connections pinned at 5/5 with 2,400 requests waiting in acquisition queue.',
          },
        ],
        evidence: [
          { source: 'current_incident', description: 'Connection timeout after 30000ms on all checkout requests' },
        ],
        similarIncidents: [
          {
            id: 'prior-db-pool-01',
            title: 'Checkout Service DB Pool Starvation',
            service: 'payment-api',
            similarity: 0.88,
            resolvedWith: 'Increased pool_size to 25 and adjusted idle connection reaper timeout.',
          },
        ],
        steps: [
          { priority: 1, action: 'Inspect active PgBouncer pool metrics via pg_stat_activity', rationale: 'Verify queue stall causes' },
          { priority: 2, action: 'Scale pool ceiling from 5 to 25 connections', rationale: 'Relieve immediate request backlog' },
        ],
        remediation: [
          { action: 'Increase connection pool_size to 25', risk: 'low', requiresApproval: true, historicallyVerified: true },
        ],
        safetyWarnings: [
          'Ensure database server max_connections threshold is not exceeded when increasing client pool size.',
        ],
        rawMemories: [],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    resolution: {
      id: 'synth-res-001',
      incidentId: 'synth-incident-001',
      actualCause: 'Incorrect database connection pool configuration — pool_size=5 was insufficient for traffic load.',
      resolution: 'Updated database connection pool configuration: increased pool_size from 5 to 25, set pool_timeout=30000, configured pool_idle_timeout=600000.',
      outcome: 'Service fully recovered. HTTP 503 errors dropped to 0. Response times returned to baseline (p99: 145ms).',
      hindsightRetained: true,
      hindsightMemoryRef: 'synth-memory-001',
      resolvedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
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
    ].join('\n'),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    investigations: [
      {
        id: 'synth-inv-002',
        incidentId: 'synth-incident-002',
        summary: 'Redis token cache eviction storm causing all validation queries to hammer Postgres database.',
        confidence: 0.91,
        confidenceReason: 'Direct match with cache TTL misconfiguration pattern.',
        hindsightUsed: true,
        memoryCount: 1,
        rootCauses: [
          {
            type: 'verified_historical',
            hypothesis: 'Token validation cache TTL was set to 1 second instead of 300 seconds due to unit mismatch.',
            confidence: 0.92,
            evidence: 'Cache hit rate collapsed to 12% with 88% miss rate.',
          },
        ],
        evidence: [
          { source: 'current_incident', description: 'Token validation taking 6-8s per request' },
        ],
        similarIncidents: [],
        steps: [
          { priority: 1, action: 'Inspect CACHE_TTL environment variable', rationale: 'Check time unit formatting' },
        ],
        remediation: [
          { action: 'Update CACHE_TTL=300 and restart auth worker pod', risk: 'low', requiresApproval: true, historicallyVerified: true },
        ],
        safetyWarnings: [],
        rawMemories: [],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    resolution: {
      id: 'synth-res-002',
      incidentId: 'synth-incident-002',
      actualCause: 'Token validation cache TTL was incorrectly set to 1 second due to CACHE_TTL=1 unit confusion.',
      resolution: 'Corrected CACHE_TTL to 300 seconds and restarted auth-service. Verified cache hit rate normalized to 92%.',
      outcome: 'Login latency dropped to 165ms. Database query rate returned to baseline 48 queries/sec.',
      hindsightRetained: true,
      hindsightMemoryRef: 'synth-memory-002',
      resolvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
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
    ].join('\n'),
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    investigations: [
      {
        id: 'synth-inv-003',
        incidentId: 'synth-incident-003',
        summary: 'Synchronous downstream inventory API timeouts triggering poison-pill retry cascade.',
        confidence: 0.89,
        confidenceReason: 'Downstream timeout pattern matching unbuffered synchronous retry storms.',
        hindsightUsed: true,
        memoryCount: 1,
        rootCauses: [
          {
            type: 'verified_historical',
            hypothesis: 'Missing circuit breaker on inventory client causing thread starvation during inventory service lag.',
            confidence: 0.90,
            evidence: 'Average restart every 90s due to liveness probe timeout during blocking downstream calls.',
          },
        ],
        evidence: [
          { source: 'current_incident', description: 'Downstream inventory HTTP 504 triggering synchronous retries' },
        ],
        similarIncidents: [],
        steps: [
          { priority: 1, action: 'Enable circuit breaker with 5s timeout on inventory client', rationale: 'Stop worker crash loops' },
        ],
        remediation: [
          { action: 'Route timed-out messages to DLQ and enable circuit breaker', risk: 'medium', requiresApproval: true, historicallyVerified: true },
        ],
        safetyWarnings: [],
        rawMemories: [],
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ],
    resolution: {
      id: 'synth-res-003',
      incidentId: 'synth-incident-003',
      actualCause: 'Consumer instances restarting due to uncaught timeout exception on downstream inventory API.',
      resolution: 'Implemented circuit breaker with exponential jitter backoff and diverted stalled messages to DLQ.',
      outcome: 'Queue cleared within 12 minutes. Throughput stabilized at baseline 520 orders/min.',
      hindsightRetained: true,
      hindsightMemoryRef: 'synth-memory-003',
      resolvedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  },
];

export const initialActivities: ActivityRecord[] = [
  {
    id: 'act-001',
    type: 'lesson_retained',
    incidentId: 'synth-incident-001',
    message: 'Confirmed resolution for [payment-api] retained in Hindsight memory bank recallops-demo',
    metadata: { bankId: 'recallops-demo', memoryRef: 'synth-memory-001' },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'act-002',
    type: 'incident_resolved',
    incidentId: 'synth-incident-001',
    message: 'Incident "Payment API — Database Connection Pool Exhaustion" marked resolved by engineer',
    metadata: { service: 'payment-api', severity: 'Critical' },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'act-003',
    type: 'lesson_retained',
    incidentId: 'synth-incident-002',
    message: 'Confirmed resolution for [auth-service] retained in Hindsight memory bank recallops-demo',
    metadata: { bankId: 'recallops-demo', memoryRef: 'synth-memory-002' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'act-004',
    type: 'lesson_retained',
    incidentId: 'synth-incident-003',
    message: 'Confirmed resolution for [order-processor] retained in Hindsight memory bank recallops-demo',
    metadata: { bankId: 'recallops-demo', memoryRef: 'synth-memory-003' },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Global state in serverless instance
export const incidentsStore = [...initialIncidents];
export const activitiesStore = [...initialActivities];
