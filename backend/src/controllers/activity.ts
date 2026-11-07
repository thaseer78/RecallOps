import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';

export async function getActivity(_req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        incident: {
          select: { id: true, title: true, service: true, severity: true, status: true },
        },
      },
    });

    const formatted = logs.map((log) => ({
      ...log,
      metadata: JSON.parse(log.metadata || '{}'),
    }));

    res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
}

