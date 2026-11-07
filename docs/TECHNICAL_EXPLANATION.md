# Technical Explanation: Hindsight Persistent Memory Integration

This document provides a technical walkthrough of how **RecallOps** integrates **Hindsight Cloud** as its central persistent memory substrate, detailing the exact architecture, verified SDK methods, data structures, and the memory lifecycle.

---

## 🏛️ Why Hindsight is Central to RecallOps

In typical AI incident assistants:
- Prompts are stateless. Context windows are ephemeral.
- If an engineer solves an outage today, that knowledge evaporates when the chat session ends.
- Traditional vector databases only store raw embeddings of documents, ignoring semantic graphs, temporal decay, and domain entities.

**Hindsight replaces this fragmented approach.**  
Hindsight serves as the authoritative, long-term memory substrate for RecallOps. Instead of treating incidents as isolated events, Hindsight retains structured multi-dimensional facts and recalls them through a **4-way parallel retrieval fusion**:
1. **Semantic Similarity**: Captures conceptual equivalence across disparate log messages.
2. **Keyword (BM25)**: Matches exact error codes, exception classes (e.g., `ECONNRESET`), and config variables.
3. **Knowledge Graph Traversal**: Discovers topological linkages between microservices, databases, and message queues.
4. **Temporal Proximity**: Models knowledge decay and recency weighting.

---

## 📦 Verified SDK Usage (`@vectorize-io/hindsight-client`)

RecallOps integrates the official `@vectorize-io/hindsight-client` npm package. All operations are scoped by a persistent `bankId` (`recallops-demo`).

### 1. Client Initialization

Located in `backend/src/services/hindsight.ts`:

```typescript
import { HindsightClient } from '@vectorize-io/hindsight-client';

const baseUrl = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';
const apiKey = process.env.HINDSIGHT_API_KEY;

if (baseUrl && apiKey) {
  const client = new HindsightClient({ baseUrl, apiKey });
}
```

If credentials are not yet configured, RecallOps enters an unconfigured/demo standby mode where it gracefully alerts the engineer rather than fabricating fake memory retrieval.

---

### 2. Recalling Historical Lessons (`client.recall`)

When an incident investigation starts, RecallOps constructs a targeted recall query and queries Hindsight:

```typescript
export async function recallRelevantMemories(
  query: string,
  incidentId?: string,
): Promise<RecallResult> {
  const client = await getHindsightClient();
  const bankId = getBankId();

  if (!client) {
    return { memories: [], hindsightConfigured: false, error: 'Hindsight is not configured.' };
  }

  // 4-way parallel memory recall
  const results = await client.recall(bankId, query);

  const memories: MemoryItem[] = Array.isArray(results)
    ? results.map((r: any) => ({
        content: r.content || r.text || JSON.stringify(r),
        score: r.score ?? r.similarity ?? undefined,
        timestamp: r.timestamp,
        metadata: r.metadata,
      }))
    : [];

  return { memories, hindsightConfigured: true };
}
```

The recalled memories are directly injected into Groq's prompt as **immutable verified historical evidence**, enabling the LLM to formulate grounded, safe hypotheses.

---

### 3. Reflecting on Multi-Incident Patterns (`client.reflect`)

When multiple historical incidents are recalled for the same service, RecallOps invokes `reflect` to evaluate architectural patterns:

```typescript
export async function reflectOnMemories(
  query: string,
  incidentId?: string,
): Promise<ReflectResult> {
  const client = await getHindsightClient();
  const bankId = getBankId();

  if (!client) return { synthesis: '', hindsightConfigured: false };

  // Agentic reflection across memory bank
  const result = await client.reflect(bankId, query);

  const synthesis = typeof result === 'string'
    ? result
    : typeof result === 'object' && result !== null && 'content' in result
      ? String((result as any).content)
      : JSON.stringify(result);

  return { synthesis, hindsightConfigured: true };
}
```

---

### 4. Human-Gated Retention (`client.retain`)

A core tenet of RecallOps is that **AI hypotheses are never automatically retained**. Only after a human engineer verifies the physical resolution on production systems is the lesson retained:

```typescript
export async function retainLesson(
  content: string,
  options: RetainOptions = {},
): Promise<RetainResult> {
  const client = await getHindsightClient();
  const bankId = getBankId();

  if (!client) {
    return { success: false, memoryRef: '', hindsightConfigured: false };
  }

  // Retain verified structured post-mortem
  await client.retain(bankId, content, {
    context: options.context || 'Incident resolution lesson',
    timestamp: new Date(),
    metadata: {
      source: 'recallops',
      version: '1.0.0',
      incidentId: options.incidentId || '',
      ...options.metadata,
    },
  });

  const memoryRef = `hindsight:${bankId}:${Date.now()}`;
  return { success: true, memoryRef, hindsightConfigured: true };
}
```

### The Retained Lesson Structure

The payload sent to `client.retain` includes:
```text
RECALLOPS INCIDENT LESSON
Incident ID: synth-incident-001
Service: payment-api
Severity: Critical
Title: Payment API — Database Connection Pool Exhaustion

SYMPTOMS:
HTTP 503 errors on /api/payments/* endpoints
Database connection timeout errors appearing in application logs
Connection pool at maximum capacity (pool_size=5, connections_used=5/5)
Request queue depth increasing — 2,400 requests queued

LOG PATTERNS:
[ERROR] payment-api: Too many connections: pool exhausted (pool_size=5)
[ERROR] payment-api: Connection timeout after 30000ms

VERIFIED ROOT CAUSE:
Incorrect database connection pool configuration — pool_size=5 was insufficient for traffic load.

CONFIRMED RESOLUTION:
Updated database connection pool configuration: increased pool_size from 5 to 25.

OUTCOME:
Service fully recovered. HTTP 503 errors dropped to 0. Response times returned to baseline (p99: 145ms).
```

---

## 🔒 Separation of Database vs. Persistent Memory

RecallOps strictly separates operational application state from persistent AI memory:
- **SQLite (via Prisma)**: Stores application entities (`Incident`, `Investigation`, `Resolution`, `ActivityLog`).
- **Hindsight Cloud**: The AI's cognitive memory bank (`retain`, `recall`, `reflect`).

This ensures that even if local cache or database tables are reset, the institutional intelligence of how your engineering systems operate remains permanently indexed in Hindsight.

