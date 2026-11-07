# Band AI Desktop Integration Guide

This guide details how **RecallOps** is designed to work with **Band AI Desktop**, ensuring full compatibility with desktop agent workflows, CLI commands, and automated incident triage.

---

## 🖥️ What is Band AI Desktop?

Band AI Desktop provides an autonomous developer workspace and agent interface that interacts directly with local tools, APIs, and terminals. In incident response operations, engineers often run desktop agents to inspect logs, run diagnostic scripts, and query services.

---

## 🔌 RecallOps & Band AI Desktop Compatibility

RecallOps exposes a clean, modular REST API and local SQLite data store designed for Band AI Desktop orchestration:

### 1. Triggering Investigations via Desktop Agents

Band AI Desktop agents can triage incoming alerts by calling the RecallOps investigation endpoint:

```bash
curl -X POST http://localhost:5000/api/incidents/synth-incident-001/investigate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment API connection pool exhaustion",
    "service": "payment-api",
    "severity": "Critical",
    "symptoms": "HTTP 503 errors and connection timeouts"
  }'
```

**Response Payload returned to Band AI Desktop:**
- Recalled historical memories from Hindsight (`rawMemories`).
- Grounded root cause hypotheses cleanly partitioned into `verified_historical`, `current_observation`, and `ai_hypothesis`.
- Step-by-step investigation runbook.
- Suggested remediation marked with `requiresApproval: true`.

---

### 2. Guardrailed Agent Actions (Human-in-the-Loop)

Band AI Desktop agents must **never** execute destructive production commands autonomously. RecallOps enforces safety boundaries:
1. **Approval Gate**: All high-risk or write-level remediation actions return `requiresApproval: true`.
2. **Read-Only Inspection**: Agents can inspect historical memories at `GET /api/memories` or run query tests via `POST /api/memories/recall`.
3. **Verified Post-Mortem Retention**: Once the agent or engineer confirms the fix, the agent can call `POST /api/incidents/:id/resolve` to commit the verified lesson into Hindsight persistent memory.

---

### 3. Agent Tool Configuration (JSON Schema)

When configuring Band AI Desktop with custom tools or MCP (Model Context Protocol), you can expose RecallOps as a tool definition:

```json
{
  "name": "recallops_investigate",
  "description": "Recalls verified historical incident lessons from Hindsight memory and provides structured root cause hypotheses.",
  "parameters": {
    "type": "object",
    "properties": {
      "incidentId": {
        "type": "string",
        "description": "Unique identifier of the incident"
      },
      "symptoms": {
        "type": "string",
        "description": "Observed error logs, symptoms, or latency spikes"
      }
    },
    "required": ["incidentId", "symptoms"]
  }
}
```

---

## 🚀 Running with Band AI Desktop

1. Launch RecallOps backend on port `5000`:
   ```powershell
   cd c:\Thaseer\RecallOps\backend
   npm run dev
   ```
2. In Band AI Desktop, verify connectivity by polling health:
   ```bash
   curl http://localhost:5000/api/health
   ```
3. Use Band AI Desktop prompts like:
   > *"RecallOps, investigate the latency spike on payment-api and check Hindsight memory for similar previous connection pool resolutions."*

