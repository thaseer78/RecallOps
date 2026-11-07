export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      data: {
        hindsight: {
          configured: true,
          bankId: 'recallops-demo',
          baseUrl: 'https://api.hindsight.vectorize.io',
          mode: 'persistent-memory',
        },
        groq: {
          configured: true,
          model: 'llama-3.3-70b-versatile',
        },
        database: {
          connected: true,
          provider: 'sqlite',
        },
        environment: 'production',
        bandAiDesktop: {
          supported: true,
          status: 'ready',
        },
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
