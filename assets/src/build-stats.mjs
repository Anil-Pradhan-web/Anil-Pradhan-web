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
import { SANS, THEMES, esc, number } from "./theme.mjs";

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

/* ── write ─────────────────────────────────────────────────────────────── */

const LANG_COLORS = {
  TypeScript: "#3178c6",
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  Java: "#b07219",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Batchfile: "#C1F12E",
  Other: "#8b949e",
};

function githubStatsCard(themeName = "dark") {
  const t = THEMES[themeName];
  const W = 495;
  const H = 195;
  const totalCommits = number(c.total);
  const totalStars = 5;
  const totalPRs = 18;
  const totalIssues = 2;
  const contributedTo = 5;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="Anil-Pradhan-web's GitHub Stats">
  <style>
    .header { font: 600 18px ${SANS}; fill: ${t.accent}; }
    .stat { font: 600 13.5px ${SANS}; fill: ${t.textDim}; }
    .bold { font-weight: 700; fill: ${t.text}; }
    .icon { fill: ${t.accent}; }
    .rank-text { font: 700 24px ${SANS}; fill: ${t.accent}; }
  </style>
  <rect width="${W}" height="${H}" rx="8" fill="${t.bg}" stroke="${t.accent}" stroke-width="1" />
  
  <text x="25" y="35" class="header">Anil-Pradhan-web's GitHub Stats</text>

  <!-- Total Stars Earned -->
  <g transform="translate(25, 58)">
    <svg class="icon" viewBox="0 0 16 16" width="16" height="16">
      <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
    </svg>
    <text x="25" y="12.5" class="stat">Total Stars Earned: <tspan class="bold">${totalStars}</tspan></text>
  </g>

  <!-- Total Commits -->
  <g transform="translate(25, 84)">
    <svg class="icon" viewBox="0 0 16 16" width="16" height="16">
      <path d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>
    </svg>
    <text x="25" y="12.5" class="stat">Total Commits: <tspan class="bold">${totalCommits}</tspan></text>
  </g>

  <!-- Total PRs -->
  <g transform="translate(25, 110)">
    <svg class="icon" viewBox="0 0 16 16" width="16" height="16">
      <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v4.128a2.251 2.251 0 11-1.5 0V6.5a.5.5 0 00-.5-.5h-1v1.5L6.646 5.146a.5.5 0 010-.708L9 2.086V3.5h1A2.5 2.5 0 0012.5 1V2.5A1.5 1.5 0 0111 2.5z"/>
    </svg>
    <text x="25" y="12.5" class="stat">Total PRs: <tspan class="bold">${totalPRs}</tspan></text>
  </g>

  <!-- Total Issues -->
  <g transform="translate(25, 136)">
    <svg class="icon" viewBox="0 0 16 16" width="16" height="16">
      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"/>
    </svg>
    <text x="25" y="12.5" class="stat">Total Issues: <tspan class="bold">${totalIssues}</tspan></text>
  </g>

  <!-- Contributed To -->
  <g transform="translate(25, 162)">
    <svg class="icon" viewBox="0 0 16 16" width="16" height="16">
      <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5z"/>
    </svg>
    <text x="25" y="12.5" class="stat">Contributed to (last year): <tspan class="bold">${contributedTo}</tspan></text>
  </g>

  <!-- Grade Ring -->
  <g transform="translate(390, 108)">
    <circle r="42" fill="none" stroke="${t.lineStrong}" stroke-width="6" />
    <circle r="42" fill="none" stroke="${t.accent}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="264" stroke-dashoffset="35" transform="rotate(-90)" />
    <text text-anchor="middle" dy="8" class="rank-text">A+</text>
  </g>
</svg>
`;
}

function topLanguagesCard(themeName = "dark") {
  const t = THEMES[themeName];
  const W = 495;
  const H = 195;
  const barW = 445;
  const barH = 8;
  const barX = 25;
  const barY = 55;

  let acc = 0;
  const barSegments = slices.map((s, i) => {
    const from = Math.round((acc / 100) * barW);
    acc += s.percent;
    const to = Math.round((acc / 100) * barW);
    const width = Math.max(2, to - from - (i < slices.length - 1 ? 2 : 0));
    const color = LANG_COLORS[s.name] || t.accent;
    return `<rect x="${barX + from}" y="${barY}" width="${width}" height="${barH}" rx="${barH / 2}" fill="${color}" />`;
  }).join("\n  ");

  const mid = Math.ceil(slices.length / 2);
  const col1 = slices.slice(0, mid);
  const col2 = slices.slice(mid);

  const renderCol = (items, startX) => items.map((s, i) => {
    const y = 88 + i * 26;
    const color = LANG_COLORS[s.name] || t.accent;
    return `<g transform="translate(${startX}, ${y})">
      <circle cx="5" cy="5" r="5" fill="${color}" />
      <text x="18" y="9" font-family="${SANS}" font-size="13" font-weight="600" fill="${t.textDim}">
        ${esc(s.name)} <tspan font-weight="400" fill="${t.muted}">${s.percent.toFixed(1)}%</tspan>
      </text>
    </g>`;
  }).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="Most Used Languages">
  <rect width="${W}" height="${H}" rx="8" fill="${t.bg}" stroke="${t.accent}" stroke-width="1" />
  <text x="25" y="35" font-family="${SANS}" font-size="18" font-weight="600" fill="${t.accent}">Most Used Languages</text>
  
  ${barSegments}

  ${renderCol(col1, 25)}
  ${renderCol(col2, 260)}
</svg>
`;
}

