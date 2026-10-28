#!/usr/bin/env node
/**
 * Banner generator — Phase 1 mockups.
 *
 * One data source (profile.json) -> dark + light variants, desktop + mobile.
 * Nothing is hand-tuned per theme, so the two themes cannot drift.
 *
 * Usage: node assets/src/build-banner.mjs
 * Output: design/mockups/hero-{dark,light}.svg, hero-mobile-{dark,light}.svg
 *
 * Phase 2 additions: text-to-path for display type, OG image (1280x640),
 * and writing straight into assets/ for the README.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { SANS, MONO, THEMES, esc, approxWidth, defs, brackets, backdrop } from "./theme.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const OUT_DIR = resolve(repoRoot, "assets");
const data = JSON.parse(readFileSync(resolve(__dirname, "profile.json"), "utf8"));

function chip(t, { x, y, h = 34, label, tone = "neutral", fs = 12.5, mono = true }) {
  const ls = 1.1;
  const padX = 16;
  const iconW = tone === "award" ? 22 : 0;
  const textW = approxWidth(label, fs, ls, 0.62);
  const w = Math.round(padX * 2 + iconW + textW);
  const color = tone === "award" ? t.gold : t.textDim;
  const border = tone === "award" ? `${t.gold}` : t.chipBorder;
  const borderOpacity = tone === "award" ? "0.38" : "1";
  const cx = x + padX + 5;
  const cy = y + h / 2;
  const diamond =
    tone === "award"
      ? `<path d="M${cx} ${cy - 5.5} L${cx + 5.5} ${cy} L${cx} ${cy + 5.5} L${cx - 5.5} ${cy} Z" fill="${t.gold}" />`
      : "";
  return {
    width: w,
    svg: `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.chipBg}" stroke="${border}" stroke-opacity="${borderOpacity}" />
      ${diamond}
      <text x="${x + padX + iconW}" y="${cy + 4.4}" font-family="${mono ? MONO : SANS}" font-size="${fs}" font-weight="600"
            letter-spacing="${ls}" fill="${color}">${esc(label)}</text>
    </g>`,
  };
}

/* ── desktop banner ────────────────────────────────────────────────────── */

