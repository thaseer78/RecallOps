# RecallOps — Hackathon Live Demo Script (3 to 5 Minutes)

> **Demonstration Goal**: Prove that RecallOps learns from resolved incidents using Hindsight persistent memory, visibly transforming future investigations from generic cold-start guesses into evidence-backed, fast resolutions.

---

## ⏱️ Demo Timeline Overview

| Time | Segment | Primary Screen | Key Talking Point |
|---|---|---|---|
| **0:00 - 0:45** | Problem & Architecture | Dashboard | "Stateless LLMs suffer from institutional amnesia. RecallOps uses Hindsight persistent memory." |
| **0:45 - 1:45** | Cold-Start Incident Investigation | AI Investigation Workspace | "Investigating an outage with zero prior memory: structured first-principles analysis." |
| **1:45 - 2:45** | Human Confirmation & Retention | Resolution Modal & Memory Explorer | "Only human-verified fixes are retained into Hindsight persistent memory." |
| **2:45 - 3:45** | Memory-Informed Investigation | AI Investigation Workspace | "A similar incident occurs: Hindsight instantly recalls the previous lesson with semantic scoring." |
| **3:45 - 4:30** | Memory Explorer & Reflection | Hindsight Memory Explorer | "Interactive verification of Hindsight bank, similarity metrics, and cross-incident reflection." |
| **4:30 - 5:00** | Wrap-Up & Safety Model | Settings & Dashboard | "Zero hallucinations, human-in-the-loop safety, and reproducible deployment." |

---

## 🎬 Step-by-Step Walkthrough

### Part 1: Dashboard & System Health (0:00 - 0:45)
1. **Action**: Open `http://localhost:5173/` in your browser.
2. **Talking Points**:
   > *"Welcome to RecallOps. Modern DevOps and SRE teams face a major hurdle: organizational amnesia. Post-mortems are written in static docs that nobody reads during a 3 AM outage. RecallOps integrates Hindsight persistent memory so engineering teams never debug the same outage twice."*
3. **Show**:
   - Point to the **Memory Bank: `recallops-demo`** badge in the top navbar.
   - Point to the **Hindsight: Active** and **Groq LLM: Active** status indicators.
   - Show the KPI telemetry cards: Total Incidents, Open Incidents, and Memory Bank Telemetry (Retains, Recalls, Reflects).

---

### Part 2: Cold-Start Investigation (0:45 - 1:45)
1. **Action**: Click **"AI Investigation"** in the sidebar (or navigate to `/investigate`).
2. **Action**: Click the quick-scenario button **"DB Pool Outage"** (or select an open incident like `INC-001`).
   - *Symptoms*: High latency, connection timeouts on checkout service (`ETIMEDOUT`, active connections reaching pool limit of 50).
3. **Action**: Click **"Start AI Investigation"**.
4. **Talking Points**:
   > *"Notice the cold-start behavior. If this is a novel outage type, RecallOps clearly reports: 'No relevant historical memories found.' It performs a first-principles architectural analysis, cleanly separating Verified Facts, Current Observations, and AI Hypotheses."*
5. **Expected Output**:
   - Status badge shows: `Cold-Start Analysis (No Prior Memories)`.
   - Structured recommendation: increase pool limit or check slow queries.
   - Warning that this diagnosis is a hypothesis requiring human verification.

---

### Part 3: Human Confirmation & Memory Retention (1:45 - 2:45)
1. **Action**: Click **"Confirm Resolution & Retain Lesson"** button.
2. **Talking Points**:
   > *"Here is the critical safety rule: RecallOps NEVER pollutes persistent memory with unverified guesses or open tickets. Only after an engineer confirms the actual cause and verified fix is the lesson retained."*
3. **Action**: In the modal, enter:
   - **Actual Root Cause**: `PgBouncer pool saturation caused by unindexed orders query holding connections open.`
   - **Resolution Applied**: `Added index on orders(user_id, created_at) and increased PgBouncer default pool size from 50 to 120.`
   - **Outcome**: `Latency dropped to 45ms. Pool utilization normalized to 35%.`
4. **Action**: Click **"Confirm & Retain in Hindsight"**.
5. **Expected Output**:
   - Toast notification: `Incident resolved and lesson retained in Hindsight memory bank 'recallops-demo'`.
   - Incident badge transitions to `Resolved`.

---

### Part 4: Memory-Informed Investigation (The "Aha!" Moment) (2:45 - 3:45)
1. **Action**: Return to **"AI Investigation"**.
2. **Action**: Enter a new incident with semantically similar symptoms:
   - **Title**: `Payment Gateway Outage — Checkout slow and hanging`
   - **Service**: `payment-service`
   - **Symptoms**: `Transactions stalling with database connection timeouts, queries queuing up during checkout peak.`
3. **Action**: Click **"Start AI Investigation"**.
4. **Talking Points**:
   > *"Watch what happens now. When the new outage occurs, RecallOps automatically invokes Hindsight's 4-way parallel recall. It discovers our earlier PgBouncer resolution with a similarity score over 0.72!"*
5. **Expected Output**:
   - Status banner: `Memory-Informed Investigation (1 Relevant Historical Lesson Found)`.
   - Citation box displays:
     - Prior Incident reference: `PgBouncer pool saturation caused by unindexed orders query`.
     - Similarity Score: `0.74`.
     - Verified Fix: `Add index on orders table and adjust pool size`.
   - Recommended next steps cite previous proven commands rather than speculative guesses.

---

### Part 5: Hindsight Memory Explorer (3:45 - 4:30)
1. **Action**: Click **"Hindsight Memory"** in the sidebar (`/memories`).
2. **Talking Points**:
   > *"In the Memory Explorer, we can inspect Hindsight's actual memory operations in real time. We see our retention events, operation IDs, and full memory bank statistics."*
3. **Action**: In the **Interactive Semantic Recall** query box, type:
   `"database pool exhaustion timeout"` and click **"Run Recall Query"**.
4. **Expected Output**:
   - Returns matching memory units with similarity ranking, timestamps, and extracted entity facts.
5. **Action**: Point to the **Recent Operations Log** displaying real timestamps and operation statuses.

---

### Part 6: Wrap-Up & Safety Architecture (4:30 - 5:00)
1. **Action**: Navigate to **"Settings"** (`/settings`).
2. **Talking Points**:
   > *"In summary, RecallOps turns incidents into institutional assets using Hindsight persistent memory. It maintains strict safety boundaries: no blind autonomous commands, zero credentials in client code, and human-in-the-loop retention gating."*

---

## 🛡️ Groq Free-Tier Rate Limit Contingency Plan

Standard free Groq accounts have an **8,000 Tokens Per Minute (TPM)** limit. Rapidly running retains and reflections can occasionally hit HTTP 429 during a live demo.

### Contingency Protocol:
1. **If Rate Limit Occurs**:
   - RecallOps will display an informative banner: `Groq Rate Limit Reached (Tokens Per Minute). Hindsight cooldown in progress.`
   - **Talking Point to Judges**:
     > *"Notice how the system handles LLM rate limits honestly. Rather than crashing or faking output, RecallOps detects the provider limit, triggers an exponential backoff circuit breaker, and surfaces a clear status banner. This demonstrates production-ready resilience."*
2. **Wait 15 Seconds**: The token bucket refreshes every minute; waiting 15–20 seconds allows the next investigation to complete smoothly.
3. **Pre-Seeded Data Backup**:
   - The memory bank `recallops-demo` already contains verified pre-retained memories from initial test runs.
   - You can jump directly to **Hindsight Memory Explorer** to demonstrate instant semantic recall against existing memories without triggering another LLM generation.

