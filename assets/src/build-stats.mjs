#!/usr/bin/env node
/**
 * Activity generator — contribution graph + language share.
 *
 * Data is GitHub's own:
 *   - contributions: https://github.com/users/<login>/contributions
 *     (the fragment the profile graph is rendered from — same numbers a visitor sees)
 *   - languages:     https://api.github.com/repos/<login>/<repo>/languages
 *     (per-repo byte counts, summed across owned non-fork repos)
 *
 * Usage:
 *   node assets/src/build-stats.mjs            # render from the committed snapshot
 *   node assets/src/build-stats.mjs --fetch    # refresh snapshot, then render
 *
 * Output: assets/activity-{dark,light}.svg, assets/activity-mobile-{dark,light}.svg
 *         and (with --fetch) assets/src/stats.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { SANS, MONO, THEMES, esc, defs, brackets, backdrop, number, alpha } from "./theme.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const OUT_DIR = resolve(repoRoot, "assets");
const STATS_PATH = resolve(__dirname, "stats.json");
const LOGIN = "Anil-Pradhan-web";
const FETCH = process.argv.includes("--fetch");
const UA = "Anil-Pradhan-web-profile-stats (+https://github.com/Anil-Pradhan-web)";

/* ── collect ───────────────────────────────────────────────────────────── */

async function collect() {
  const contribRes = await fetch(`https://github.com/users/${LOGIN}/contributions`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!contribRes.ok) throw new Error(`contributions fetch failed: ${contribRes.status}`);
  const html = await contribRes.text();

  const cells = [...html.matchAll(/<td\b[^>]*ContributionCalendar-day[^>]*>/g)].map((m) => m[0]);
  const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    const n = m[2].match(/(\d+)\s+contribution/);
    counts.set(m[1], n ? Number(n[1]) : 0);
  }

  const days = cells
    .map((c) => ({
      date: attr(c, "data-date"),
      level: Number(attr(c, "data-level")),
      count: counts.get(attr(c, "id")),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (days.length < 300) throw new Error(`unexpected calendar size: ${days.length} cells`);
  if (days.some((d) => typeof d.count !== "number" || Number.isNaN(d.count))) {
    throw new Error("could not map every calendar cell to a contribution count");
  }

  const total = days.reduce((s, d) => s + d.count, 0);
  const pageTotal = Number((html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/)?.[1] || "0").replace(/,/g, ""));
  if (pageTotal && pageTotal !== total) {
    throw new Error(`calendar sum (${total}) disagrees with page total (${pageTotal})`);
  }

  let longest = 0;
  let run = 0;
  let longestEnd = null;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      if (run > longest) {
        longest = run;
        longestEnd = d.date;
      }
    } else run = 0;
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) current += 1;

  const best = days.reduce((a, b) => (b.count > a.count ? b : a));

  return {
    login: LOGIN,
    pulledAt: new Date().toISOString().slice(0, 10),
    source: {
      contributions: `https://github.com/users/${LOGIN}/contributions`,
      languages: `https://api.github.com/repos/${LOGIN}/{repo}/languages`,
    },
    range: { from: days[0].date, to: days.at(-1).date, days: days.length },
    contributions: {
      total,
      activeDays: days.filter((d) => d.count > 0).length,
      bestDay: { date: best.date, count: best.count },
      longestStreak: longest,
      longestStreakEnd: longestEnd,
      currentStreak: current,
    },
    days,
    ...(await collectLanguages()),
  };
}

