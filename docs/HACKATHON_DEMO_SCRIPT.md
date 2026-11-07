# RecallOps — Hackathon Video Demo Script (2–5 Minutes)

**Target Duration:** 3 minutes 30 seconds  
**Presenters:** 1–2 Engineers (or voiceover with screen recording)

---

## 🎬 Act 1: The Problem (0:00 – 0:40)

**[Visual: Open the RecallOps Dashboard at http://localhost:5173]**

> **Speaker:**  
> "Every software engineer knows the 3 AM on-call nightmare. A critical microservice goes down, alerts are firing, and you’re frantically searching through stale Confluence docs or Slack threads trying to remember: *'Didn't Alice fix this exact database pool issue three months ago?'*  
>  
> Traditional AI assistants are stateless. Every incident is treated like day one. They hallucinate generic advice because they don't have institutional memory.  
>  
> Introducing **RecallOps**: an incident investigation platform where **every resolved incident makes the next response smarter**, powered by Hindsight persistent memory."

---

## 🔍 Act 2: Incident Command Center & The Cold-Start (0:40 – 1:20)

**[Visual: Navigate to Incidents, then to AI Investigation Workspace]**

> **Speaker:**  
> "Here on the Incident Command Center, we see active services and ongoing incidents.  
>  
> When a new incident comes in without historical precedent, RecallOps initiates a **cold-start investigation**. Notice here on our Investigation Workspace: we can paste logs and error traces. Without relevant memories in Hindsight, the AI clearly flags that its hypotheses are derived strictly from first-principles observation—no fabricated history."

---

## 🧠 Act 3: Recalling Past Lessons with Hindsight (1:20 – 2:15)

**[Visual: Click the quick demo scenario 'DB Pool Outage'. Click 'Start AI Investigation'.]**

> **Speaker:**  
> "Now let's see what happens when an outage occurs on our `payment-api`. We have connection timeouts and 503 errors under sudden traffic spikes.  
>  
> We click **'Start AI Investigation'**. Watch what happens under the hood.  
>  
> RecallOps immediately calls Hindsight Cloud using the official `@vectorize-io/hindsight-client` SDK. Hindsight executes a 4-way parallel search across semantic embeddings, BM25 keywords, knowledge graphs, and temporal decay.  
>  
> Look at the report:  
> 1. It explicitly cites **Verified Historical Evidence** from our past incident `synth-incident-001`.  
> 2. It shows the similarity score and tells us that previously, this symptom was resolved by tuning the connection pool size from 5 to 25.  
> 3. It distinguishes between verified facts, current observations, and hypotheses.  
> 4. All remediation suggestions are flagged with **'Requires Human Approval'**—no dangerous unverified autonomous scripts."

---

## 🔄 Act 4: Closing the Learning Loop (2:15 – 3:00)

**[Visual: Click 'Confirm Resolution & Retain'. Fill in verified root cause and click Confirm.]**

> **Speaker:**  
> "Here is the critical distinction: RecallOps does not automatically save AI guesses into memory. AI hypotheses could be wrong!  
>  
> Instead, only when an engineer confirms the physical fix—here we verify the connection pool settings—do we click **'Confirm & Retain Lesson'**.  
>  
> Instantly, RecallOps calls `client.retain()` on Hindsight Cloud. The verified lesson, logs, root cause, and recovery metrics are permanently indexed into our persistent memory bank."

---

## 📊 Act 5: Hindsight Memory Explorer & Wrap-up (3:00 – 3:30)

**[Visual: Navigate to 'Hindsight Memory' tab, test a query in the recall inspector]**

> **Speaker:**  
> "Under the **Hindsight Memory Explorer**, we have full transparency into memory operations, retention logs, and an interactive recall tester.  
>  
> When the next incident strikes tomorrow or next year, the system recalls this exact lesson in milliseconds.  
>  
> Built with React, TypeScript, Express, Groq, and Hindsight Cloud, RecallOps turns ephemeral post-mortems into an active, evolving defense system.  
>  
> RecallOps: *Every incident makes the next response smarter.* Thank you!"

