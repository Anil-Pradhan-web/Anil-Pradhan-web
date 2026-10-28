# Phase 1 — Design Lock

**Direction:** *Engineer's Dossier* — editorial, technical, one accent.
**Artifacts:** `design/mockups/index.html` (open in a browser) · `design/tokens.css` · `assets/src/profile.json` → `assets/src/build-banner.mjs`

> You approved the recommended direction ("ok"), so this is built on it. The cyberpunk terminal is gone; if you want the neon back, the banner generator takes about 20 minutes to re-skin — the section architecture below stays either way.

---

## 1. Why this direction

| Rejected | Reason |
|---|---|
| Terminal / cyberpunk hero | Decorative, dated, unreadable at phone width, and repeats information already in the text |
| RPG skill-tree poster | A 920×730 image is a poster, not a document — no scanning, no search, no mobile |
| Badge wall (24 shields) | Visual noise; badges compete with the two things that actually matter (name, proof) |
| Animated typing + snake + view counter | Three external dependencies for zero information |

**Chosen:** the page should read like a spec sheet written by the engineer who built the systems. Strong type, thin rules, generous space, one accent used only as an index mark, gold reserved for the Dell result.

Three rules that govern every later decision:

1. **Text is the interface.** Anything a recruiter must read stays real text.
2. **One accent, two themes, zero broken boxes.** No asset ships in only one theme.
3. **Every claim has a link.** If it can't be clicked, it doesn't go on the page.

---

## 2. Design tokens

### Colour

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#0B0F14` | `#FFFFFF` | Canvas |
| `surface` | `#111823` | `#FFFFFF` | Cards |
| `surface-2` | `#16202B` | `#F3F6F8` | Tags, nested blocks |
| `border` | `rgba(255,255,255,.10)` | `rgba(14,20,26,.14)` | 1px hairlines |
| `border-strong` | `rgba(255,255,255,.20)` | `rgba(14,20,26,.30)` | Chips, controls |
| `text` | `#F0F4F8` | `#0E141A` | Headings, figures |
| `text-dim` | `#9AA7B4` | `#4B5764` | Body copy |
| `muted` | `#6B7785` | `#6B7683` | Meta, captions |
| `accent` | `#3DDC97` | `#0E7C5A` | Links, eyebrow, active node, status dot |
| `gold` | `#E3B341` | `#8A6200` | **Awards only** |

Contrast: `text-dim` on `bg` is 7.4:1 (dark) / 7.9:1 (light); `muted` on `bg` is 4.6:1 / 4.9:1. All body copy clears 4.5:1.

### Type

| Step | Size | Use |
|---|---|---|
| `--step-5` | 46px | Not used in banner; reserved for README section numerals if needed |
| banner name | 76px / 700 / -2.2 tracking | The single loudest element on the profile |
| `--step-3` | 26px | Proof-bar numbers |
| `--step-2` | 20px | Card titles, section H2 |
| `--step-1` | 16px | Body |
| `--step-0` | 14px | Secondary body |
| `--step--1` | 12px | Chips |
| mono labels | 9–13px, 0.16–0.34em tracking, uppercase | Eyebrows, meta, diagram labels |

Sans: `Inter → Segoe UI Variable → Segoe UI → system-ui`. Mono: `Cascadia Mono → SF Mono → JetBrains Mono → Menlo → Consolas`.

**Display type is not converted to paths.** Embedding an OFL font in the repo costs ~350 KB and a build dependency, and a GitHub README looks more native when the type matches the host OS. Instead, every text container (chips, pills) is sized with a deliberately *over-estimated* advance width, so no font substitution can overflow a border. Label positions use `text-anchor` (start/middle/end), so width variation cannot shift the layout.

### Space, radius, weight