async function collectLanguages() {
  const headers = { "User-Agent": UA, Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.github.com/users/${LOGIN}/repos?per_page=100&page=${page}&type=owner&sort=pushed`,
      { headers },
    );
    if (!res.ok) throw new Error(`repos fetch failed: ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new Error("repos response was not a list");
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  const owned = repos.filter((r) => !r.fork && !r.archived);
  const totals = new Map();
  let reposWithCode = 0;

  for (const repo of owned) {
    const res = await fetch(`https://api.github.com/repos/${LOGIN}/${repo.name}/languages`, { headers });
    if (!res.ok) throw new Error(`languages fetch failed for ${repo.name}: ${res.status}`);
    const langs = await res.json();
    const bytes = Object.values(langs).reduce((a, b) => a + b, 0);
    if (!bytes) continue;
    reposWithCode += 1;
    for (const [name, n] of Object.entries(langs)) {
      const entry = totals.get(name) || { bytes: 0, repos: 0 };
      entry.bytes += n;
      entry.repos += 1;
      totals.set(name, entry);
    }
  }

  const languages = [...totals.entries()]
    .map(([name, v]) => ({ name, bytes: v.bytes, repos: v.repos }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    languages,
    languageTotalBytes: languages.reduce((s, l) => s + l.bytes, 0),
    languageRepoCount: reposWithCode,
  };
}

/* ── derive ────────────────────────────────────────────────────────────── */

let stats;
if (FETCH || !existsSync(STATS_PATH)) {
  if (!FETCH) throw new Error("assets/src/stats.json is missing — run with --fetch");
  stats = await collect();
  writeFileSync(STATS_PATH, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  console.log(`fetched ${stats.days.length} days, ${stats.languages.length} languages`);
} else {
  stats = JSON.parse(readFileSync(STATS_PATH, "utf8"));
}

const c = stats.contributions;
const totalBytes = stats.languageTotalBytes;

const TOP_N = 5;
const top = stats.languages.slice(0, TOP_N).map((l) => ({
  ...l,
  percent: Math.round((l.bytes / totalBytes) * 1000) / 10,
}));
const restBytes = stats.languages.slice(TOP_N).reduce((s, l) => s + l.bytes, 0);
const restPercent = Math.round((100 - top.reduce((s, l) => s + l.percent, 0)) * 10) / 10;
const slices = restBytes > 0 ? [...top, { name: "Other", bytes: restBytes, repos: 0, percent: restPercent }] : top;

const sliceColor = (t, i, n) => {
  if (i === n - 1 && slices.at(-1).name === "Other") return t.muted;
  const ramp = [1, 0.82, 0.68, 0.55, 0.44];
  return alpha(t.accent, ramp[Math.min(i, ramp.length - 1)]);
};

/* ── calendar blocks ───────────────────────────────────────────────────── */

const dayKey = (d) => d.toISOString().slice(0, 10);
const startMs = Date.parse(`${stats.range.from}T00:00:00Z`);
const endMs = Date.parse(`${stats.range.to}T00:00:00Z`);
const start = new Date(startMs);
const cursor = new Date(startMs);
cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay()); // back to Sunday

const byDate = new Map(stats.days.map((d) => [d.date, d]));
const weeks = [];
while (cursor.getTime() <= endMs) {
  const col = [];
  for (let i = 0; i < 7; i++) {
    col.push(byDate.get(dayKey(cursor)) || null);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  weeks.push(col);
}

const firstSunday = new Date(startMs);
firstSunday.setUTCDate(firstSunday.getUTCDate() - firstSunday.getUTCDay());
const colOf = (iso) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - firstSunday.getTime()) / 86400000 / 7);

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const monthMarks = [];
let lastCol = -99;
for (const d of stats.days) {
  if (Number(d.date.slice(8, 10)) !== 1) continue;
  const col = colOf(d.date);
  if (col - lastCol < 3) continue;
  monthMarks.push({ col, label: MONTHS[Number(d.date.slice(5, 7)) - 1] });
  lastCol = col;
}

function heatmap(t, { x0, y0, cell, gap, labels = true, id }) {
  const pitch = cell + gap;

  // One <rect> symbol + one <use> per day keeps the file ~3x smaller than
  // inlining 368 full rects, and groups the fills by level.
  const cellDef = `<defs><rect id="cell-${id}" width="${cell}" height="${cell}" rx="2" /></defs>`;
  const groups = [0, 1, 2, 3, 4]
    .map((level) => {
      const fill = level === 0 ? t.heatEmpty : t.heatLevels[level - 1];
      const uses = weeks
        .map((col, ci) =>
          col
            .map((d, ri) =>
              d && d.level === level ? `<use href="#cell-${id}" x="${x0 + ci * pitch}" y="${y0 + ri * pitch}"/>` : "",
            )
            .join(""),
        )
        .join("");
      return `<g fill="${fill}">${uses}</g>`;
    })
    .join("\n    ");

  const months = monthMarks
    .map((m) => `<text x="${x0 + m.col * pitch}" y="${y0 - 9}" font-family="${MONO}" font-size="10" letter-spacing="1.2" fill="${t.muted}">${m.label}</text>`)
    .join("\n    ");

  const weekdays = labels
    ? ["MON", "WED", "FRI"]
        .map((name, i) => {
          const row = i * 2 + 1;
          return `<text x="${x0 - 10}" y="${y0 + row * pitch + cell - 1}" text-anchor="end" font-family="${MONO}" font-size="9.5" letter-spacing="1" fill="${t.muted}">${name}</text>`;
        })
        .join("\n    ")
    : "";

  return {
    svg: `${cellDef}\n    ${months}\n    ${weekdays}\n    ${groups}`,
    width: weeks.length * pitch - gap,
    height: 7 * pitch - gap,
  };
}

function legend(t, { x, y, size = 9, pitch = 13 }) {
  const swatches = [t.heatEmpty, ...t.heatLevels]
    .map((fill, i) => `<rect x="${x + 46 + i * pitch}" y="${y - size + 1}" width="${size}" height="${size}" rx="2" fill="${fill}" />`)
    .join("");
  return `
    <text x="${x}" y="${y}" font-family="${MONO}" font-size="10" letter-spacing="1.4" fill="${t.muted}">LESS</text>
    ${swatches}
    <text x="${x + 46 + 5 * pitch + 8}" y="${y}" font-family="${MONO}" font-size="10" letter-spacing="1.4" fill="${t.muted}">MORE</text>`;
}

function languageBar(t, { x, y, w, h, gap = 2 }) {
  let acc = 0;
  return slices
    .map((s, i) => {
      const from = Math.round((acc / 100) * w);
      acc += s.percent;
      const to = Math.round((acc / 100) * w);
      const width = Math.max(2, to - from - (i < slices.length - 1 ? gap : 0));
      return `<rect x="${x + from}" y="${y}" width="${width}" height="${h}" rx="${h / 2}" fill="${sliceColor(t, i, slices.length)}" />`;
    })
    .join("\n    ");
}

/* ── desktop card: 1280x344 ────────────────────────────────────────────── */

function desktop(themeName) {
  const t = THEMES[themeName];
  const id = `act-${themeName}`;
  const W = 1280;
  const H = 344;
  const M = 56;

  const grid = heatmap(t, { x0: 92, y0: 104, cell: 9, gap: 3, id });
  const stats4 = [
    [number(c.total), "CONTRIBUTIONS"],
    [number(c.activeDays), "ACTIVE DAYS"],
    [`${c.longestStreak}`, "LONGEST STREAK"],
    [`${c.currentStreak}`, "CURRENT STREAK"],
  ];

  const statSvg = stats4
    .map(
      ([value, label], i) => `<text x="${M + i * 164}" y="262" font-family="${SANS}" font-size="36" font-weight="700"
        letter-spacing="-0.8" fill="${t.text}">${esc(value)}</text>
  <text x="${M + i * 164}" y="282" font-family="${MONO}" font-size="11" letter-spacing="1.7"
        fill="${t.muted}">${esc(label)}</text>`,
    )
    .join("\n  ");

  const rows = slices
    .map(
      (s, i) => `<circle cx="782" cy="${158 + i * 24 - 4}" r="3.6" fill="${sliceColor(t, i, slices.length)}" />
  <text x="796" y="${158 + i * 24}" font-family="${SANS}" font-size="16.5" fill="${t.textDim}">${esc(s.name)}</text>
  <text x="${W - M}" y="${158 + i * 24}" text-anchor="end" font-family="${MONO}" font-size="13.5"
        fill="${t.muted}">${s.percent.toFixed(1)}%</text>`,
    )
    .join("\n  ");

  const aria = `Anil Pradhan's GitHub activity for the last 12 months: ${number(c.total)} contributions across ${number(
    c.activeDays,
  )} active days, longest streak ${c.longestStreak} days, current streak ${c.currentStreak} days. Languages by byte share: ${slices
    .map((s) => `${s.name} ${s.percent.toFixed(1)} percent`)
    .join(", ")}.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="${esc(aria)}">
  <title>GitHub activity &#8212; last 12 months</title>${defs(t, id)}
  ${backdrop(t, W, H, id)}
  ${brackets(t, W, H)}

  <text x="${M}" y="56" font-family="${MONO}" font-size="13.5" font-weight="600" letter-spacing="4"
        fill="${t.accent}">ACTIVITY</text>
  <text x="${W - M}" y="56" text-anchor="end" font-family="${MONO}" font-size="10.5" letter-spacing="2.4"
        fill="${t.muted}">LAST 12 MONTHS</text>
  <line x1="${M}" y1="76" x2="${W - M}" y2="76" stroke="${t.line}" />

  <g>
    ${grid.svg}
  </g>
  ${legend(t, { x: 92, y: 210 })}

  ${statSvg}

  <line x1="748" y1="100" x2="748" y2="288" stroke="${t.line}" />

  <text x="776" y="110" font-family="${MONO}" font-size="11" font-weight="600" letter-spacing="2.6"
        fill="${t.accent}">LANGUAGES</text>
  <text x="${W - M}" y="110" text-anchor="end" font-family="${MONO}" font-size="10.5" letter-spacing="1.4"
        fill="${t.muted}">BY BYTES &#183; ${stats.languageRepoCount} REPOS</text>

  ${languageBar(t, { x: 776, y: 124, w: W - M - 776, h: 12 })}

  ${rows}

  <line x1="${M}" y1="300" x2="${W - M}" y2="300" stroke="${t.line}" />
  <text x="${M}" y="322" font-family="${MONO}" font-size="10.5" letter-spacing="1.2"
        fill="${t.muted}">SOURCE: GITHUB CONTRIBUTION GRAPH + LANGUAGE BYTES &#183; DATA THROUGH ${esc(stats.range.to)}</text>
  <text x="${W - M}" y="322" text-anchor="end" font-family="${MONO}" font-size="10.5" letter-spacing="1.2"
        fill="${t.textDim}">github.com/Anil-Pradhan-web</text>
</svg>
`;
}

/* ── mobile card: 760x664 ──────────────────────────────────────────────── */

function mobile(themeName) {
  const t = THEMES[themeName];
  const id = `actm-${themeName}`;
  const W = 760;
  const H = 700;
  const M = 40;

  const grid = heatmap(t, { x0: 63, y0: 206, cell: 9, gap: 3, labels: false, id });

  const rows = slices
    .map(
      (s, i) => `<circle cx="45" cy="${470 + i * 34 - 7}" r="5" fill="${sliceColor(t, i, slices.length)}" />
  <text x="62" y="${470 + i * 34}" font-family="${SANS}" font-size="24" fill="${t.textDim}">${esc(s.name)}</text>
  <text x="${W - M}" y="${470 + i * 34}" text-anchor="end" font-family="${MONO}" font-size="17"
        fill="${t.muted}">${s.percent.toFixed(1)}%</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="${esc(
    `Anil Pradhan's GitHub activity: ${number(c.total)} contributions in the last 12 months, ${number(c.activeDays)} active days, longest streak ${c.longestStreak} days, current streak ${c.currentStreak} days. Languages by byte share: ${slices
      .map((s) => `${s.name} ${s.percent.toFixed(1)} percent`)
      .join(", ")}.`,
  )}">
  <title>GitHub activity &#8212; last 12 months</title>${defs(t, id)}
  ${backdrop(t, W, H, id)}
  ${brackets(t, W, H, 18, 22)}

  <text x="${M}" y="54" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="3.2"
        fill="${t.accent}">ACTIVITY</text>
  <text x="${W - M}" y="54" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="1.8"
        fill="${t.muted}">LAST 12 MONTHS</text>
  <line x1="${M}" y1="74" x2="${W - M}" y2="74" stroke="${t.line}" />

  <text x="${M - 2}" y="138" font-family="${SANS}" font-size="56" font-weight="700" letter-spacing="-1.6"
        fill="${t.text}">${esc(number(c.total))}</text>
  <text x="${M}" y="166" font-family="${MONO}" font-size="17" letter-spacing="1.2"
        fill="${t.textDim}">CONTRIBUTIONS &#183; ${number(c.activeDays)} ACTIVE DAYS</text>

  <g>
    ${grid.svg}
  </g>
  ${legend(t, { x: 63, y: 312 })}
  <text x="${W - M}" y="312" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="1.2"
        fill="${t.muted}">THROUGH ${esc(stats.range.to)}</text>

  <line x1="${M}" y1="334" x2="${W - M}" y2="334" stroke="${t.line}" />
  <text x="${M}" y="370" font-family="${MONO}" font-size="17" letter-spacing="1.2"
        fill="${t.textDim}">LONGEST ${c.longestStreak}D &#183; CURRENT ${c.currentStreak}D &#183; BEST DAY ${c.bestDay.count}</text>

  <line x1="${M}" y1="392" x2="${W - M}" y2="392" stroke="${t.line}" />
  <text x="${M}" y="420" font-family="${MONO}" font-size="11" font-weight="600" letter-spacing="2.4"
        fill="${t.accent}">LANGUAGES</text>
  <text x="${W - M}" y="420" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="1.2"
        fill="${t.muted}">BY BYTES &#183; ${stats.languageRepoCount} REPOS</text>

  ${languageBar(t, { x: M, y: 432, w: W - M * 2, h: 14 })}

  ${rows}
</svg>
`;
}

/* ── write ─────────────────────────────────────────────────────────────── */

mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ["activity-dark.svg", desktop("dark")],
  ["activity-light.svg", desktop("light")],
  ["activity-mobile-dark.svg", mobile("dark")],
  ["activity-mobile-light.svg", mobile("light")],
];

for (const [name, svg] of files) {
  const header = "<!-- generated: assets/src/build-stats.mjs - do not edit by hand -->\n";
  writeFileSync(resolve(OUT_DIR, name), header + svg, "utf8");
  console.log(`wrote ${name}  (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
}
console.log(
  `  ${number(c.total)} contributions, ${c.activeDays} active days, streak ${c.currentStreak}d / ${c.longestStreak}d · top: ${top
    .map((l) => `${l.name} ${l.percent.toFixed(1)}%`)
    .join(", ")}`,
);
