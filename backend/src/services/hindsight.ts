/**
 * Hindsight Service
 *
 * Uses the official @vectorize-io/hindsight-client SDK against the local Docker instance (or Hindsight Cloud).
 * Verified SDK methods:
 *   - client.retain(bankId, content, { async?: boolean, context?: string, metadata?: Record<string, string>, timestamp?: Date | string })
 *   - client.recall(bankId, query, options?) -> Promise<RecallResponse> ({ results: RecallResult[], trace?: ... })
 *   - client.reflect(bankId, query, options?) -> Promise<ReflectResponse> ({ text: string, based_on?: ReflectFact[] })
 *   - client.getBankProfile(bankId)
 *
 * Handles both local unauthenticated Docker instances (http://localhost:8888) and Cloud instances.
 */
import { HindsightClient, sdk, createClient, createConfig } from '@vectorize-io/hindsight-client';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';
import type { MemoryItem } from '../types';

let hindsightInstance: HindsightClient | null = null;
let rawApiClient: ReturnType<typeof createClient> | null = null;

function getClientPair(): { client: HindsightClient; rawClient: ReturnType<typeof createClient> } | null {
  const baseUrl = process.env.HINDSIGHT_BASE_URL;
  if (!baseUrl) {
    hindsightInstance = null;
    rawApiClient = null;
    return null;
  }

  if (hindsightInstance && rawApiClient) {
    return { client: hindsightInstance, rawClient: rawApiClient };
  }

  const apiKey = process.env.HINDSIGHT_API_KEY || undefined;

  try {
    hindsightInstance = new HindsightClient({
      baseUrl,
      apiKey,
    });

    rawApiClient = createClient(
      createConfig({
        baseUrl,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      }),
    );

    logger.info('Hindsight client initialized', { baseUrl, authenticated: !!apiKey });
    return { client: hindsightInstance, rawClient: rawApiClient };
  } catch (error) {
    logger.error('Failed to initialize Hindsight client', { error });
    return null;
  }
}

function getBankId(): string {
  return process.env.HINDSIGHT_BANK_ID || 'recallops-demo';
}

export function isHindsightConfigured(): boolean {
  return !!process.env.HINDSIGHT_BASE_URL;
}

/**
 * Health / Connection check to Hindsight
 */
export async function checkHindsightConnection(): Promise<{
  connected: boolean;
  baseUrl: string;
  bankId: string;
  authenticated: boolean;
  healthData?: Record<string, unknown>;
  error?: string;
}> {
  const baseUrl = process.env.HINDSIGHT_BASE_URL || 'http://localhost:8888';
  const bankId = getBankId();
  const authenticated = !!process.env.HINDSIGHT_API_KEY;

  try {
    const res = await fetch(`${baseUrl}/health`);
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      return {
        connected: true,
        baseUrl,
        bankId,
        authenticated,
        healthData: data,
      };
    } else {
      return {
        connected: false,
        baseUrl,
        bankId,
        authenticated,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      baseUrl,
      bankId,
      authenticated,
      error: `Connection refused or unreachable: ${msg}`,
    };
  }
}

async function logMemoryOperation(params: {
  operation: 'retain' | 'recall' | 'reflect';
  query?: string;
  content?: string;
  incidentId?: string;
  resultCount?: number;
  success: boolean;
  errorMsg?: string;
}) {
  try {
    await prisma.memoryOperation.create({
      data: {
        operation: params.operation,
        bankId: getBankId(),
        query: params.query || '',
        content: params.content ? params.content.substring(0, 500) : '',
        incidentId: params.incidentId || '',
        resultCount: params.resultCount || 0,
        success: params.success,
        errorMsg: params.errorMsg || '',
      },
    });
  } catch (err) {
    logger.warn('Failed to log memory operation', { err });
  }
}

export interface RetainOptions {
  incidentId?: string;
  context?: string;
  metadata?: Record<string, unknown>;
  async?: boolean;
}

export interface RetainResult {
  success: boolean;
  memoryRef: string;
  hindsightConfigured: boolean;
  error?: string;
}

export interface RecallResult {
  memories: MemoryItem[];
  hindsightConfigured: boolean;
  error?: string;
}

