import { Request, Response, NextFunction } from 'express';
import { isHindsightConfigured, checkHindsightConnection } from '../services/hindsight';
import { isGroqConfigured } from '../services/groq';
import { prisma } from '../db/client';

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const hindsightCheck = await checkHindsightConnection();
    const hindsightOk = isHindsightConfigured();
    const groqOk = isGroqConfigured();

    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const incidentCount = await prisma.incident.count();
    const memoryOpCount = await prisma.memoryOperation.count();

    res.json({
      data: {
        hindsight: {
          configured: hindsightOk,
          connected: hindsightCheck.connected,
          baseUrl: process.env.HINDSIGHT_BASE_URL || 'http://localhost:8888',
          bankId: process.env.HINDSIGHT_BANK_ID || 'recallops-demo',
          apiKeyPresent: !!process.env.HINDSIGHT_API_KEY,
          mode: process.env.HINDSIGHT_API_KEY ? 'Cloud' : 'Local Docker (No Auth)',
          healthData: hindsightCheck.healthData,
          connectionError: hindsightCheck.error,
        },
        groq: {
          configured: groqOk,
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          apiKeyPresent: groqOk,
        },
        database: {
          connected: dbOk,
          incidentCount,
          memoryOperationCount: memoryOpCount,
        },
        backend: {
          healthy: true,
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 5000,
        },
        setupChecklist: {
          hindsightBaseUrl: !!process.env.HINDSIGHT_BASE_URL,
          hindsightConnected: hindsightCheck.connected,
          hindsightApiKey: !!process.env.HINDSIGHT_API_KEY,
          hindsightBankId: !!process.env.HINDSIGHT_BANK_ID,
          groqApiKey: groqOk,
          groqModel: !!process.env.GROQ_MODEL,
          database: dbOk,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
