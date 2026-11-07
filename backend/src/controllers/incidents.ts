import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import {
  CreateIncidentSchema,
  UpdateIncidentSchema,
  InvestigateSchema,
  ResolveSchema,
} from '../schemas/incident';
import {
  recallRelevantMemories,
  reflectOnMemories,
  retainLesson,
  isHindsightConfigured,
} from '../services/hindsight';
import { runInvestigation, isGroqConfigured } from '../services/groq';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

function getParamId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : String(raw || '');
}

function formatIncidentForMemory(incident: {
  id: string;
  title: string;
  service: string;
  severity: string;
  symptoms: string;
  logs: string;
}, resolution: {
  actualCause: string;
  resolution: string;
  outcome: string;
}): string {
  return `RECALLOPS INCIDENT LESSON
Incident ID: ${incident.id}
Service: ${incident.service}
Severity: ${incident.severity}
Title: ${incident.title}

SYMPTOMS:
${incident.symptoms}

LOG PATTERNS:
${incident.logs || 'No logs recorded'}

VERIFIED ROOT CAUSE:
${resolution.actualCause}

CONFIRMED RESOLUTION:
${resolution.resolution}

OUTCOME:
${resolution.outcome}

This is a verified, human-confirmed incident resolution retained for future reference.`;
}

export async function listIncidents(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, severity, service, limit = '50', offset = '0' } = req.query;

    const where: Record<string, string> = {};
    if (typeof status === 'string') where.status = status;
    if (typeof severity === 'string') where.severity = severity;
    if (typeof service === 'string') where.service = service;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: { investigations: { orderBy: { createdAt: 'desc' }, take: 1 }, resolution: true },
        orderBy: { createdAt: 'desc' },
        take: parseInt(String(limit), 10),
        skip: parseInt(String(offset), 10),
      }),
      prisma.incident.count({ where }),
    ]);

    // Parse JSON fields
    const formatted = incidents.map((inc) => ({
      ...inc,
      investigations: inc.investigations.map((inv) => ({
        ...inv,
        rootCauses: JSON.parse(inv.rootCauses || '[]'),
        evidence: JSON.parse(inv.evidence || '[]'),
        similarIncidents: JSON.parse(inv.similarIncidents || '[]'),
        steps: JSON.parse(inv.steps || '[]'),
        remediation: JSON.parse(inv.remediation || '[]'),
        safetyWarnings: JSON.parse(inv.safetyWarnings || '[]'),
        rawMemories: JSON.parse(inv.rawMemories || '[]'),
      })),
    }));

    res.json({ data: formatted, total });
  } catch (err) {
    next(err);
  }
}

export async function getIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getParamId(req);
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        investigations: { orderBy: { createdAt: 'desc' } },
        resolution: true,
        activityLog: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    const formatted = {
      ...incident,
      investigations: (incident.investigations || []).map((inv) => ({
        ...inv,
        rootCauses: JSON.parse(inv.rootCauses || '[]'),
        evidence: JSON.parse(inv.evidence || '[]'),
        similarIncidents: JSON.parse(inv.similarIncidents || '[]'),
        steps: JSON.parse(inv.steps || '[]'),
        remediation: JSON.parse(inv.remediation || '[]'),
        safetyWarnings: JSON.parse(inv.safetyWarnings || '[]'),
        rawMemories: JSON.parse(inv.rawMemories || '[]'),
      })),
      activityLog: (incident.activityLog || []).map((log) => ({
        ...log,
        metadata: JSON.parse(log.metadata || '{}'),
      })),
    };

    res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateIncidentSchema.parse(req.body);

    const incident = await prisma.incident.create({
      data: {
        title: body.title,
        service: body.service,
        severity: body.severity,
        status: body.status,
        symptoms: body.symptoms,
        logs: body.logs,
        isSynthetic: body.isSynthetic,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: 'incident_created',
        incidentId: incident.id,
        message: `New incident created: ${incident.title}`,
        metadata: JSON.stringify({ severity: incident.severity, service: incident.service }),
      },
    });

    res.status(201).json({ data: incident, message: 'Incident created successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getParamId(req);
    const body = UpdateIncidentSchema.parse(req.body);

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) throw new AppError('Incident not found', 404);

    const updated = await prisma.incident.update({
      where: { id },
      data: body,
    });

    res.json({ data: updated, message: 'Incident updated' });
  } catch (err) {
    next(err);
  }
}

