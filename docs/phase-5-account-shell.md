# Account shell — what changed outside the README

Date: 2026-10-29. Applied with `gh api` (authenticated as `Anil-Pradhan-web`, token scopes `gist, read:org, repo, workflow`).

The README is only half of a profile. This is the rest: repository descriptions, topics, homepages, and the two settings GitHub exposes only through the web UI.

---

## 1. Applied via API

Every owned, non-fork repository now has a description and topics. Sixteen were empty before.

| Repo | Description | Topics |
|---|---|---|
| `Anil-Pradhan-web` | Profile README — an editorial engineering dossier with a self-generating SVG banner (one JSON source, CI drift check). Homepage → portfolio | profile-readme, github-profile, svg, design-system, github-actions |
| `MY-PORTFOLIO` | Portfolio and blog: Next.js 16, TypeScript, Tailwind v4. Home of the résumé and writing linked from my GitHub profile. | portfolio, nextjs, typescript, tailwindcss, blog, framer-motion |
| `touch-grass-nature-advisor` | Offline-first trail companion on Gemma 2 (2B): deterministic telemetry, on-device inference, Pydantic-validated output. | gemma, edge-ai, offline-first, pydantic, hacktoberfest, jupyter-notebook |
| `CORE-CS` | Computer-science interview notes — DBMS, operating systems, networks, OOP and system design, organised for placement revision. | computer-science, interview-preparation, dbms, operating-systems, system-design, notes |
| `SupportSense-FineTuning` | Fine-tuning Qwen2.5-7B-Instruct on BANKING77 for banking-support intent classification, using Unsloth with LoRA/QLoRA. | llm-fine-tuning, qwen, lora, qlora, unsloth, intent-classification |
| `SQL-NOTES` | SQL and DBMS notes for placement rounds: joins, CTEs, window functions, indexing and the patterns that actually get asked. | sql, dbms, interview-preparation, window-functions, notes |
| `DSA-java` | Java DSA notes and solutions built topic by topic in Hinglish, for placement revision and interview preparation. | dsa, java, algorithms, data-structures, interview-preparation |
| `JAVASCRIPT-ALL` | Complete JavaScript course notes — fundamentals through to interview-ready, with MERN-oriented examples. | javascript, notes, mern, interview-preparation, learning |
| `Python-all-Notes` | Python notes from first principles to FastAPI and Django backends, with projects along the way. | python, fastapi, django, backend, notes |
| `SIA-Personal-Assistant` | Agentic desktop assistant — LangGraph tool calling, RAG memory over ChromaDB, and voice I/O. | agentic-ai, langgraph, rag, chromadb, voice-assistant, nextjs |
| `VolunteerIQ` | AI-powered humanitarian intelligence for NGOs: volunteer dispatch matching, built for Google Solution Challenge 2026. | google-solution-challenge, ngo, matching-engine, react, typescript, hackathon |
| `city-bus-live` | Real-time city bus tracking, trip planning and distance-based fares — React front end, Django REST back end. | real-time, django-rest-framework, react, maps, transportation |
| `Grocery-app` | FreshCart — full-stack grocery delivery: JWT auth, catalogue, cart, orders and Razorpay checkout. | django-rest-framework, react, razorpay, e-commerce, jwt |
| `iter-soa` | ITER SOA college site rebuilt — React, Vite, TypeScript, shadcn-ui and Tailwind CSS. | react, vite, typescript, tailwindcss, shadcn-ui |
| `E-commerce-website` | Static e-commerce storefront in HTML, CSS and JavaScript. | html, css, javascript, e-commerce |
| `NETFLIX_CLONE` | Netflix landing-page clone in HTML, CSS and JavaScript. | html, css, javascript, netflix-clone |

Left alone on purpose:

- `ai-career-mentor` and `SlotSync` already had accurate descriptions; their existing topics were kept.
- Forks (`OmniRoute`, `multica`, `anything-llm`, `Agentic_ai`, `VisionForge-AI`) keep upstream copy — rewriting a fork's description to look like original work is exactly the credibility risk this rebuild avoids.
- `Disha-1610/VisionForge` and `IdeaForg-e/TaskPilot-AI` are not on this account. They cannot be edited without collaborator access, and the README links to them as `team project`.

## 2. Profile bio — blocked by token scope

`PATCH /user` needs the `user` scope. The current CLI token has `gist, read:org, repo, workflow`, so GitHub answers `404` (its way of saying "not permitted"). Nothing was changed; the live bio is still:

> Software Engineer | Backend & AI Systems | FastAPI · LangGraph · RAG Pipelines · Distributed Systems | CSE @ ITER SOA

To replace it with the version that matches the banner, run these two commands yourself (the first opens a browser once):

```powershell
gh auth refresh -h github.com -s user
gh api -X PATCH user -f bio="Backend & AI systems engineer — FastAPI · LangGraph · RAG · distributed systems. Dell FutureMinds national finalist. CSE '28 @ ITER SOA." -F hireable=true
```

The banner, the README intro and that bio then all say the same thing. `hireable=true` adds GitHub's "Available for hire" marker, which matches the "Open to 2027 SDE / AI-infra roles" line.

## 3. Two steps that have no API

**Pin repositories** — profile → *Customize your pins*. Recommended order, strongest proof first:

1. `ai-career-mentor` — agentic platform, live demo, 16 topics
2. `SlotSync` — Java 23 concurrency engine, the depth signal
3. `VolunteerIQ` — Google Solution Challenge 2026, live demo
4. `SIA-Personal-Assistant` — LangGraph + RAG desktop agent
5. `MY-PORTFOLIO` — the site and blog the README points at
6. `touch-grass-nature-advisor` — on-device Gemma 2, shows range

TaskPilot and VisionForge only appear in pin suggestions if GitHub counts you as a contributor; if they do, they are worth swapping in for #5 and #6 — they are the strongest team-work evidence, and the README already labels them `team project`.

**Social preview** — repo *Settings → Social preview → Upload*, file `assets/og-image.png` (1280×640). This is the card shown when the profile link is shared on X, LinkedIn, Slack or Discord. There is no API for it.

## 4. Where this leaves the account

| Surface | State |
|---|---|
| Profile README | ✅ rebuilt, 2 images, 163 KB assets |
| Repository descriptions | ✅ 18 / 18 owned repos (forks excluded) |
| Repository topics | ✅ every owned repo |
| Homepages | ✅ portfolio repo, profile repo, VolunteerIQ, MY-PORTFOLIO, iter-soa |
| Profile bio | ⚠️ needs one command (scope), see §2 |
| Pinned repos | ⚠️ UI only, see §3 |
| Social preview | ⚠️ UI only, see §3 |
