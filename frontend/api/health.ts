export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.json({
    status: 'ok',
    service: 'RecallOps Production API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    hindsight: 'connected',
    bankId: 'recallops-demo',
  });
}
