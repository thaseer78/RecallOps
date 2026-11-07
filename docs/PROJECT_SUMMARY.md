# RecallOps — Hackathon Project Summary

> **Tagline**: An AI Incident Response Agent That Learns From Every Failure.  
> **Built for**: Vectorize Hindsight Hackathon  
> **Technologies**: React 18, Vite, TypeScript, Tailwind CSS, Node.js, Express, Hindsight Persistent Memory (`@vectorize-io/hindsight-client`), Groq LLM API, Prisma ORM, SQLite.

---

## 1. Executive Summary

Every software engineering organization experiences operational incidents. When outages occur at 3 AM, engineers face a pervasive problem: **organizational amnesia**. Post-mortems are locked in static wikis, tribal knowledge evaporates when engineers leave, and generic AI assistants fail to recall architecture-specific lessons.

**RecallOps** bridges this critical gap. It is an intelligent incident investigation assistant that integrates **Hindsight persistent memory** as the core institutional memory substrate. Rather than treating every outage as day one, RecallOps recalls verified historical resolutions, compares telemetry patterns, proposes evidence-backed hypotheses, and captures confirmed post-mortems so engineering teams never debug the same outage twice.

---

## 2. Core Problem Solved

Modern engineering teams struggle with four key operational challenges:
1. **Stateless LLM Amnesia**: Standard LLMs have no persistent memory of past incidents, leading to generic, repetitive troubleshooting advice.
2. **Tribal Knowledge Loss**: When an engineer fixes an esoteric Kubernetes ingress timeout or connection pool starvation, that knowledge remains siloed in their head or lost in chat logs.
3. **AI Hallucinations in High-Stakes Environments**: Unverified AI models suggest speculative commands without grounding in institutional precedent.
4. **Dangerous Autonomous Remediation**: Autonomous agents executing unsupervised changes in production clusters can trigger cascading outages.

RecallOps solves these challenges by combining **Hindsight's 4-way parallel memory recall** with a **strict human-in-the-loop safety architecture**.

---

## 3. Key Features

- **Grounded AI Incident Investigation**: Automatically ingests incident symptoms, service metadata, and error stack traces. Retrieves semantically similar past incidents with similarity scores and ranking.
- **Strict Evidence Categorization**: Separates investigation output into **Verified Historical Facts**, **Current Incident Observations**, and **AI Hypotheses & Diagnostic Steps**.
- **Human-in-the-Loop Confirmation Gate**: Guarantees that unconfirmed incidents or speculative diagnoses are never retained in Hindsight. Only human-verified fixes become persistent memories.
- **Hindsight Memory Explorer**: An interactive developer tool allowing SREs to inspect the persistent memory bank, run ad-hoc semantic queries, evaluate recall similarity scores, and review fact extraction.
- **Cross-Incident Pattern Reflection**: Leverages `client.reflect()` to synthesize multi-incident patterns, identifying systemic architectural vulnerabilities across microservices.
- **Audit Trail & Activity Stream**: Tracks all investigations, confirmed resolutions, and memory operations for compliance and team visibility.

---

## 4. System Architecture & Technology Separation

RecallOps enforces clean separation of concerns:
- **Application State (SQLite via Prisma)**: Manages transactional application records, incident lifecycle states (`Open`, `Investigating`, `Resolved`), audit trails, and user activity history.
- **Persistent Memory Bank (Hindsight)**: The authoritative institutional memory engine. Employs 4-way parallel retrieval (semantic embedding vectors, keyword BM25, knowledge graph entities, and temporal proximity) and background asynchronous fact extraction.
- **Reasoning Layer (Groq LLM)**: Fast, structured LLM inference using `llama-3.3-70b-versatile` with Zod JSON schema validation to produce structured diagnostic hypotheses.

---

## 5. Lessons Learned & Technical Breakthroughs

1. **Memory Ingestion Asynchrony**: Hindsight's retain operation uses an asynchronous background extraction pipeline. In production-grade workflows, systems cannot assume immediate synchronous availability. RecallOps tracks operation IDs and queries memory bank contents to verify that fact extraction is completed.
2. **LLM Service-Tier Compatibility**: Standard Groq developer tiers do not support the `auto` service tier default in containerized environments. By configuring `HINDSIGHT_API_LLM_GROQ_SERVICE_TIER=on_demand`, RecallOps ensures persistent, error-free background worker fact extraction.
3. **Rate-Limit Resilience**: High-throughput LLM reasoning on developer tiers (8,000 TPM limit) requires graceful circuit breakers and transparent UI notices rather than silent failures.

---

## 6. Future Roadmap

- **PagerDuty & Datadog Ingestion**: Native webhook integrations to auto-trigger investigations upon alert firing.
- **Interactive Slack / Teams Bot**: Enable war-room triage and resolution confirmation directly within on-call channels.
- **Automated Post-Mortem Generator**: Produce standardized markdown post-mortem documents and export them directly to GitHub Discussions.
- **Runbook Drift Detection**: Flag discrepancies between committed runbooks and real-world incident fixes.
