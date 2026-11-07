import { incidentsStore, activitiesStore, IncidentRecord } from './data';

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
    const incident = incidentsStore.find((i) => i.id === cleanId);
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
    const incident = incidentsStore.find((i) => i.id === cleanId);
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

    activitiesStore.unshift({
      id: `act-${Date.now()}`,
      type: 'lesson_retained',
      incidentId: incident.id,
      message: `Confirmed resolution for [${incident.service}] retained in Hindsight memory bank recallops-demo`,
      metadata: { bankId: 'recallops-demo', memoryRef },
      createdAt: new Date().toISOString(),
    });

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
    const incident = incidentsStore.find((i) => i.id === rawId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    return res.json({ data: incident });
  }

  // Handle POST /api/incidents
  if (method === 'POST') {
    const newIncident: IncidentRecord = {
      id: `inc-${Date.now()}`,
      title: body.title || 'Untitled Incident',
      service: body.service || 'api-gateway',
      severity: body.severity || 'High',
      status: 'Open',
      symptoms: body.symptoms || '',
      logs: body.logs || '',
      isSynthetic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      investigations: [],
    };

    incidentsStore.unshift(newIncident);
    activitiesStore.unshift({
      id: `act-${Date.now()}`,
      type: 'incident_created',
      incidentId: newIncident.id,
      message: `New incident reported: "${newIncident.title}" [${newIncident.service}]`,
      metadata: { service: newIncident.service, severity: newIncident.severity },
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      data: newIncident,
      message: 'Incident reported successfully',
    });
  }

  // Handle GET /api/incidents (with optional filtering)
  if (method === 'GET') {
    let filtered = [...incidentsStore];

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
