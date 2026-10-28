# Phase 0 — Content Map & Inventory

**Profile:** github.com/Anil-Pradhan-web · **Audit date:** 2026-10-28
**Scope:** README.md, `assets/`, `.github/workflows/`, live portfolio, GitHub account shell (bio, repos, pinned slots).

---

## 1. Baseline numbers

| Metric | Current | Target |
|---|---|---|
| README length | 238 lines / 14,142 chars | ~120–140 lines / ~7,000 chars |
| Images in README | 39 `<img>` tags | ≤ 10 |
| shields.io badges | 24 (16 `flat-square`, 9 `for-the-badge`) | ≤ 8, one style |
| Local SVG assets | 9 files (1.73 MB total) | 4 files (~120 KB) |
| Third-party dynamic images | 6 (komarev, typing, readme-stats ×2, streak, capsule) | 1 or 0 |
| Tables | 5 | 2 |
| H2 sections | 9 | 8 |
| Badge-driven claim rows | 16 project badges | 6 max |

**Link audit:** 39/39 URLs return HTTP 200 (LeetCode 403 and LinkedIn 999 are bot-blocks, not broken links — verified the profile URLs exist). **So the problem is not dead links — it's density and duplication.** Portfolio, LinkedIn, and LeetCode each appear 3×.

---

## 2. Claim verification

Everything a recruiter reads must survive a "prove it" click.

| Claim in README | Verified? | Evidence found | Action |
|---|---|---|---|
| Dell FutureMinds National Grand Finalist, Top 6 / 8,000+ | ⚠️ Self-reported | No public certificate/link in repo | Keep, but link a certificate or the repo that won; otherwise soften to "National Grand Finalist" |
| VisionForge: YOLO11n + LangGraph + FAISS, <5s | ⚠️ Repo exists elsewhere | `Disha-1610/VisionForge` — 1★, HTML, *no homepage*, no description of your role | **Link it + state team attribution.** A fork with no description is the weakest possible evidence for your strongest achievement |
| TaskPilot AI: Redis/PostgreSQL WAL/WebSockets | ✅ Repo + demo exist | `IdeaForg-e/TaskPilot-AI` — Python, 1★, live at task-pilot-ai-two.vercel.app | **Link not present in README at all.** Add repo + demo. Attribution: org account, not yours |
| AI Career Mentor: RAG + ChromaDB + RBAC | ✅ Strongest asset | Own repo, 2★, 16 topics, live demo | Make this card #1 or #2; it's the only flagship fully under your name |
| VolunteerIQ: Next.js + CI/CD | ✅ | Own repo, 1★, live demo | Demote to a one-line "more work" entry — it's the weakest of the four |
| 218+ LeetCode · 111+ GFG · 4★ HackerRank | ⚠️ Static, will go stale | Profiles live (403 to bots, valid in browser) | Keep, but stamp "as of Oct 2026" or make it auto-refreshed |
| CGPA 8.93 / 10, B.Tech CSE 2024–2028 | ✅ | Consistent with résumé | Keep |
| "Architectural Research & Publications" | ❌ Misnamed | Blog has 4 posts: 1 technical, 3 essays (deep sea, pollution, AI layoffs) | Rename to **Writing**; list real titles |
| 4 blog "topic tiles" | ❌ Not links | Bare `<td>` cells, not clickable | Replace with 3 real article links |
| Résumé | ❌ **Missing entirely** | Exists at `my-portfolio-anil.vercel.app/Anil_Pradhan_resume.pdf` | Add as the **primary CTA** — highest-value missing element |
| 10 certifications | ⚠️ Unlinked individually | One LinkedIn link for all | Keep 5 selected + "view all" |

---

## 3. Content decisions (keep / rewrite / cut)

### 3.1 Sections

| # | Current section | Decision | New shape |
|---|---|---|---|
| 1 | Terminal hero + view counter + typing SVG | **Replace** | 1280×320 banner (dark/light) + one line of real text |
| 2 | 👋 Executive Summary | **Rewrite** | Status strip: role · availability · location/TZ · résumé · email (one line, real text) |
| 3 | 🚀 Featured Flagship Architectures (4 cards) | **Rewrite** | 3 cards, cut VolunteerIQ, add repo+demo links, add your role |
| 4 | 🏆 Hackathon timeline (860×480 SVG) | **Cut asset, keep facts** | 4 dated text rows |
| 5 | ⚡ Skill Matrix (920×730 SVG) | **Cut asset, keep facts** | 3-column text matrix (Languages / Backend & Infra / AI Systems) |
| 6 | 🧠 DSA cards (3 × 250×130 SVG) | **Cut assets, keep facts** | One line: 3 links + numbers |
| 7 | 📊 Stats grid + snake | **Replace** | 1 self-generated summary card (Action) + activity; snake removed |
| 8 | 📜 Verified Credentials (10) | **Compress** | 5 selected + `<details>` for the rest + LinkedIn verify link |
| 9 | ✍️ Research & Publications (fake tiles) | **Rewrite** | 3 real article links with one-line summaries |
| 10 | 🌐 Command Hub (5 `for-the-badge`) | **Merge** into footer | One text row of links |
| 11 | Footer wave (80px) | **Cut** | Thin rule + signature line |

### 3.2 Assets

