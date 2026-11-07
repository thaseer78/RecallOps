import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { RetainSchema, RecallSchema } from '../schemas/incident';
import {
  retainLesson,
  recallRelevantMemories,
  getMemoryStats,
} from '../services/hindsight';

export async function getMemories(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getMemoryStats();
    const recentOps = await prisma.memoryOperation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get resolutions that have been retained in Hindsight
    const retainedResolutions = await prisma.resolution.findMany({
      where: { hindsightRetained: true },
      include: { incident: true },
      orderBy: { resolvedAt: 'desc' },
    });

    res.json({
      data: {
        stats,
        recentOperations: recentOps,
        retainedLessons: retainedResolutions.map((r) => ({
          incidentId: r.incidentId,
          incidentTitle: r.incident.title,
          service: r.incident.service,
          severity: r.incident.severity,
          actualCause: r.actualCause,
          resolution: r.resolution,
          outcome: r.outcome,
          memoryRef: r.hindsightMemoryRef,
          resolvedAt: r.resolvedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function retainMemory(req: Request, res: Response, next: NextFunction) {
  try {
    const body = RetainSchema.parse(req.body);

    const result = await retainLesson(body.content, {
      context: body.context,
      metadata: body.metadata,
    });

    res.json({
      data: result,
      message: result.success ? 'Lesson retained successfully' : 'Retention failed',
    });
  } catch (err) {
    next(err);
  }
}

export async function recallMemories(req: Request, res: Response, next: NextFunction) {
  try {
    const body = RecallSchema.parse(req.body);
    const result = await recallRelevantMemories(body.query);

    res.json({
      data: {
        memories: result.memories,
        count: result.memories.length,
        hindsightConfigured: result.hindsightConfigured,
        error: result.error,
      },
    });
  } catch (err) {
    next(err);
  }
}