- 4pt scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`
- Radius: `10px` cards, `6px` tags, `999px` chips
- Borders: always `1px`; never 2px except the accent rule under the name
- Shadow: one soft ambient shadow, dark theme only
- Badges (when unavoidable): `flat-square`, max 3 per card, max 8 on the page

---

## 3. Banner anatomy

Canvas `1280 × 320`. All values in banner coordinates.

```
┌ 20 ──────────────────────────────────────────────────────────────── 1260 ┐
│  ⌐ corner bracket (accent, 55% opacity, 26px arm)                    ¬  │
│   56                                                         1224      │
│   BACKEND & AI SYSTEMS ENGINEER                                  PROFILE / 2026
│   ─────────────────────────── hairline y=76 ──────────────────────────  │
│                                                                          │
│   ANIL PRADHAN                    ┌ system topology / 04 nodes          │
│   (76px, y=150)                   │  ●───●───◉───●                       │
│   ▬ accent rule 68px, y=170       │ INGEST PLAN ACT EVAL                 │
│   Deterministic multi-agent …     └ dashed eval loop back to PLAN        │
│   (20px, y=200)                          x 764 → 1222, axis y=152       │
│                                                                          │
│   ◈ DELL TOP 6 / 8,000   ○ CGPA 8.93 / 10       (chips y=221, h=34)     │
│                                                                          │
│   ─────────────────────────── hairline y=278 ──────────────────────────  │
│   ● OPEN TO 2027 SDE / AI-INFRA ROLES        BHUBANESWAR, IN · IST 05:30 │
└ 20 ──────────────────────────────────────────────────────────────── 1260 ┘
```

**Rules**

- Nothing below 18px may carry meaning that isn't repeated elsewhere. The diagram labels (9.5px) are decorative.
- Only the name, role line, two chips, and status survive phone scaling. That is deliberate: the README text below carries the detail.
- 56px inset = safe zone. GitHub renders at ~1012px; at that width every element still sits inside the frame.
- One accent rule, one accent node, one accent status dot, accent brackets. Nothing else is green.

**Mobile asset — `760 × 360`**

Same frame, restacked: eyebrow → name (66px) → role on two lines (24px) → one award chip (32px) → hairline → status + location. The diagram collapses to a four-dot chain in the header's empty right side.

Served via:

```html
<picture>
  <source media="(max-width: 600px) and (prefers-color-scheme: dark)"  srcset="./assets/hero-mobile-dark.svg">
  <source media="(max-width: 600px) and (prefers-color-scheme: light)" srcset="./assets/hero-mobile-light.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-light.svg">
  <img src="./assets/hero-dark.svg" width="100%" alt="…">
