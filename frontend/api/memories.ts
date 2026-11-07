import { incidentsStore } from './data';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, body } = req;

  // Handle POST /api/memories/recall
  if (method === 'POST' && req.url.includes('/recall')) {
    const queryStr = (body.query || '').toLowerCase();
    const resolved = incidentsStore.filter((i) => i.resolution?.hindsightRetained);

    // Score based on keyword overlap
    const results = resolved.map((i) => {
      const text = `${i.title} ${i.service} ${i.symptoms} ${i.resolution.actualCause} ${i.resolution.resolution}`.toLowerCase();
      const words = queryStr.split(/\s+/).filter(Boolean);
      let matchCount = 0;
      words.forEach((w: string) => {
        if (text.includes(w)) matchCount++;
      });
      const score = words.length > 0 ? Math.min(0.96, 0.65 + (matchCount / words.length) * 0.3) : 0.72;

      return {
        content: `INCIDENT RESOLUTION [${i.service} - ${i.id}]:
Title: ${i.title}
Root Cause: ${i.resolution.actualCause}
Confirmed Resolution: ${i.resolution.resolution}
Outcome: ${i.resolution.outcome}`,
        score,
        timestamp: i.resolution.resolvedAt,
        metadata: {
          incidentId: i.id,
          service: i.service,
          severity: i.severity,
          memoryRef: i.resolution.hindsightMemoryRef,
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
    const retained = incidentsStore
      .filter((i) => i.resolution?.hindsightRetained)
      .map((i) => ({
        incidentId: i.id,
        incidentTitle: i.title,
        service: i.service,
        severity: i.severity,
        actualCause: i.resolution.actualCause,
        resolution: i.resolution.resolution,
        outcome: i.resolution.outcome,
        memoryRef: i.resolution.hindsightMemoryRef,
        resolvedAt: i.resolution.resolvedAt,
      }));

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

    const stats = {
      totalRetains: retained.length,
      totalRecalls: 14,
      totalReflects: 2,
      successfulRetains: retained.length,
      hindsightConfigured: true,
      bankId: 'recallops-demo',
    };

    return res.json({
      data: {
        stats,
        recentOperations,
        retainedLessons: retained,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