export interface ReflectResult {
  synthesis: string;
  hindsightConfigured: boolean;
  error?: string;
}

/**
 * Retain a confirmed incident lesson in Hindsight.
 * Only called AFTER an engineer confirms the verified root cause and resolution.
 */
export async function retainLesson(
  content: string,
  options: RetainOptions = {},
): Promise<RetainResult> {
  const pair = getClientPair();
  const bankId = getBankId();

  if (!pair) {
    logger.info('Hindsight not configured — retention skipped');
    await logMemoryOperation({
      operation: 'retain',
      content,
      incidentId: options.incidentId,
      success: false,
      errorMsg: 'Hindsight is not configured',
    });
    return {
      success: false,
      memoryRef: '',
      hindsightConfigured: false,
      error: 'Hindsight is not configured. Set HINDSIGHT_BASE_URL.',
    };
  }

  const { client, rawClient } = pair;

  // Convert metadata values to strings as required by Hindsight API
  const stringMetadata: Record<string, string> = {
    source: 'recallops',
    version: '1.0.0',
    incidentId: options.incidentId || '',
  };
  if (options.metadata) {
    for (const [k, v] of Object.entries(options.metadata)) {
      if (v !== undefined && v !== null) {
        stringMetadata[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }
  }

  try {
    // Default to synchronous retain so fact extraction and persistence are verified before returning success
    const retainOptions = {
      context: options.context || 'Incident resolution lesson',
      timestamp: new Date(),
      metadata: stringMetadata,
      async: options.async ?? false,
    };

    const retainRes = await client.retain(bankId, content, retainOptions);

    if (!retainRes || !retainRes.success) {
      // SDK client.retain returned undefined on API error — check raw SDK call to extract detail
      const rawRes = await sdk.retainMemories({
        client: rawClient,
        path: { bank_id: bankId },
        body: {
          items: [{
            content,
            context: retainOptions.context,
            metadata: stringMetadata,
            timestamp: retainOptions.timestamp.toISOString(),
          }],
          async: retainOptions.async,
        },
      });

      const errorMsg =
        (rawRes.error as { detail?: string })?.detail ||
        JSON.stringify(rawRes.error || 'Retain rejected by Hindsight');

      logger.error('Hindsight retain failed', { error: errorMsg });

      await logMemoryOperation({
        operation: 'retain',
        content,
        incidentId: options.incidentId,
        success: false,
        errorMsg,
      });

      return {
        success: false,
        memoryRef: '',
        hindsightConfigured: true,
        error: `Hindsight retain failed: ${errorMsg}`,
      };
    }

    const operationId = (retainRes as unknown as { operation_id?: string }).operation_id;
    const memoryRef = operationId
      ? `hindsight:${bankId}:${operationId}`
      : `hindsight:${bankId}:${Date.now()}`;

    logger.info('Lesson successfully retained in Hindsight', {
      bankId,
      incidentId: options.incidentId,
      operationId,
    });

    await logMemoryOperation({
      operation: 'retain',
      content,
      incidentId: options.incidentId,
      resultCount: retainRes.items_count || 1,
      success: true,
    });

    return {
      success: true,
      memoryRef,
      hindsightConfigured: true,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Hindsight retain encountered exception', { error: msg });

    await logMemoryOperation({
      operation: 'retain',
      content,
      incidentId: options.incidentId,
      success: false,
      errorMsg: msg,
    });

    return {
      success: false,
      memoryRef: '',
      hindsightConfigured: true,
      error: `Hindsight retain failed: ${msg}`,
    };
  }
}

/**
 * Recall relevant historical memories for an incident investigation.
 * Uses Hindsight 4-way parallel search (semantic, keyword BM25, graph, temporal).
 */
export async function recallRelevantMemories(
  query: string,
  incidentId?: string,
): Promise<RecallResult> {
  const pair = getClientPair();
  const bankId = getBankId();

  if (!pair) {
    logger.info('Hindsight not configured — recall skipped');
    await logMemoryOperation({
      operation: 'recall',
      query,
      incidentId,
      success: false,
      errorMsg: 'Hindsight is not configured',
    });
    return {
      memories: [],
      hindsightConfigured: false,
      error: 'Hindsight is not configured. Set HINDSIGHT_BASE_URL.',
    };
  }

  const { client } = pair;

  try {
    const response = await client.recall(bankId, query, {
      budget: 'mid',
      includeEntities: true,
    });

    // Extract results from RecallResponse ({ results: Array<RecallResult> })
    const rawResults = Array.isArray(response)
      ? response
      : Array.isArray(response?.results)
        ? response.results
        : [];

    const memories: MemoryItem[] = rawResults.map((r) => ({
      content: r.text || (r as unknown as { content?: string }).content || JSON.stringify(r),
      score: (r as unknown as { score?: number }).score ?? undefined,
      timestamp: (r as unknown as { occurred_start?: string; timestamp?: string }).occurred_start || undefined,
      metadata: r.metadata || undefined,
    }));

    logger.info('Hindsight recall completed', {
      bankId,
      query: query.substring(0, 80),
      count: memories.length,
    });

    await logMemoryOperation({
      operation: 'recall',
      query,
      incidentId,
      resultCount: memories.length,
      success: true,
    });

    return {
      memories,
      hindsightConfigured: true,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Hindsight recall failed', { error: msg });

    await logMemoryOperation({
      operation: 'recall',
      query,
      incidentId,
      success: false,
      errorMsg: msg,
    });

    return {
      memories: [],
      hindsightConfigured: true,
      error: `Hindsight recall failed: ${msg}`,
    };
  }
}

/**
 * Reflect — synthesize reasoning over historical memory subset.
 */
export async function reflectOnMemories(
  query: string,
  incidentId?: string,
): Promise<ReflectResult> {
  const pair = getClientPair();
  const bankId = getBankId();

  if (!pair) {
    logger.info('Hindsight not configured — reflect skipped');
    await logMemoryOperation({
      operation: 'reflect',
      query,
      incidentId,
      success: false,
      errorMsg: 'Hindsight is not configured',
    });
    return {
      synthesis: '',
      hindsightConfigured: false,
      error: 'Hindsight is not configured.',
    };
  }

  const { client, rawClient } = pair;

  try {
    const response = await client.reflect(bankId, query, { budget: 'low' });

    if (!response || !response.text) {
      // Check raw response for upstream errors (e.g., LLM service tier issues)
      const rawRes = await sdk.reflect({
        client: rawClient,
        path: { bank_id: bankId },
        body: { query, budget: 'low' },
      });

      const errorMsg =
        (rawRes.error as { detail?: string })?.detail ||
        'Reflection could not be synthesized by upstream LLM';

      logger.warn('Hindsight reflect returned empty or error', { errorMsg });

      await logMemoryOperation({
        operation: 'reflect',
        query,
        incidentId,
        success: false,
        errorMsg,
      });

      return {
        synthesis: '',
        hindsightConfigured: true,
        error: errorMsg,
      };
    }

    logger.info('Hindsight reflect completed successfully', {
      bankId,
      length: response.text.length,
    });

    await logMemoryOperation({
      operation: 'reflect',
      query,
      incidentId,
      resultCount: 1,
      success: true,
    });

    return {
      synthesis: response.text,
      hindsightConfigured: true,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Hindsight reflect failed', { error: msg });

    await logMemoryOperation({
      operation: 'reflect',
      query,
      incidentId,
      success: false,
      errorMsg: msg,
    });

    return {
      synthesis: '',
      hindsightConfigured: true,
      error: `Hindsight reflect failed: ${msg}`,
    };
  }
}

export async function getMemoryStats() {
  const ops = await prisma.memoryOperation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const retains = ops.filter((o) => o.operation === 'retain');
  const recalls = ops.filter((o) => o.operation === 'recall');
  const reflects = ops.filter((o) => o.operation === 'reflect');
  const successfulRetains = retains.filter((o) => o.success);

  return {
    totalRetains: retains.length,
    totalRecalls: recalls.length,
    totalReflects: reflects.length,
    successfulRetains: successfulRetains.length,
    hindsightConfigured: isHindsightConfigured(),
    bankId: getBankId(),
    recentOperations: ops.slice(0, 20),
  };
}
