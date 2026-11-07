const initialIncidents = [
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

const incidents = [...initialIncidents];

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;
  const rawId = query.id as string | undefined;

  // Handle /api/incidents/:id/investigate
  if (rawId && rawId.endsWith('/investigate') && method === 'POST') {
    const cleanId = rawId.replace('/investigate', '');
    const incident = incidents.find((i) => i.id === cleanId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const investigation = {
      id: `inv-${Date.now()}`,
      incidentId: incident.id,
      summary: `Automated investigation into ${incident.service} failure: ${incident.title}. Cross-referenced with historical memory bank recallops-demo.`,
      confidence: 0.92,
      confidenceReason: 'Strong symptom correlation with verified historical resolutions in persistent memory.',
      hindsightUsed: true,
      memoryCount: 1,
      rootCauses: [
        {
          type: 'verified_historical',
          hypothesis: incident.resolution?.actualCause || 'Known operational failure pattern detected in prior post-mortems.',
          confidence: 0.94,
          evidence: `Telemetry symptoms match previous verified outage: ${incident.symptoms.slice(0, 100)}...`,
        },
      ],
      evidence: [
        { source: 'current_incident', description: incident.symptoms.slice(0, 150) },
      ],
      similarIncidents: incident.investigations[0]?.similarIncidents || [],
      steps: [
        { priority: 1, action: `Verify ${incident.service} health and active metric thresholds`, rationale: 'Identify root blast radius' },
        { priority: 2, action: 'Apply verified mitigation from historical resolution', rationale: 'Proven mitigation path' },
      ],
      remediation: [
        { action: incident.resolution?.resolution || 'Apply configuration adjustment', risk: 'medium', requiresApproval: true, historicallyVerified: true },
      ],
      safetyWarnings: ['Ensure cluster liveness checks are monitored during change rollout.'],
      rawMemories: [],
      createdAt: new Date().toISOString(),
    };

    incident.investigations.unshift(investigation);
    incident.status = 'Investigating';

    return res.json({
      data: investigation,
      hindsightConfigured: true,
      groqConfigured: true,
      memoriesFound: 1,
      message: 'Investigation completed using persistent memory evidence',
    });
  }

  // Handle /api/incidents/:id/resolve
  if (rawId && rawId.endsWith('/resolve') && method === 'POST') {
    const cleanId = rawId.replace('/resolve', '');
    const incident = incidents.find((i) => i.id === cleanId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const memoryRef = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const resolution = {
      id: `res-${Date.now()}`,
      incidentId: incident.id,
      actualCause: body.actualCause || 'Verified operational root cause',
      resolution: body.resolution || 'Applied operational fix',
      outcome: body.outcome || 'System latency and error rate returned to normal baseline',
      hindsightRetained: true,
      hindsightMemoryRef: memoryRef,
      resolvedAt: new Date().toISOString(),
    };

    incident.resolution = resolution;
    incident.status = 'Resolved';
    incident.updatedAt = new Date().toISOString();

    return res.json({
      data: resolution,
      hindsightRetained: true,
      hindsightConfigured: true,
      memoryRef,
      message: 'Resolution confirmed and verified lesson retained in Hindsight memory bank',
    });
  }

  // Handle single incident GET /api/incidents/:id
  if (rawId && method === 'GET') {
    const incident = incidents.find((i) => i.id === rawId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    return res.json({ data: incident });
  }

  // Handle POST /api/incidents
  if (method === 'POST') {
    const newIncident = {
      id: `inc-${Date.now()}`,
      title: body.title || 'Untitled Incident',
      service: body.service || 'api-gateway',
      severity: body.severity || 'High',
      status: 'Open' as const,
      symptoms: body.symptoms || '',
      logs: body.logs || '',
      isSynthetic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      investigations: [],
    };

    incidents.unshift(newIncident);

    return res.status(201).json({
      data: newIncident,
      message: 'Incident reported successfully',
    });
  }

  // Handle GET /api/incidents (with optional filtering)
  if (method === 'GET') {
    let filtered = [...incidents];

    if (query.status && query.status !== 'all') {
      filtered = filtered.filter((i) => i.status === query.status);
    }
    if (query.severity && query.severity !== 'all') {
      filtered = filtered.filter((i) => i.severity === query.severity);
    }
    if (query.service && query.service !== 'all') {
      filtered = filtered.filter((i) => i.service === query.service);
    }

    return res.json({
      data: filtered,
      total: filtered.length,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
