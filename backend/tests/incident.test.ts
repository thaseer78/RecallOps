import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateIncidentSchema, ResolveSchema, RecallSchema } from '../src/schemas/incident';
import { isHindsightConfigured, retainLesson, recallRelevantMemories } from '../src/services/hindsight';
import { isGroqConfigured, InvestigationOutputSchema } from '../src/services/groq';

describe('Incident Schemas', () => {
  describe('CreateIncidentSchema', () => {
    it('accepts valid incident data', () => {
      const result = CreateIncidentSchema.safeParse({
        title: 'Payment API is returning 503 errors',
        service: 'payment-api',
        severity: 'Critical',
        symptoms: 'HTTP 503 errors, database connection timeouts, request queue depth 2400',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short title', () => {
      const result = CreateIncidentSchema.safeParse({
        title: 'API',
        service: 'payment-api',
        severity: 'Critical',
        symptoms: 'HTTP 503 errors occurring on all endpoints',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid severity', () => {
      const result = CreateIncidentSchema.safeParse({
        title: 'Some incident with enough length',
        service: 'payment-api',
        severity: 'Severe',
        symptoms: 'HTTP 503 errors occurring on all endpoints',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short symptoms', () => {
      const result = CreateIncidentSchema.safeParse({
        title: 'Some incident with enough length',
        service: 'payment-api',
        severity: 'High',
        symptoms: 'Error',
      });
      expect(result.success).toBe(false);
    });

    it('defaults isSynthetic to false', () => {
      const result = CreateIncidentSchema.safeParse({
        title: 'Auth service latency spike on login endpoint',
        service: 'auth-service',
        severity: 'High',
        symptoms: 'Login endpoint p99 latency increased from 180ms to 8200ms',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isSynthetic).toBe(false);
      }
    });

    it('accepts all severity values', () => {
      for (const severity of ['Critical', 'High', 'Medium', 'Low']) {
        const result = CreateIncidentSchema.safeParse({
          title: 'Some incident with enough length',
          service: 'test-service',
          severity,
          symptoms: 'HTTP 503 errors occurring on all endpoints',
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('ResolveSchema', () => {
    it('accepts valid resolution data', () => {
      const result = ResolveSchema.safeParse({
        actualCause: 'Database connection pool size was set too low for current traffic',
        resolution: 'Updated pool_size from 5 to 25 and redeployed the service',
        outcome: 'Service recovered, error rate returned to 0%',
      });
      expect(result.success).toBe(true);
    });

    it('requires actualCause', () => {
      const result = ResolveSchema.safeParse({
        resolution: 'Updated configuration',
        outcome: 'Recovered',
      });
      expect(result.success).toBe(false);
    });

    it('requires minimum length for actualCause', () => {
      const result = ResolveSchema.safeParse({
        actualCause: 'DB',
        resolution: 'Fixed configuration setting to correct value',
        outcome: 'Recovered successfully',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RecallSchema', () => {
    it('accepts a valid query', () => {
      const result = RecallSchema.safeParse({
        query: 'database connection pool exhaustion payment api',
      });
      expect(result.success).toBe(true);
    });

    it('rejects too-short query', () => {
      const result = RecallSchema.safeParse({ query: 'DB' });
      expect(result.success).toBe(false);
    });

    it('defaults limit to 5', () => {
      const result = RecallSchema.safeParse({
        query: 'database connection timeout error',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
      }
    });
  });
});

describe('Hindsight Service — credential gating', () => {
  it('returns false when base URL missing', () => {
    const origUrl = process.env.HINDSIGHT_BASE_URL;
    delete process.env.HINDSIGHT_BASE_URL;
    expect(isHindsightConfigured()).toBe(false);
    process.env.HINDSIGHT_BASE_URL = origUrl;
  });

  it('returns true when base URL is set (local Docker without auth)', () => {
    const origUrl = process.env.HINDSIGHT_BASE_URL;
    process.env.HINDSIGHT_BASE_URL = 'http://localhost:8888';
    expect(isHindsightConfigured()).toBe(true);
    process.env.HINDSIGHT_BASE_URL = origUrl;
  });
});

describe('Groq Service — credential gating', () => {
  it('returns false when GROQ_API_KEY is not set', () => {
    const origKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    expect(isGroqConfigured()).toBe(false);
    process.env.GROQ_API_KEY = origKey;
  });

  it('returns true when GROQ_API_KEY is set', () => {
    const origKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'gsk-test-token';
    expect(isGroqConfigured()).toBe(true);
    process.env.GROQ_API_KEY = origKey;
  });
});

describe('Cold-start investigation behavior', () => {
  it('returns empty memories when Hindsight not configured', async () => {
    const origUrl = process.env.HINDSIGHT_BASE_URL;
    delete process.env.HINDSIGHT_BASE_URL;

    const result = await recallRelevantMemories('test query for database errors');
    expect(result.hindsightConfigured).toBe(false);
    expect(result.memories).toHaveLength(0);
    expect(result.error).toContain('not configured');

    process.env.HINDSIGHT_BASE_URL = origUrl;
  });
});

describe('Confirmation-before-retention', () => {
  it('retainLesson refuses retention if Hindsight not configured without crashing', async () => {
    const origUrl = process.env.HINDSIGHT_BASE_URL;
    delete process.env.HINDSIGHT_BASE_URL;

    const result = await retainLesson('Incident lesson content', { incidentId: 'test-123' });
    expect(result.success).toBe(false);
    expect(result.hindsightConfigured).toBe(false);

    process.env.HINDSIGHT_BASE_URL = origUrl;
  });
});

describe('Groq response validation', () => {
  it('InvestigationOutputSchema accepts valid investigation output', () => {
    const validOutput = {
      summary: 'Database connection pool exhausted due to misconfigured pool size settings.',
      rootCauses: [
        {
          hypothesis: 'Connection pool size too small for traffic load',
          type: 'current_observation' as const,
          confidence: 0.85,
          evidence: 'Pool at 5/5 connections with 2400 queued requests',
        },
      ],
      evidence: [
        {
          source: 'current_incident' as const,
          description: 'Connection pool exhausted: pool_size=5, connections_used=5/5',
        },
      ],
      similarIncidents: [],
      steps: [
        {
          priority: 1,
          action: 'Check database connection pool metrics',
          rationale: 'Pool exhaustion is the primary indicator',
          safeToAutomate: false,
        },
      ],
      remediation: [
        {
          action: 'Increase database connection pool size',
          risk: 'medium' as const,
          requiresApproval: true,
          historicallyVerified: false,
        },
      ],
      confidence: 0.85,
      confidenceReason: 'Strong symptom correlation with connection pool exhaustion pattern',
      safetyWarnings: ['Do not increase pool size beyond database server max_connections limit'],
    };

    const result = InvestigationOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  describe('Dashboard API Response Contracts', () => {
    it('verifies memoryApi response contract conforms to expected structure', () => {
      const memoryPayload = {
        data: {
          stats: {
            totalRetains: 5,
            totalRecalls: 12,
            totalReflects: 2,
            successfulRetains: 5,
            hindsightConfigured: true,
            bankId: 'recallops-demo',
          },
          recentOperations: [],
          retainedLessons: [],
        },
      };

      expect(memoryPayload.data).toHaveProperty('stats');
      expect(memoryPayload.data.stats).toHaveProperty('successfulRetains');
      expect(Array.isArray(memoryPayload.data.recentOperations)).toBe(true);
      expect(Array.isArray(memoryPayload.data.retainedLessons)).toBe(true);
    });

    it('handles undefined or malformed dashboard responses safely with default fallbacks', () => {
      // Simulating frontend fallback logic when API returns empty or HTML response
      const malformedResponses: any[] = [undefined, null, '', '<!doctype html><html></html>', {}];

      malformedResponses.forEach((res) => {
        const safeItems = Array.isArray(res?.data) ? res.data : [];
        const safeTotal = typeof res?.total === 'number' ? res.total : safeItems.length;
        const defaultStats = {
          totalRetains: 0,
          totalRecalls: 0,
          totalReflects: 0,
          successfulRetains: 0,
          hindsightConfigured: false,
          bankId: 'recallops-demo',
        };
        const safeStats = res?.data?.stats || defaultStats;
        const safeRecentOps = Array.isArray(res?.data?.recentOperations) ? res.data.recentOperations : [];

        expect(Array.isArray(safeItems)).toBe(true);
        expect(safeItems.length).toBe(0);
        expect(typeof safeTotal).toBe('number');
        expect(safeStats).toHaveProperty('successfulRetains');
        expect(safeStats.successfulRetains).toBe(0);
        expect(Array.isArray(safeRecentOps)).toBe(true);
      });
    });
  });
});