export async function investigateIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incidentId = getParamId(req);
    const overrides = InvestigateSchema.parse(req.body);

    // Load incident
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new AppError('Incident not found', 404);

    // Merge overrides
    const title = overrides.title || incident.title;
    const service = overrides.service || incident.service;
    const severity = overrides.severity || incident.severity;
    const symptoms = overrides.symptoms || incident.symptoms;
    const logs = overrides.logs || incident.logs;

    // Update status to Investigating
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: 'Investigating' },
    });

    await prisma.activityLog.create({
      data: {
        type: 'investigation_started',
        incidentId,
        message: `AI investigation started for: ${title}`,
        metadata: JSON.stringify({ hindsightConfigured: isHindsightConfigured(), groqConfigured: isGroqConfigured() }),
      },
    });

    // Build recall query from symptoms and service
    const recallQuery = `${service} incident: ${title}. Symptoms: ${symptoms.substring(0, 300)}`;

    // Step 1: Recall relevant historical memories
    logger.info('Recalling historical memories', { incidentId, service });
    const recallResult = await recallRelevantMemories(recallQuery, incidentId);

    // Step 2: Reflect if memories exist
    let reflectResult = { synthesis: '', hindsightConfigured: recallResult.hindsightConfigured };
    if (recallResult.memories.length > 0) {
      const reflectQuery = `Analyze patterns across incidents similar to: ${title} on ${service}. What patterns exist and what do they suggest about root causes?`;
      reflectResult = await reflectOnMemories(reflectQuery, incidentId);
    }

    // Step 3: Run Groq investigation
    const investigationInput = {
      incidentId,
      title,
      service,
      severity,
      symptoms,
      logs,
      hindsightMemories: recallResult.memories,
      hindsightReflection: reflectResult.synthesis || undefined,
      hindsightConfigured: recallResult.hindsightConfigured,
    };

    const { output, groqConfigured, error: groqError } = await runInvestigation(investigationInput);

    if (!groqConfigured || !output) {
      // Return a structured "not configured" response
      res.status(202).json({
        data: null,
        hindsightConfigured: recallResult.hindsightConfigured,
        groqConfigured,
        memoriesFound: recallResult.memories.length,
        error: groqError || 'AI investigation unavailable',
        message: 'Investigation could not be completed. Configure API credentials to enable AI analysis.',
      });
      return;
    }

    // Save investigation to database
    const investigation = await prisma.investigation.create({
      data: {
        incidentId,
        summary: output.summary,
        rootCauses: JSON.stringify(output.rootCauses),
        evidence: JSON.stringify(output.evidence),
        similarIncidents: JSON.stringify(output.similarIncidents),
        steps: JSON.stringify(output.steps),
        remediation: JSON.stringify(output.remediation),
        confidence: output.confidence,
        confidenceReason: output.confidenceReason,
        safetyWarnings: JSON.stringify(output.safetyWarnings),
        hindsightUsed: recallResult.memories.length > 0,
        memoryCount: recallResult.memories.length,
        rawMemories: JSON.stringify(recallResult.memories),
      },
    });

    await prisma.activityLog.create({
      data: {
        type: 'investigation_completed',
        incidentId,
        message: `Investigation complete — ${recallResult.memories.length} historical memories used`,
        metadata: JSON.stringify({
          memoryCount: recallResult.memories.length,
          confidence: output.confidence,
          hindsightUsed: recallResult.memories.length > 0,
        }),
      },
    });

    res.json({
      data: {
        ...investigation,
        rootCauses: output.rootCauses,
        evidence: output.evidence,
        similarIncidents: output.similarIncidents,
        steps: output.steps,
        remediation: output.remediation,
        safetyWarnings: output.safetyWarnings,
        rawMemories: recallResult.memories,
      },
      hindsightConfigured: recallResult.hindsightConfigured,
      groqConfigured: true,
      memoriesFound: recallResult.memories.length,
      memoryRecallError: recallResult.error,
    });
  } catch (err) {
    next(err);
  }
}

export async function resolveIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const incidentId = getParamId(req);
    const body = ResolveSchema.parse(req.body);

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { investigations: { orderBy: { createdAt: 'desc' }, take: 1 }, resolution: true },
    });

    if (!incident) throw new AppError('Incident not found', 404);
    if (incident.resolution) throw new AppError('Incident already resolved', 409);

    // Build memory content for Hindsight retention
    const memoryContent = formatIncidentForMemory(incident, body);

    // Retain the confirmed lesson in Hindsight (only after human confirmation)
    const retainResult = await retainLesson(memoryContent, {
      incidentId,
      context: `Incident resolution: ${incident.title} on ${incident.service}`,
      metadata: {
        service: incident.service,
        severity: incident.severity,
        resolvedAt: new Date().toISOString(),
      },
    });

    // Save resolution
    const resolution = await prisma.resolution.create({
      data: {
        incidentId,
        proposedCause: body.proposedCause,
        actualCause: body.actualCause,
        resolution: body.resolution,
        outcome: body.outcome,
        hindsightRetained: retainResult.success,
        hindsightMemoryRef: retainResult.memoryRef,
      },
    });

    // Update incident status
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: 'Resolved' },
    });

    await prisma.activityLog.create({
      data: {
        type: 'resolution_confirmed',
        incidentId,
        message: `Incident resolved. Lesson ${retainResult.success ? 'retained in Hindsight' : 'NOT retained — Hindsight unavailable'}`,
        metadata: JSON.stringify({
          hindsightRetained: retainResult.success,
          hindsightConfigured: retainResult.hindsightConfigured,
          memoryRef: retainResult.memoryRef,
        }),
      },
    });

    res.json({
      data: resolution,
      hindsightRetained: retainResult.success,
      hindsightConfigured: retainResult.hindsightConfigured,
      memoryRef: retainResult.memoryRef,
      retainError: retainResult.error,
      message: retainResult.success
        ? 'Incident resolved and lesson retained in Hindsight memory.'
        : `Incident resolved. Hindsight retention failed: ${retainResult.error}`,
    });
  } catch (err) {
    next(err);
  }
}
