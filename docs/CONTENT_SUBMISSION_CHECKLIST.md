# Hackathon Content Submission Checklist

This document details all required deliverables for the submission.

---

## 👥 Per-Member vs. Team-Level Deliverables Matrix

| Deliverable | Scope | Responsible Party | Platform / Target |
|---|---|---|---|
| **Public Technical Article** | **Per-Member** | Every Team Member (Individual) | Dev.to / Medium / Hashnode / Personal Blog |
| **Reddit Share** | **Per-Member** | Every Team Member | Relevant subreddit (e.g., r/programming, r/devops) |
| **LinkedIn Post** | **Per-Member** | Every Team Member (Individual) | Personal LinkedIn Profile |
| **LinkedIn Comment** | **Per-Member** | Every Team Member | Comment on own post linking Hindsight repo |
| **YouTube Demo Video** | **Team-Level** | Team Lead / Representative | Public YouTube Video (2–5 minutes) |
| **GitHub Repository** | **Team-Level** | Team Lead | Public GitHub Repository with README |
| **Final Platform Submission** | **Team-Level** | Team Lead | Hackathon Portal Submission Form |

---

## 📝 1. Individual Technical Article (Per-Member)

> ⚠️ **IMPORTANT WORD COUNT NOTE & INCONSISTENCY ALERT:**  
> The official hackathon competition guide contains an internal inconsistency:
> - Section A cites **800 – 1,500 words**
> - Section B cites **1,200 – 2,000 words**  
> **Recommended Safe Target:** Aim for **1,250 – 1,450 words** to comfortably satisfy *both* constraints simultaneously.

### 🚫 Strict Rules:
- [ ] **DO NOT use the word "hackathon" anywhere in the article** (per competition guidelines).
- [ ] Focus purely on the technical architecture, problem statement, and how Hindsight memory solves it.
- [ ] Include real TypeScript code snippets showing `@vectorize-io/hindsight-client` usage (`retain`, `recall`, `reflect`).
- [ ] Include clear architectural diagrams or UI screenshots of RecallOps in action.

### 📋 Article Outline Template:
1. **Introduction**: The hidden cost of organizational amnesia in software engineering incident response.
2. **The Problem with Stateless AI in DevOps**: Why standard LLM chats fail when debugging production outages.
3. **Introducing RecallOps**: AI incident investigation anchored in persistent memory.
4. **Deep Dive: Hindsight Memory Integration**:
   - Explanation of 4-way parallel recall (semantic, keyword, graph, temporal).
   - Code snippet: Integrating `@vectorize-io/hindsight-client`.
   - The Reflect synthesis pipeline for multi-incident pattern matching.
   - Guardrailed retention: why human confirmation before retention is critical.
5. **Real-World Incident Walkthrough**: Payment API connection pool exhaustion demo.
6. **Conclusion & Future Evolution**: The future of persistent memory in engineering operations.

---

## 🌐 2. Reddit Sharing (Per-Member)

- [ ] Share your published article link on relevant subreddits (e.g., `r/devops`, `r/programming`, `r/node`, or `r/sre`).
- [ ] Frame the post as a technical discussion: *"How we built a persistent memory engine for incident investigation using vector and graph memory"*.

---

## 💼 3. LinkedIn Post & Comment (Per-Member)

### Post Requirements:
- [ ] Under **800 characters** in length.
- [ ] Briefly explain the project value proposition: *"Every incident makes the next response smarter"*.
- [ ] Include the GitHub repository link.
- [ ] Include **3 to 5 relevant hashtags** (e.g., `#AI #DevOps #SoftwareEngineering #PersistentMemory #TypeScript`).

### Sample LinkedIn Post Draft:
```text
When production incidents strike at 3 AM, engineering teams shouldn't have to re-solve problems that were already fixed months ago.

We built RecallOps — an incident investigation assistant with persistent memory powered by Hindsight Cloud and Groq. 

Instead of treating every outage like day one, RecallOps recalls verified historical resolutions, compares telemetry patterns, and retains confirmed lessons into long-term memory.

Check out the open-source repo: https://github.com/your-org/RecallOps

#AI #DevOps #SoftwareEngineering #PersistentMemory #TypeScript
```

### Required First Comment:
- [ ] Immediately comment on your LinkedIn post linking the official Hindsight repository:  
  `Built using Hindsight persistent memory: https://github.com/vectorize-io/hindsight`

---

## 🎥 4. YouTube Video Demo (Team-Level)

- [ ] Duration: **Between 2 and 5 minutes** (strictly within limits).
- [ ] Visibility: Set to **Public** on YouTube.
- [ ] Follow the script in `docs/HACKATHON_DEMO_SCRIPT.md`:
  - 0:00–0:40: Problem statement & stateless AI limitations.
  - 0:40–1:20: Cold-start investigation demonstration.
  - 1:20–2:15: Hindsight 4-way parallel memory recall and Groq reasoning.
  - 2:15–3:00: Human-in-the-loop verified resolution and retention.
  - 3:00–3:30: Hindsight Memory Explorer & wrap-up.
- [ ] Clear audio and minimum 1080p resolution.

---

## 📦 5. Final Portal Submission Form (Team-Level)

Before hitting submit, verify all links are public:
- [ ] **GitHub Repository URL**: Public repository containing frontend, backend, docs, and `.env.example`.
- [ ] **Public Video URL**: 2–5 min YouTube video.
- [ ] **Live Demo URL** (or local run instructions).
- [ ] **Member Article Links**: URL for each team member's published article.
- [ ] **Member LinkedIn Links**: URL for each team member's LinkedIn post.
- [ ] Confirm no secrets or API keys are committed to Git.