</picture>
```

Dark is the fallback because the profile's default rendering (and the author's own view) is dark; a light-theme viewer gets `hero-light.svg` explicitly.

> Verified against GitHub's markdown renderer (`POST /markdown`): `<picture>`, all three `<source media>` tags, and `<img width="100%">` survive sanitisation intact, and GitHub wraps the result in its own `<themed-picture>` element — which is what re-evaluates the sources when the viewer switches theme. **Known caveat:** `prefers-color-scheme` follows the OS; a viewer who manually picks the opposite GitHub theme may get the other variant. The failure mode is a dark banner card on a light page, which still reads correctly.

---

## 4. Section system

Each section is separated by a hairline rule, not `<hr>` + emoji. Section header = mono numeral + title, right-aligned meta.

| # | Section | Component | Density |
|---|---|---|---|
| 1 | Banner | `<picture>` | image |
| 2 | Status strip | mono row: dot · availability · location/TZ · résumé · email | 1 line |
| 3 | Proof bar | single-row table, 4 columns: big numeral + caption | 4 items |
| 4 | Selected work | stacked `h3` entries: title-link, 2-line problem, 2 bullets, Repo · Live | 3 entries |
| 5 | More work | one paragraph: project · link · project · link | 1 line |
| 6 | Stack | 3 labelled lines, mono headers, comma lists | 3 × ~5 items |
| 7 | Achievements | 4 dated rows | 4 rows |
| 8 | Writing | 4 rows: title-link + one-line summary | 4 rows |
| 9 | Credentials | 5 selected + `<details>` | collapsed |
| 10 | Footer | link row + signature + view counter | 2 lines |

Mobile: entries are already stacked, the proof bar keeps its single row (verified at 390 px — no horizontal overflow), the stack stays three labelled lines. No horizontal scrolling anywhere.

**Why not a 2×2 card grid?** Layout tables look right on desktop but GitHub's `.markdown-body table { display:block; width:max-content }` plus its 13px cell padding squeezes a two-column card table to ~175px per column on a phone, and zebra striping paints the cells. Stacked entries are theme- and width-proof. The proof bar survives as a table because one row has no striping and its numerals stay legible.

---

## 5. Motion policy

Two SMIL loops, both under 3s, both irrelevant to comprehension:

- status dot opacity `1 → 0.3 → 1` every 2.8s
- ACT node ring `r 13 → 21` with fading stroke every 3.6s; dashed loop travels leftward

No entrance animations (they finish before the image is scrolled into view anyway), no typing effects, no frame animation. Strip the two `<animate>` elements and the banners are fully static.

---

## 6. Budgets

| Budget | Limit | Current |
|---|---|---|
| Banner weight | ≤ 12 KB per theme | 8.9 KB |
| Total committed images | ≤ 400 KB | 163 KB (banners + social card) |
| External image hosts | 1 max | 1 (`komarev.com`, view counter) |
| Badge count | ≤ 8 | 1 |
| Fonts loaded | 0 | 0 |
| Tokens per theme | 1 file | `tokens.css` + generator constants |

---

## 7. Files delivered

```
assets/src/profile.json          single source of truth (name, role, chips, metrics, diagram)
assets/src/build-banner.mjs      generator: 1 data file → 4 banners + 1 social card
assets/hero-dark.svg             1280×320
assets/hero-light.svg            1280×320
assets/hero-mobile-dark.svg      760×360
assets/hero-mobile-light.svg     760×360
assets/og-image.svg / .png       1280×640 social preview
design/tokens.css                palette, type scale, spacing, primitives
design/mockups/index.html        approval harness: theme + width toggles, spec, wireframe, sign-off
docs/phase-0-content-map.md      content inventory + decisions
docs/phase-1-design-lock.md      this document
docs/qa-report.md                link, renderer, responsive and payload evidence
package.json                     `npm run build` → the generator, zero dependencies
.gitignore                       keeps node_modules and QA scratch output out of git
.github/workflows/assets.yml     CI: regenerate on push, fail if assets/ drifts
```

Regenerate with `npm run build` (or `node assets/src/build-banner.mjs`). Never edit the SVGs by hand. The PNG is a one-time raster of `og-image.svg` (headless Chrome, 1280×640) — regenerate only if the card copy changes.

**Delivery status:**

| Item | State |
|---|---|
| Banner generation | ✅ single source, 4 variants, ASCII-only output |
| Social preview card | ✅ `og-image.png` rendered; **upload is UI-only** (Settings → Social preview) |
| Text-to-path display type | ❌ rejected — see §2 (cost > benefit) |
| README wiring | ✅ `<picture>` with 3 sources, verified against GitHub's renderer |
| Retired assets | ✅ snake + workflow, 3 DSA cards, skill tree, timeline, 1.7 MB GIF deleted |
| Payload | 1770 KB → 163 KB |
| Drift protection | ✅ `assets.yml` regenerates and diffs `assets/` on every push that touches the generator |
| Repo metadata | ✅ description, topics and homepages set via `gh api`; pin order + social preview remain manual |

---

## 8. Sign-off checklist

- [x] Direction: editorial dossier (not cyberpunk) — 2026-10-29
- [x] Banner copy: name / role / two chips
- [x] Diagram: abstract pipeline, no readable dependency
- [x] Motion: two sub-3s pulses, comprehension-neutral
- [x] Mobile: separate asset via `<picture>`
- [x] Green light for phase 2 (paths + OG image + `assets/` build)

**Previously blocking questions (resolved 2026-10-29):** VisionForge canonical repo + contribution · TaskPilot role · Dell proof · view counter · snake — see `phase-0-content-map.md` §7.