| File | Size | Verdict | Reason |
|---|---|---|---|
| `hero-dark.svg` / `hero-light.svg` | 5.9 + 5.7 KB | **Replace** | Text unreadable under 1012px render; regenerated from one template |
| `hackathon-timeline.svg` | 6.5 KB | **Retire** | 860×480 poster; info fits in 4 text rows, mobile-readable |
| `skill-tree.svg` | 13.6 KB | **Retire** | 920×730 RPG poster; unscannable, dark-only, not indexable |
| `leetcode-card.svg` / `gfg-card.svg` / `hackerrank-card.svg` | ~2 KB each | **Retire** | Dark-only slab in light mode; duplicates a text line |
| `github-snake.svg` / `github-snake-dark.svg` | 11.3 KB | **Retire** | Decorative; workflow writes to `output` branch, README reads committed files → already frozen |
| `anil_pradhan_cyberpunk_github.gif` | **1.7 MB** | **Delete** | Unreferenced. It alone is 97% of asset weight |
| `.github/workflows/snake.yml` | 855 B | **Delete** | Its output is never read; dead infrastructure |

### 3.3 Duplicated links (collapse to one row each)

| Link | Appears | Keep where |
|---|---|---|
| Portfolio | 3× | Status strip CTA + footer |
| LinkedIn | 3× | Status strip + footer |
| LeetCode | 2× | DSA line only |
| Email | 1× | Status strip + footer |
| Blog | 3× | Writing section only |

---

## 4. Account-shell gaps (outside the README)

These matter as much as the README — they're the first thing visible on the profile.

| Item | State | Action |
|---|---|---|
| Bio | "Software Engineer \| Backend & AI Systems \| FastAPI · LangGraph · RAG Pipelines · Distributed Systems \| CSE @ ITER SOA" | Good. Shorten to fit one line; add "Dell FutureMinds finalist" |
| Profile repo description | **empty** | Set: "Profile & engineering dossier" |
| Pinned repos | unknown — 22 public repos, only ~6 worth pinning | Pin: ai-career-mentor, SlotSync, VolunteerIQ, MY-PORTFOLIO, + canonical VisionForge/TaskPilot (fork/org) |
| Repo descriptions | 14 of 22 are empty | Fill for every pinned repo (min 1 line) |
| Repo topics | 1 of 22 has topics | Add 3–5 topics to each pinned repo |
| Social preview image | likely default | 1280×640 OG image (generated in phase 2) |
| Forks on profile | 4 forks (OmniRoute, multica, anything-llm, Agentic_ai) | Keep off pinned; consider a "forks" note or leave |
| Stale repos | Netflix clone, Grocery app, E-commerce (2025–early 2026) | Archive or leave unpinned; they dilute the "systems engineer" signal |
| Two repo locations for flagships | VisionForge under `Disha-1610`, TaskPilot under `IdeaForg-e` | Decide canonical link; state your role explicitly |

---

## 5. Positioning decisions to lock

1. **Title.** Bio says "Software Engineer"; README says "Architect". Pick **one**: `Backend & AI Systems Engineer` (accurate, defensible, matches bio). "Architect" reads inflated on a 2nd-year profile and invites scrutiny.
2. **Audience.** Recruiters for SDE/AI-infra internships & new-grad 2027, plus hackathon judges. Every section optimizes for: *can I trust this person ships?*
3. **Proof order.** Dell finalist (rarity) → shipped live products with links (credibility) → DSA/CGPA (filter) → writing (depth). Current order buries the live products.
4. **Tone.** Editorial/technical, no cyberpunk. Confidence through specifics and links, not through neon.

---

## 6. Final content map (what phase 3–4 will build)

```
BANNER                name · role · 2 proof chips · status line
STATUS STRIP          open to 2027 SDE/AI-infra · Bhubaneswar IST · résumé ↗ · email
PROOF BAR             4 metrics (Dell Top 6/8,000 · CGPA 8.93 · 218+ DSA · 4★ Java)
SELECTED WORK         3 cards: AI Career Mentor · TaskPilot AI · VisionForge
                      (each: problem line · 3 tags · 1 outcome · Repo · Demo)
MORE WORK             1 line: VolunteerIQ · SlotSync · portfolio source
STACK                 3 columns: Languages / Backend & Infra / AI Systems
ACHIEVEMENTS          4 dated rows (Dell, iQOO/Microsoft/Amazon/Google, Naukri 96.57 %ile)
WRITING               3 real links + 1-line summaries
CREDENTIALS           5 selected + <details> + verify on LinkedIn
FOOTER                links row + signature
```

**Copy rules for phases 3–4:** no sentence longer than two lines; every bullet carries a number, a link, or a named technology; zero emoji in headings; no badge that doesn't link somewhere.

---

## 7. Answers received (2026-10-29)

| Question | Answer | How it's handled |
|---|---|---|
| VisionForge canonical repo | `Disha-1610/VisionForge` | Linked as a **team project**; role stated as "AI/ML and pipeline engineering". Collaborator not named, per your instruction |
| TaskPilot role | Integration lead | Card states "integration lead: bi-directional sync across GitHub, Slack, email, and calendar" |
| Dell proof | Physical certificate, no public URL | Claim kept as "Top 6 of 8,000+ teams", no dead link. **Optional:** scan it to `assets/credentials/` and I'll wire a link |
| View counter | Keep | One `flat-square` badge in the footer, accent-coloured, nothing else |
| Snake animation | Remove | `snake.yml` + both SVGs deleted |

**Attribution note:** VisionForge and TaskPilot live on other accounts. Both are now labelled *team project* rather than presented as solo work — that protects you from a "did you actually build this?" challenge, which is the fastest way to lose a recruiter's trust.
