/**
 * Groq Service
 *
 * Uses the groq-sdk for LLM reasoning.
 * Keeps structured prompt logic in this module.
 * Never exposes the API key to the frontend.
 */
import Groq from 'groq-sdk';
import { z } from 'zod';
import { logger } from '../utils/logger';
import type { MemoryItem } from '../types';

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn('GROQ_API_KEY not configured — Groq is unavailable');
    return null;
  }

  groqClient = new Groq({ apiKey });
  return groqClient;
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

// --- Zod schema for structured investigation output ---
const RootCauseSchema = z.object({
  hypothesis: z.string(),
  type: z.enum(['verified_historical', 'current_observation', 'ai_hypothesis']),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
});

const EvidenceSchema = z.object({
  source: z.enum(['hindsight_memory', 'current_incident', 'pattern_analysis']),
  description: z.string(),
  incidentRef: z.string().optional(),
  timestamp: z.string().optional(),
});

const InvestigationStepSchema = z.object({
  priority: z.number().int().min(1),
  action: z.string(),
  rationale: z.string(),
  safeToAutomate: z.boolean(),
});

const RemediationItemSchema = z.object({
  action: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  requiresApproval: z.boolean(),
  historicallyVerified: z.boolean(),
});

const SimilarIncidentSchema = z.object({
  incidentId: z.string(),
  title: z.string(),
  service: z.string(),
  similarity: z.number().min(0).max(1),
  resolvedWith: z.string().optional(),
  memorySource: z.boolean(),
});

export const InvestigationOutputSchema = z.object({
  summary: z.string(),
  rootCauses: z.array(RootCauseSchema).max(5),
  evidence: z.array(EvidenceSchema).max(10),
  similarIncidents: z.array(SimilarIncidentSchema).max(5),
  steps: z.array(InvestigationStepSchema).max(8),
  remediation: z.array(RemediationItemSchema).max(6),
  confidence: z.number().min(0).max(1),
  confidenceReason: z.string(),
  safetyWarnings: z.array(z.string()).max(5),
});

export type InvestigationOutput = z.infer<typeof InvestigationOutputSchema>;

export interface InvestigationInput {
  incidentId: string;
  title: string;
  service: string;
  severity: string;
  symptoms: string;
  logs?: string;
  hindsightMemories: MemoryItem[];
  hindsightReflection?: string;
  hindsightConfigured: boolean;
}

function buildInvestigationPrompt(input: InvestigationInput): string {
  const memorySection = input.hindsightConfigured
    ? input.hindsightMemories.length > 0
      ? `
## HISTORICAL MEMORY FROM HINDSIGHT (verified, retrieved from persistent memory)
The following are REAL previously resolved incidents retrieved from Hindsight memory. 
These are VERIFIED facts, not hypotheses. Reference them explicitly in your analysis.

${input.hindsightMemories.map((m, i) => `
Memory ${i + 1}:
${m.content || '[No content]'}
Relevance score: ${m.score?.toFixed(3) || 'N/A'}
Timestamp: ${m.timestamp || 'Unknown'}
`).join('\n---\n')}

${input.hindsightReflection ? `
## HINDSIGHT SYNTHESIS (pattern analysis across memory bank)
${input.hindsightReflection}
` : ''}
`
      : `
## HINDSIGHT MEMORY STATUS
Hindsight is CONFIGURED but returned NO relevant historical memories for this incident.
This is a cold-start investigation — no historical precedent is available.
Do NOT fabricate historical memories. Base your analysis on the current incident only.
`
    : `
## HINDSIGHT MEMORY STATUS
Hindsight is NOT configured. No historical memory is available.
This is an unconfigured-mode investigation. Flag this clearly in your response.
`;

  return `You are RecallOps, an expert AI incident investigation assistant for software engineering and DevOps teams.

Analyze the following incident and produce a structured investigation report.

## CURRENT INCIDENT
- ID: ${input.incidentId}
- Title: ${input.title}
- Affected Service: ${input.service}
- Severity: ${input.severity}
- Symptoms:
${input.symptoms}

${input.logs ? `## LOGS AND ERROR MESSAGES\n${input.logs}` : ''}

${memorySection}

## INSTRUCTIONS
Produce a thorough incident investigation. You MUST:

1. CLEARLY DISTINGUISH between:
   - verified_historical: Facts confirmed by previous resolved incidents (from Hindsight memories)
   - current_observation: What you can observe from the current incident symptoms/logs
   - ai_hypothesis: Your analytical reasoning (NOT confirmed facts)

2. NEVER present a hypothesis as a confirmed root cause.
3. NEVER suggest automatic remediation or autonomous infrastructure changes.
4. ALL remediation steps MUST have requiresApproval: true for anything that modifies production systems.
5. If Hindsight memories are present, explicitly reference them in evidence and similar incidents.
6. If NO memories are available, say so clearly — do NOT fabricate historical incidents.
7. Set confidence appropriately — lower confidence when no historical precedent exists.
8. Include safety warnings for any high-risk investigation steps.

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "2-3 sentence incident summary",
  "rootCauses": [
    {
      "hypothesis": "Description of potential root cause",
      "type": "verified_historical | current_observation | ai_hypothesis",
      "confidence": 0.0-1.0,
      "evidence": "What evidence supports this"
    }
  ],
  "evidence": [
    {
      "source": "hindsight_memory | current_incident | pattern_analysis",
      "description": "Evidence description",
      "incidentRef": "optional incident ID reference",
      "timestamp": "optional ISO timestamp"
    }
  ],
  "similarIncidents": [
    {
      "incidentId": "ID or N/A",
      "title": "Title",
      "service": "service name",
      "similarity": 0.0-1.0,
      "resolvedWith": "How it was resolved",
      "memorySource": true if from Hindsight memory
    }
  ],
  "steps": [
    {
      "priority": 1,
      "action": "Investigation action",
      "rationale": "Why this step",
      "safeToAutomate": false
    }
  ],
  "remediation": [
    {
      "action": "Remediation step",
      "risk": "low | medium | high",
      "requiresApproval": true,
      "historicallyVerified": true if confirmed by past incident
    }
  ],
  "confidence": 0.0-1.0,
  "confidenceReason": "Explanation of confidence level",
  "safetyWarnings": ["Warning 1", "Warning 2"]
}`;
}

export async function runInvestigation(
  input: InvestigationInput,
): Promise<{ output: InvestigationOutput | null; groqConfigured: boolean; error?: string }> {
  const client = getGroqClient();

  if (!client) {
    return {
      output: null,
      groqConfigured: false,
      error: 'Groq is not configured. Add GROQ_API_KEY to run AI investigations.',
    };
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const prompt = buildInvestigationPrompt(input);

  try {
    logger.info('Starting Groq investigation', {
      model,
      service: input.service,
      severity: input.severity,
      memoryCount: input.hindsightMemories.length,
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a precise incident investigation AI. You respond only with valid JSON. Never fabricate historical data. Always distinguish between verified facts and hypotheses.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response from Groq');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error(`Invalid JSON from Groq: ${rawContent.substring(0, 200)}`);
    }

    const validated = InvestigationOutputSchema.parse(parsed);
    logger.info('Investigation complete', { confidence: validated.confidence });

    return { output: validated, groqConfigured: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Groq investigation failed', { error: msg });
    return {
      output: null,
      groqConfigured: true,
      error: `Investigation failed: ${msg}`,
    };
  }
}