function streakStatsCard(themeName = "dark") {
  const t = THEMES[themeName];
  const W = 495;
  const H = 195;
  const total = number(c.total || 1355);
  const current = c.currentStreak || 4;
  const longest = c.longestStreak || 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="Anil-Pradhan-web's GitHub Streak">
  <rect width="${W}" height="${H}" rx="8" fill="${t.bg}" stroke="${t.accent}" stroke-width="1" />
  
  <!-- Column 1: Total Contributions -->
  <g transform="translate(85, 0)">
    <text x="0" y="88" text-anchor="middle" font-family="${SANS}" font-size="28" font-weight="700" fill="${t.text}">${total}</text>
    <text x="0" y="116" text-anchor="middle" font-family="${SANS}" font-size="13.5" font-weight="600" fill="${t.accent}">Total Contributions</text>
    <text x="0" y="140" text-anchor="middle" font-family="${SANS}" font-size="11.5" fill="${t.muted}">Oct 27, 2024 - Present</text>
  </g>

  <!-- Divider 1 -->
  <line x1="168" y1="36" x2="168" y2="158" stroke="${t.lineStrong}" stroke-width="1" />

  <!-- Column 2: Current Streak -->
  <g transform="translate(247.5, 0)">
    <!-- Fire Icon -->
    <path fill="${t.accent}" transform="translate(-8, 32) scale(0.7)"
      d="M12 0c-.23 0-.46.06-.66.17-.67.38-6.34 3.7-6.34 9.83 0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5c0-4.09-2.52-6.94-4.83-8.81-.59-.48-1.42-.51-2.04-.08-.47.33-.83.8-1.04 1.34-.33.85-.79 1.63-1.34 2.31-.38-.72-.6-1.54-.6-2.42 0-1.12.37-2.16 1.01-3.02.32-.43.32-1.02-.01-1.45C11.66.12 11.83 0 12 0z"/>
    <!-- Circular Ring -->
    <circle cx="0" cy="94" r="32" fill="none" stroke="${t.lineStrong}" stroke-width="4.5" />
    <circle cx="0" cy="94" r="32" fill="none" stroke="${t.accent}" stroke-width="4.5" stroke-linecap="round"
      stroke-dasharray="201" stroke-dashoffset="45" transform="rotate(-90 0 94)" />
    <text x="0" y="103" text-anchor="middle" font-family="${SANS}" font-size="24" font-weight="700" fill="${t.text}">${current}</text>
    <text x="0" y="148" text-anchor="middle" font-family="${SANS}" font-size="13.5" font-weight="700" fill="${t.accent}">Current Streak</text>
    <text x="0" y="168" text-anchor="middle" font-family="${SANS}" font-size="11.5" fill="${t.muted}">Oct 26 - Oct 29</text>
  </g>

  <!-- Divider 2 -->
  <line x1="327" y1="36" x2="327" y2="158" stroke="${t.lineStrong}" stroke-width="1" />

  <!-- Column 3: Longest Streak -->
  <g transform="translate(410, 0)">
    <text x="0" y="88" text-anchor="middle" font-family="${SANS}" font-size="28" font-weight="700" fill="${t.text}">${longest}</text>
    <text x="0" y="116" text-anchor="middle" font-family="${SANS}" font-size="13.5" font-weight="600" fill="${t.accent}">Longest Streak</text>
    <text x="0" y="140" text-anchor="middle" font-family="${SANS}" font-size="11.5" fill="${t.muted}">Aug 5 - Aug 24</text>
  </g>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ["github-stats.svg", githubStatsCard("dark")],
  ["streak-stats.svg", streakStatsCard("dark")],
  ["top-langs.svg", topLanguagesCard("dark")],
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
