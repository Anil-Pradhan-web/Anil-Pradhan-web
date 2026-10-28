# QA report — profile rebuild

Date: 2026-10-29
Scope: `README.md`, everything under `assets/`, and the generated-asset build.
Environment: Windows 11, Node 24, Chrome headless (CDP), GitHub markdown API, `gh` 2.92.0.

This is the evidence behind phase 5 of the redesign. Re-run any section with the commands at the bottom.

---

## 1. Link integrity

Every URL in the README was requested with redirects followed and a 25 s timeout.

| Result | Count | Notes |
|---|---|---|
| `200 OK` | 19 | repos, live demos, portfolio, blog posts, résumé PDF, HackerRank, GfG, view-counter badge |
| `403 Forbidden` | 1 | `leetcode.com/u/Anil_Pradhan/` — LeetCode blocks non-browser clients. URL is valid; it renders for humans. |
| `999` | 1 | `linkedin.com/in/anil-pradhan543/` — LinkedIn's bot wall. Same story. |
| **Total unique** | **21** | |

Local asset references: all three `<source srcset>` paths and the fallback `<img src>` resolve on disk (`assets/hero-mobile-dark.svg`, `hero-mobile-light.svg`, `hero-light.svg`, `hero-dark.svg`).

Profile e-mail is `anilpradhan9644@gmail.com`, matching the address published on the portfolio site.

## 2. Renderer contract (GitHub markdown API)

`POST https://api.github.com/markdown` with `mode=gfm` and `context=Anil-Pradhan-web/Anil-Pradhan-web`, then asserted against the returned HTML:

| Assertion | Result |
|---|---|
| `<picture>` survives sanitisation | ✅ |
| All three `<source media=…>` elements survive | ✅ (3) |
| GitHub wraps it in `<themed-picture>` | ✅ — this is what re-evaluates sources on theme switch |
| `<img width="100%">` fallback survives | ✅ |
| `<details>/<summary>` survives | ✅ (1) |
| Only one table remains (the proof bar) | ✅ (1 `markdown-accessiblity-table` wrapper) |
| `<script>` or `on*=` attributes injected | ❌ none, as expected |
| Images in document | 2 (banner + view counter) |
| Heading structure | 5 × `h2`, 7 × `h3` — no skipped levels |
| Output size | 8.7 KB HTML from 6.3 KB markdown |

## 3. Responsive and theme matrix

Rendered the API output inside a page that reproduces GitHub's `.markdown-body` rules (including its table overflow wrapper), then screenshotted.

