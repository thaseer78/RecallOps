export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const activities = [
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

  if (req.method === 'GET') {
    return res.json({
      data: activities,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
