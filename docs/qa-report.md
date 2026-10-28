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
| Asset folder | 1770 KB | **163 KB** |
| Files in `assets/` | 12 | 6 |
| Images in README | 39 | **2** |
| README length | 238 lines | 117 lines |

Breakdown: `hero-dark.svg` 8.9 KB, `hero-light.svg` 8.9 KB, `hero-mobile-dark.svg` 5.0 KB, `hero-mobile-light.svg` 4.9 KB, `og-image.svg` 6.1 KB, `og-image.png` 128.7 KB.

Retired: snake animation (2 SVGs + workflow), 3 DSA stat cards, skill tree, hackathon timeline, 1.7 MB cyberpunk GIF.

## 5. Accessibility

- Banner `alt` reads as a sentence: "Anil Pradhan — Backend & AI Systems Engineer. Dell FutureMinds national finalist, top 6 of 8,000+."
- View counter has `alt="Profile views"` and is not the only content in the footer.
- Links are descriptive (`Repo ↗`, `Live demo ↗`, article titles) — no bare "click here".
- `↗` markers and bold/italic carry no unique meaning; structure is plain headings, lists, and one table.
- Contrast: text on the banner is `#E8EDF2` on `#0B0F14` (dark) and `#111A1C` on `#F7F9F8` (light); accent `#3DDC97` / `#0E7C5A` is only used on 600-weight or larger text.

## 6. Build reproducibility

- Single source: `assets/src/profile.json`; generator: `assets/src/build-banner.mjs`; `npm run build` rewrites all five SVGs deterministically.
- Text stays as live `<text>` (no font path conversion). Pill widths are over-estimated so font substitution cannot overflow a border.
- `.github/workflows/assets.yml` regenerates the assets on CI and fails if the output differs from what is committed. `og-image.png` is a manual raster of `og-image.svg`, so it is intentionally outside that check — regenerate it only when the card copy changes.

## 7. Live verification (after push)

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

## 8. Known caveats (accepted)

1. **Theme mismatch.** `prefers-color-scheme` follows the operating system, not GitHub's manual theme picker. A viewer running OS-dark who manually selects GitHub light may see the dark banner card on a white page. It still reads correctly. Verified live in both OS schemes (§7); the manual-override case cannot be exercised without a signed-in session.
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

# 2. link check
$md = Get-Content README.md -Raw
[regex]::Matches($md, 'https?://[^\s)"''<>]+') |
  ForEach-Object { $_.Value -replace '[.,;]+$','' } | Sort-Object -Unique |
  ForEach-Object { "{0}`t{1}" -f (curl.exe -s -o NUL -w "%{http_code}" -L --max-time 25 $_), $_ }

# 3. renderer contract
# POST README.md to https://api.github.com/markdown (mode=gfm) and assert
# <picture>, 3 × <source>, and the themed-picture wrapper are present.
```
