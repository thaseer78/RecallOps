export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const retainedLessons = [
    {
      incidentId: 'synth-incident-001',
      incidentTitle: 'Payment API — Database Connection Pool Exhaustion',
      service: 'payment-api',
      severity: 'Critical',
      actualCause: 'Incorrect database connection pool configuration — pool_size=5 was insufficient for traffic load.',
      resolution: 'Updated database connection pool configuration: increased pool_size from 5 to 25, set pool_timeout=30000, configured pool_idle_timeout=600000.',
      outcome: 'Service fully recovered. HTTP 503 errors dropped to 0. Response times returned to baseline (p99: 145ms).',
      memoryRef: 'synth-memory-001',
      resolvedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      incidentId: 'synth-incident-002',
      incidentTitle: 'Auth Service — Elevated Login Latency and Intermittent Timeouts',
      service: 'auth-service',
      severity: 'High',
      actualCause: 'Token validation cache TTL was incorrectly set to 1 second due to CACHE_TTL=1 unit confusion.',
      resolution: 'Corrected CACHE_TTL to 300 seconds and restarted auth-service. Verified cache hit rate normalized to 92%.',
      outcome: 'Login latency dropped to 165ms. Database query rate returned to baseline 48 queries/sec.',
      memoryRef: 'synth-memory-002',
      resolvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      incidentId: 'synth-incident-003',
      incidentTitle: 'Order Processing — Queue Backlog and Consumer Throughput Degradation',
      service: 'order-processor',
      severity: 'High',
      actualCause: 'Consumer instances restarting due to uncaught timeout exception on downstream inventory API.',
      resolution: 'Implemented circuit breaker with exponential jitter backoff and diverted stalled messages to DLQ.',
      outcome: 'Queue cleared within 12 minutes. Throughput stabilized at baseline 520 orders/min.',
      memoryRef: 'synth-memory-003',
      resolvedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  const recentOperations = [
    {
      id: 'op-01',
      operation: 'retain',
      bankId: 'recallops-demo',
      content: 'Retained verified post-mortem for [payment-api]: Connection pool exhaustion fix',
      resultCount: 1,
      success: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'op-02',
      operation: 'recall',
      bankId: 'recallops-demo',
      query: 'database pool exhaustion timeouts and queue stalls',
      resultCount: 2,
      success: true,
      createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    },
    {
      id: 'op-03',
      operation: 'retain',
      bankId: 'recallops-demo',
      content: 'Retained verified post-mortem for [auth-service]: Token validation cache TTL fix',
      resultCount: 1,
      success: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'op-04',
      operation: 'reflect',
      bankId: 'recallops-demo',
      query: 'cross-service connection pool and downstream timeout vulnerabilities',
      resultCount: 3,
      success: true,
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
    {
      id: 'op-05',
      operation: 'retain',
      bankId: 'recallops-demo',
      content: 'Retained verified post-mortem for [order-processor]: DLQ backoff routing fix',
      resultCount: 1,
      success: true,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  const { method, body } = req;

  // Handle POST /api/memories/recall
  if (method === 'POST') {
    const queryStr = (body?.query || '').toLowerCase();

    // Match memories against query
    const results = retainedLessons.map((l) => {
      const text = `${l.incidentTitle} ${l.service} ${l.actualCause} ${l.resolution}`.toLowerCase();
      const words = queryStr.split(/\s+/).filter(Boolean);
      let matchCount = 0;
      words.forEach((w: string) => {
        if (text.includes(w)) matchCount++;
      });
      const score = words.length > 0 ? Math.min(0.96, 0.68 + (matchCount / words.length) * 0.28) : 0.74;

      return {
        content: `INCIDENT LESSON [${l.service}]:
Title: ${l.incidentTitle}
Root Cause: ${l.actualCause}
Confirmed Resolution: ${l.resolution}
Outcome: ${l.outcome}`,
        score,
        timestamp: l.resolvedAt,
        metadata: {
          incidentId: l.incidentId,
          service: l.service,
          severity: l.severity,
          memoryRef: l.memoryRef,
        },
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));

    return res.json({
      data: {
        memories: results,
        count: results.length,
        hindsightConfigured: true,
      },
    });
  }

  // Handle GET /api/memories
  if (method === 'GET') {
    const stats = {
      totalRetains: retainedLessons.length,
      totalRecalls: 14,
      totalReflects: 2,
      successfulRetains: retainedLessons.length,
      hindsightConfigured: true,
      bankId: 'recallops-demo',
    };

    return res.json({
      data: {
        stats,
        recentOperations,
        retainedLessons,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
