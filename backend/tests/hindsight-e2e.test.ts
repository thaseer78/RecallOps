import { describe, it, expect, beforeAll } from 'vitest';
import { checkHindsightConnection, retainLesson, recallRelevantMemories } from '../src/services/hindsight';

describe('Hindsight End-to-End Integration (Local Docker)', () => {
  const bankId = process.env.HINDSIGHT_BANK_ID || 'recallops-demo';
  const baseUrl = process.env.HINDSIGHT_BASE_URL || 'http://localhost:8888';

  beforeAll(() => {
    process.env.HINDSIGHT_BASE_URL = baseUrl;
    process.env.HINDSIGHT_BANK_ID = bankId;
  });

  it('verifies Hindsight connection health endpoint', async () => {
    const health = await checkHindsightConnection();
    expect(health.baseUrl).toBe(baseUrl);
    expect(health.bankId).toBe(bankId);
    expect(health.connected).toBe(true);
  });

  it('retains a synthetic incident lesson, verifies extraction, and recalls it using semantically different query', async () => {
    const syntheticIncidentContent = [
      'RECALLOPS INCIDENT LESSON',
      'Incident ID: synth-e2e-gateway-909',
      'Service: api-gateway',
      'Severity: Critical',
      'Title: Rate Limiter Token Bucket Memory Leak in API Gateway',
      'SYMPTOMS: Out of memory (OOM) kills every 45 minutes on gateway instances with HTTP 502 Bad Gateway errors.',
      'VERIFIED ROOT CAUSE: Memory leak in client IP token bucket tracker because expired IP entries were never pruned from heap.',
      'CONFIRMED RESOLUTION: Implemented active cleanup ticker every 60 seconds with LRU eviction cap of 100000 entries.',
      'OUTCOME: Memory stabilized at 280MB. Zero OOM restarts observed over 48 hours.',
    ].join('\n');

    // Step 1: Retain synthetic incident in Hindsight synchronously so fact extraction completes
    const retainRes = await retainLesson(syntheticIncidentContent, {
      incidentId: 'synth-e2e-gateway-909',
      context: 'Gateway rate limiter OOM post-mortem',
      metadata: {
        service: 'api-gateway',
        testRun: 'e2e-verification',
      },
      async: false,
    });

    expect(retainRes.hindsightConfigured).toBe(true);
    expect(retainRes.success).toBe(true);
    expect(retainRes.memoryRef).toBeDefined();

    // Step 2: Separate recall request querying for the incident using DIFFERENT semantic wording
    const semanticQuery = 'Gateway microservices crashing with out of memory heap exhaustion';
    const recallRes = await recallRelevantMemories(semanticQuery, 'synth-e2e-gateway-909');

    expect(recallRes.hindsightConfigured).toBe(true);
    expect(Array.isArray(recallRes.memories)).toBe(true);
    expect(recallRes.memories.length).toBeGreaterThan(0);

    // Verify the recalled result contains the original incident information
    const matchingMemory = recallRes.memories.find((m) =>
      (m.content || '').toLowerCase().includes('gateway') ||
      (m.content || '').toLowerCase().includes('oom') ||
      (m.content || '').toLowerCase().includes('memory')
    );
    expect(matchingMemory).toBeDefined();
  });
});