| Viewport | Theme | Result |
|---|---|---|
| 1012 px (GitHub's content column) | dark | ✅ two-column-free layout, banner full-bleed, proof bar centred |
| 1012 px | light | ✅ |
| 415 px (mobile content width) | dark | ✅ `document.scrollWidth === 415`, no horizontal overflow |
| 390 px (CDP device emulation) | dark | ✅ no clipping; the earlier clipped capture was a `--window-size` Chrome artifact, confirmed via CDP metrics |

Measured with `document.documentElement.scrollWidth` vs `window.innerWidth` at 415 px: equal — zero horizontal overflow. The QA CSS was patched to add GitHub's `markdown-accessiblity-table { display:block; overflow:auto }` rule before re-measuring.

## 4. Payload

| | Before | After |
|---|---|---|
| Asset folder | 1770 KB | **274 KB** |
| Files in `assets/` | 12 | 10 |
| Images in README | 39 | **3** |
| README length | 238 lines | 128 lines |

Breakdown: `hero-dark.svg` 8.9 KB, `hero-light.svg` 8.9 KB, `hero-mobile-dark.svg` 5.0 KB, `hero-mobile-light.svg` 4.9 KB, `og-image.svg` 6.1 KB, `og-image.png` 128.7 KB, `activity-dark.svg` 28.5 KB, `activity-light.svg` 28.9 KB, `activity-mobile-dark.svg` 26.9 KB, `activity-mobile-light.svg` 27.2 KB. The data snapshot `assets/src/stats.json` adds 28.9 KB of JSON.

Retired: snake animation (2 SVGs + workflow), 3 DSA stat cards, skill tree, hackathon timeline, 1.7 MB cyberpunk GIF.

## 5. Activity card data

The activity section is generated from GitHub itself, not a third-party widget:

| Source | Endpoint | What it gives |
|---|---|---|
| Contribution graph | `https://github.com/users/Anil-Pradhan-web/contributions` | the same HTML fragment the official profile graph renders, one cell per day |
| Languages | `https://api.github.com/repos/Anil-Pradhan-web/{repo}/languages` | per-repo byte counts, summed over owned non-fork repos |

`assets/src/build-stats.mjs --fetch` parses both into `assets/src/stats.json` and renders the four SVGs from that snapshot. A nightly workflow re-runs it and commits only when the output changes.

**Integrity checks in the generator** — it fails instead of publishing a wrong number:

- the calendar must contain at least 300 cells, and every cell must map to a count;
- the sum of the daily counts must equal the page's "N contributions in the last year" figure (currently 1,340);
- language bytes are summed per repo, so shares are byte-weighted the same way GitHub computes a repository's language bar.

**Snapshot at the first CI refresh:** 368 days (2025-10-26 → 2026-10-28), 1,340 contributions, 194 active days, longest streak 20 days (ending 2026-08-24), current streak 3 days, best day 47. Languages: TypeScript 28.7%, Python 23.6%, Jupyter Notebook 19.3%, Java 15.7%, JavaScript 5.9%, other 6.8% — 4.6 MB across 15 repos. These figures move with the account; the card is the source of truth, not this document.

**Rendering notes**

- The heatmap is 53 columns × 7 rows and uses GitHub's own `data-level` (0–4) rather than recomputed thresholds, so the shades match the official graph.
- 368 `<use>` references point at one `<rect>` instead of 368 inline rects — 28 KB per card instead of roughly 48 KB.
- The language bar is a single accent ramp plus a neutral "Other", so the card stays inside the one-accent rule.
- The card is a `<picture>` with mobile/light/dark sources, the same pattern as the banner.

**Limits of this data**

- GitHub's camo image proxy caches by URL, and the URL does not change, so a refreshed card can trail its commit by the cache window. The card always states its own `DATA THROUGH` date.
- The nightly refresh adds one bot commit per day. That is the price of a graph that is actually live.
- Day boundaries are UTC; a late-evening contribution can land on the next day's cell.
- Byte-weighted shares include vendored and generated files, exactly like GitHub's own language bar — it measures repository composition, not hours.

## 6. Accessibility

- Banner `alt` reads as a sentence: "Anil Pradhan — Backend & AI Systems Engineer. Dell FutureMinds national finalist, top 6 of 8,000+."
- The activity image's `alt` says what it is; the SVG itself carries a full `aria-label` with every number, so a screen reader gets the data even though the card is a picture.
- View counter has `alt="Profile views"` and is not the only content in the footer.
- Links are descriptive (`Repo ↗`, `Live demo ↗`, article titles) — no bare "click here".
- `↗` markers and bold/italic carry no unique meaning; structure is plain headings, lists, and one table.
- Contrast: text on the banner is `#E8EDF2` on `#0B0F14` (dark) and `#111A1C` on `#F7F9F8` (light); accent `#3DDC97` / `#0E7C5A` is only used on 600-weight or larger text.

## 7. Build reproducibility

- Sources: `assets/src/profile.json` (copy, chips, metrics) and `assets/src/stats.json` (activity snapshot); generators: `build-banner.mjs` and `build-stats.mjs`; `npm run build` rewrites all nine SVGs deterministically.
- Text stays as live `<text>` (no font path conversion). Pill widths are over-estimated so font substitution cannot overflow a border.
- `.github/workflows/assets.yml` regenerates everything on CI and fails if the output differs from what is committed. `og-image.png` is a manual raster of `og-image.svg`, so it is intentionally outside that check — regenerate it only when the card copy changes.
- `.github/workflows/stats.yml` refreshes `stats.json` from GitHub nightly and commits the result.

## 8. Live verification (after push)

Pushed as `33dc04c` and re-checked the public page rather than trusting the local render.

| Check | Result |
|---|---|
| `GET https://github.com/Anil-Pradhan-web` serves the new README | ✅ "Selected work" present, old "Animated Terminal Hero" gone |
| Rendered banner markup | ✅ `<themed-picture><picture>` with 3 `<source media>` + `width="100%"` fallback, URLs rewritten to `/raw/main/assets/…` |
| Raw assets | ✅ all four SVG variants `200`, `image/svg+xml` (5.1 KB mobile, 9.1 KB desktop) |
| Desktop, OS dark (`prefers-color-scheme: dark`) | ✅ dark banner, dark page |
| Desktop, OS light (`prefers-color-scheme: light`) | ✅ light banner, light page — `<themed-picture>` resolves the sources as intended |
| Mobile 390 px | ✅ mobile banner variant, `scrollWidth === innerWidth === 390`, no overflow |
| `assets` workflow | ✅ run on `33dc04c` completed `success` — assets match `profile.json` |

That lays caveat 1 below to rest for the normal case: the theme switch follows the OS, and when it does, the correct banner loads. Only a deliberate mismatch (OS dark + manually selected GitHub light) can show the other variant.

## 9. Known caveats (accepted)

1. **Theme mismatch.** `prefers-color-scheme` follows the operating system, not GitHub's manual theme picker. A viewer running OS-dark who manually selects GitHub light may see the dark banner card on a white page. It still reads correctly. Verified live in both OS schemes (§8); the manual-override case cannot be exercised without a signed-in session.
2. **`218+` DSA count is hardcoded.** It goes stale. Refresh it when the LeetCode total moves.
3. **Third-party badge.** The view counter is one external request to `komarev.com`. Kept at the user's explicit request.
4. **Dell certificate is physical.** The Top 6 / 8,000+ claim is unlinked by design rather than pointing at a dead URL.
5. **Team attribution.** VisionForge and TaskPilot are labelled `team project` and their roles stated; the collaborator is not named at the user's request.

---

## Re-running the checks

```powershell
# 1. rebuild and diff generated assets
npm run build
git diff --exit-code assets

# 1b. refresh the activity data from GitHub, then rebuild
npm run build:stats

# 2. link check
$md = Get-Content README.md -Raw
[regex]::Matches($md, 'https?://[^\s)"''<>]+') |
  ForEach-Object { $_.Value -replace '[.,;]+$','' } | Sort-Object -Unique |
  ForEach-Object { "{0}`t{1}" -f (curl.exe -s -o NUL -w "%{http_code}" -L --max-time 25 $_), $_ }

# 3. renderer contract
# POST README.md to https://api.github.com/markdown (mode=gfm) and assert
# <picture>, 3 × <source>, and the themed-picture wrapper are present.
```