function desktop(themeName) {
  const t = THEMES[themeName];
  const id = `d-${themeName}`;
  const W = 1280;
  const H = 320;
  const M = 56;
  const { identity: pid, proof, diagram } = data;

  const [chipA, chipB] = proof.chips;
  const c1 = chip(t, { x: M, y: 221, ...chipA });
  const c2 = chip(t, { x: M + c1.width + 12, y: 221, ...chipB });

  // diagram geometry
  const ax0 = 764;
  const ax1 = 1222;
  const ay = 152;
  const nx = [806, 933, 1059, 1186];
  const ticks = [];
  for (let x = ax0; x <= ax1; x += 24) ticks.push(x);

  const links = nx
    .slice(0, -1)
    .map((x, i) => `<line x1="${x + 9}" y1="${ay}" x2="${nx[i + 1] - 10}" y2="${ay}"
      stroke="${t.lineStrong}" stroke-width="1" marker-end="url(#arrow-${id})" />`)
    .join("\n      ");

  const nodes = nx
    .map((x, i) => {
      const on = i === diagram.activeIndex;
      if (!on) {
        return `<circle cx="${x}" cy="${ay}" r="5.5" fill="${t.bg}" stroke="${t.lineStrong}" stroke-width="1.2" />`;
      }
      return `<g>
        <circle cx="${x}" cy="${ay}" r="14" fill="none" stroke="${t.accent}" stroke-opacity="0.45">
          <animate attributeName="r" values="13;21;13" dur="3.6s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.45;0;0.45" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="${x}" cy="${ay}" r="8" fill="${t.accent}" />
        <circle cx="${x}" cy="${ay}" r="8" fill="${t.accent}" filter="url(#soft-${id})" opacity="0.5" />
      </g>`;
    })
    .join("\n      ");

  const labels = nx
    .map(
      (x, i) =>
        `<text x="${x}" y="186" text-anchor="middle" font-family="${MONO}" font-size="9.5" letter-spacing="2.2"
          fill="${i === diagram.activeIndex ? t.textDim : t.muted}" ${i === diagram.activeIndex ? 'font-weight="700"' : ""}>${esc(diagram.nodes[i])}</text>`,
    )
    .join("\n      ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="Anil Pradhan &#8212; Backend and AI systems engineer. Dell FutureMinds national finalist, top 6 of 8,000. CGPA 8.93.">
  <title>Anil Pradhan &#8212; Backend &amp; AI Systems Engineer</title>${defs(t, id)}
  ${backdrop(t, W, H, id)}
  ${brackets(t, W, H)}

  <!-- header -->
  <text x="${M}" y="56" font-family="${MONO}" font-size="13.5" font-weight="600" letter-spacing="4"
        fill="${t.accent}">${esc(pid.eyebrow)}</text>
  <text x="${W - M}" y="56" text-anchor="end" font-family="${MONO}" font-size="10.5" letter-spacing="2.4"
        fill="${t.muted}">PROFILE / ${esc(pid.year)}</text>
  <line x1="${M}" y1="76" x2="${W - M}" y2="76" stroke="${t.line}" />

  <!-- identity -->
  <text x="${M - 3}" y="150" font-family="${SANS}" font-size="76" font-weight="700" letter-spacing="-2.2"
        fill="${t.text}">${esc(pid.name)}</text>
  <line x1="${M}" y1="170" x2="${M + 68}" y2="170" stroke="${t.accent}" stroke-width="3" stroke-linecap="round" />
  <text x="${M}" y="200" font-family="${SANS}" font-size="20" font-weight="400" letter-spacing="0.1"
        fill="${t.textDim}">${esc(pid.role)}</text>

  <!-- proof chips -->
  ${c1.svg}
  ${c2.svg}

  <!-- footer -->
  <line x1="${M}" y1="278" x2="${W - M}" y2="278" stroke="${t.line}" />
  <circle cx="${M + 3}" cy="295.5" r="3.2" fill="${t.accent}">
    <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" />
  </circle>
  <text x="${M + 16}" y="299.5" font-family="${MONO}" font-size="11" font-weight="600" letter-spacing="1.7"
        fill="${t.textDim}">${esc(proof.status)}</text>
  <text x="${W - M}" y="299.5" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="1.7"
        fill="${t.muted}">${esc(pid.location.toUpperCase())} &#183; ${esc(pid.timezone)}</text>

  <!-- system diagram -->
  <rect x="${ax0}" y="94" width="5" height="5" fill="${t.accent}" opacity="0.75" />
  <text x="${ax0 + 13}" y="100" font-family="${MONO}" font-size="9" letter-spacing="2.6"
        fill="${t.muted}">${esc(diagram.label)}</text>

  <g stroke="${t.line}" stroke-width="1">
    ${ticks.map((x) => `<line x1="${x}" y1="${ay + 5}" x2="${x}" y2="${ay + 9}" />`).join("\n    ")}
  </g>
  <line x1="${ax0}" y1="${ay}" x2="${ax1}" y2="${ay}" stroke="${t.line}" />

  <path d="M1186 ${ay - 8} C 1186 116, 933 116, 933 ${ay - 10}" fill="none" stroke="${t.accent}"
        stroke-opacity="0.32" stroke-width="1.1" stroke-dasharray="3 5" marker-end="url(#arrow-accent-${id})">
    <animate attributeName="stroke-dashoffset" values="0;-32" dur="2.6s" repeatCount="indefinite" />
  </path>

  <g>
    ${links}
  </g>
  <g>
    ${nodes}
  </g>
  <g>
    ${labels}
  </g>
</svg>
`;
}

/* ── mobile banner (600px-and-below replacement) ───────────────────────── */

function mobile(themeName) {
  const t = THEMES[themeName];
  const id = `m-${themeName}`;
  const W = 760;
  const H = 360;
  const M = 40;
  const { identity: pid, proof, diagram } = data;

  const [line1, line2] = pid.role.split(" & ");
  const award = chip(t, { x: M, y: 236, h: 32, fs: 14, ...proof.chips[0] });

  const chain = [500, 566, 632, 698];
  const chainSvg = chain
    .map((x, i) =>
      i === 0
        ? ""
        : `<line x1="${chain[i - 1] + 5}" y1="54" x2="${x - 6}" y2="54" stroke="${t.lineStrong}" stroke-width="1" />`,
    )
    .join("");
  const dotSvg = chain
    .map((x, i) =>
      i === diagram.activeIndex
        ? `<circle cx="${x}" cy="54" r="5" fill="${t.accent}" />`
        : `<circle cx="${x}" cy="54" r="3.4" fill="${t.bg}" stroke="${t.lineStrong}" stroke-width="1.1" />`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="Anil Pradhan &#8212; Backend and AI systems engineer. Dell FutureMinds national finalist, top 6 of 8,000.">
  <title>Anil Pradhan &#8212; Backend &amp; AI Systems Engineer</title>${defs(t, id)}
  ${backdrop(t, W, H, id)}
  ${brackets(t, W, H, 18, 22)}

  <text x="${M}" y="58" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="3.4"
        fill="${t.accent}">${esc(pid.eyebrow)}</text>
  <g>${chainSvg}${dotSvg}</g>

  <text x="${M - 2}" y="136" font-family="${SANS}" font-size="66" font-weight="700" letter-spacing="-1.9"
        fill="${t.text}">${esc(pid.name)}</text>
  <line x1="${M}" y1="154" x2="${M + 56}" y2="154" stroke="${t.accent}" stroke-width="3" stroke-linecap="round" />
  <text x="${M}" y="188" font-family="${SANS}" font-size="24" fill="${t.textDim}">${esc(line1)}</text>
  <text x="${M}" y="216" font-family="${SANS}" font-size="24" fill="${t.textDim}">&amp; ${esc(line2)}</text>

  ${award.svg}

  <line x1="${M}" y1="300" x2="${W - M}" y2="300" stroke="${t.line}" />
  <circle cx="${M + 3}" cy="320" r="3" fill="${t.accent}">
    <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" />
  </circle>
  <text x="${M + 15}" y="324" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="1.4"
        fill="${t.textDim}">${esc(proof.status)}</text>
  <text x="${W - M}" y="324" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="1.4"
        fill="${t.muted}">${esc(pid.location.toUpperCase())} &#183; ${esc(pid.timezone)}</text>
</svg>
`;
}

/* ── social preview card (1280x640) ────────────────────────────────────── */

function social(themeName = "dark") {
  const t = THEMES[themeName];
  const id = `og-${themeName}`;
  const W = 1280;
  const H = 640;
  const M = 64;
  const { identity: pid, proof } = data;

  const metrics = proof.metrics
    .map(
      (m, i) => `<text x="${M + i * 288}" y="444" font-family="${SANS}" font-size="44" font-weight="700"
        letter-spacing="-1.2" fill="${t.text}">${esc(m.value)}</text>
  <text x="${M + i * 288}" y="474" font-family="${MONO}" font-size="12.5" letter-spacing="0.6"
        fill="${t.muted}">${esc(m.caption)}</text>`,
    )
    .join("\n  ");

  const chain = [960, 1045, 1130, 1215];
  const chainSvg = chain
    .map((x, i) =>
      i === 0
        ? ""
        : `<line x1="${chain[i - 1] + 6}" y1="176" x2="${x - 7}" y2="176" stroke="${t.lineStrong}" stroke-width="1" />`,
    )
    .join("");
  const chainDots = chain
    .map((x, i) =>
      i === 2
        ? `<circle cx="${x}" cy="176" r="6" fill="${t.accent}" />`
        : `<circle cx="${x}" cy="176" r="4" fill="${t.bg}" stroke="${t.lineStrong}" stroke-width="1.1" />`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="Anil Pradhan &#8212; Backend and AI systems engineer. Dell FutureMinds national finalist, top 6 of 8,000.">
  <title>Anil Pradhan &#8212; Backend &amp; AI Systems Engineer</title>${defs(t, id)}
  ${backdrop(t, W, H, id)}
  ${brackets(t, W, H, 28, 34)}

  <text x="${M}" y="96" font-family="${MONO}" font-size="15" font-weight="600" letter-spacing="4.5"
        fill="${t.accent}">${esc(pid.eyebrow)}</text>
  <g>${chainSvg}${chainDots}</g>
  <line x1="${M}" y1="124" x2="${W - M}" y2="124" stroke="${t.line}" />

  <text x="${M - 4}" y="244" font-family="${SANS}" font-size="104" font-weight="700" letter-spacing="-3"
        fill="${t.text}">${esc(pid.name)}</text>
  <line x1="${M}" y1="280" x2="${M + 84}" y2="280" stroke="${t.accent}" stroke-width="4" stroke-linecap="round" />
  <text x="${M}" y="322" font-family="${SANS}" font-size="26" fill="${t.textDim}">${esc(pid.role)}</text>

  <line x1="${M}" y1="372" x2="${W - M}" y2="372" stroke="${t.line}" />
  ${metrics}

  <line x1="${M}" y1="536" x2="${W - M}" y2="536" stroke="${t.line}" />
  <text x="${M}" y="582" font-family="${MONO}" font-size="13.5" font-weight="600" letter-spacing="1.6"
        fill="${t.accent}">github.com/Anil-Pradhan-web</text>
  <text x="${W - M}" y="582" text-anchor="end" font-family="${MONO}" font-size="13.5" letter-spacing="1.6"
        fill="${t.muted}">${esc(pid.site)}</text>
</svg>
`;
}

/* ── write ─────────────────────────────────────────────────────────────── */

mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ["hero-dark.svg", desktop("dark")],
  ["hero-light.svg", desktop("light")],
  ["hero-mobile-dark.svg", mobile("dark")],
  ["hero-mobile-light.svg", mobile("light")],
  ["og-image.svg", social("dark")],
];

for (const [name, svg] of files) {
  const header = `<!-- generated: assets/src/build-banner.mjs - do not edit by hand -->\n`;
  writeFileSync(resolve(OUT_DIR, name), header + svg, "utf8");
  console.log(`wrote ${name}  (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
}
