# RecallOps — Manual End-to-End Testing Checklist

Use this checklist to perform end-to-end verification of all application workflows, UI components, and API endpoints.

---

## 📋 Pre-Flight Verification

- [ ] Node.js version is 20 or higher (`node -v`).
- [ ] Backend dependencies installed (`cd backend && npm install`).
- [ ] Frontend dependencies installed (`cd frontend && npm install`).
- [ ] SQLite database file created and schema pushed (`cd backend && npm run db:push`).
- [ ] Database seeded with synthetic demonstration records (`cd backend && npm run db:seed`).
- [ ] Automated tests pass (`cd backend && npm test` — 19/19 tests passing).

---

## 🖥️ Frontend & UI Testing Checklist

### 1. Dashboard Overview (`/dashboard`)
- [ ] KPI cards render correctly: Total Incidents (3+), Active/Open, Resolved, Critical, Retained Lessons.
- [ ] Severity breakdown progress bars reflect current database distribution.
- [ ] Monitored active services pill tags display correctly.
- [ ] Recent incident activity and response logs render with timestamps.
- [ ] Memory Engine pill indicator in sidebar displays `CONNECTED` or `DEMO MODE` accurately.

### 2. Incident Command Center (`/incidents`)
- [ ] Table renders with all seeded incidents showing Service, Details, Severity, Status, and Reported date.
- [ ] Search input filters incidents in real-time by title, service, and symptoms.
- [ ] Severity dropdown filters correctly (Critical, High, Medium, Low).
- [ ] Status dropdown filters correctly (Open, Investigating, Resolved).
- [ ] "Report Incident" button opens modal.
- [ ] Creating an incident with title, service, severity, and symptoms adds the incident to the table and navigates correctly.

### 3. AI Investigation Workspace (`/investigate`)
- [ ] Selecting an existing incident from the dropdown populates title, service, severity, symptoms, and logs.
- [ ] Quick demo buttons ("DB Pool Outage", "Auth Cache Spike", "Queue Backlog") instantly populate realistic scenarios.
- [ ] Clicking "Start AI Investigation" triggers loading state with spinner and progress messages.
- [ ] When Hindsight has matching memories, report surfaces **Memory-Informed Investigation** badge with memory count.
- [ ] Report displays structured root causes with verification tags: `VERIFIED HISTORICAL`, `CURRENT OBSERVATION`, and `AI HYPOTHESIS`.
- [ ] Similar incidents list displays similarity percentage and historical resolution.
- [ ] Recommended runbook steps display priority order and `Human Verified` tags.
- [ ] Remediation actions clearly indicate `Requires Human Approval` and risk level.
- [ ] Blast radius precautions / safety warnings display in an alert banner.

### 4. Human Resolution & Hindsight Retention Loop
- [ ] Clicking "Confirm Resolution & Retain" opens the resolution confirmation dialog.
- [ ] Engineer enters verified root cause, resolution, and outcome.
- [ ] Submitting updates incident status to `Resolved`.
- [ ] If Hindsight credentials are configured, memory reference key is generated and stored.
- [ ] If in demo mode, application clearly communicates that the resolution is recorded in the local database while Hindsight Cloud is in standby.

### 5. Hindsight Memory Explorer (`/memory`)
- [ ] Memory stats display Retained Lessons, Recall Invocations, Reflect Syntheses, and Bank ID (`recallops-demo`).
- [ ] Interactive Recall Inspector allows submitting queries (e.g., `"database connection pool timeout"`).
- [ ] Test recall returns matching memories with relevance scores.
- [ ] Retained Lessons grid displays all verified solutions with links to source incidents.
- [ ] Hindsight operations audit table lists chronological `RETAIN`, `RECALL`, and `REFLECT` calls.

### 6. Learning History (`/history`)
- [ ] 4-step learning cycle diagram renders clearly.
- [ ] Retained incident lessons list displays full post-mortem details.
- [ ] Chronological audit trail displays all system events.

### 7. Settings & Connection Status (`/settings`)
- [ ] Hindsight Cloud card displays base URL, bank ID, and masked API key status.
- [ ] Groq LLM card displays model name and masked API key status.
- [ ] Database card displays SQLite connection status and record counts.
- [ ] Setup checklist marks each environment variable as Configured or Pending.
- [ ] Band AI Desktop guide section displays local endpoint hook syntax.

---

## 📡 API Endpoint Manual Verification (cURL)

```bash
# Health Check
curl http://localhost:5000/api/health

# List Incidents
curl http://localhost:5000/api/incidents

# Get Incident Details
curl http://localhost:5000/api/incidents/synth-incident-001

# Inspect Memory State
curl http://localhost:5000/api/memories

# System Settings & Status
curl http://localhost:5000/api/settings/status
```
All endpoints return valid JSON matching their respective schemas.

