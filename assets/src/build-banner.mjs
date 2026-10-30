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

function capabilityPill(t, { x, y, h = 30, label }) {
  const fs = 11;
  const ls = 1.6;
  const padX = 14;
  const textW = approxWidth(label, fs, ls, 0.62);
  const w = Math.round(padX * 2 + textW + 10);
  return {
    width: w,
    svg: `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.chipBg}" stroke="${t.accent}" stroke-opacity="0.4" stroke-width="1" />
      <circle cx="${x + 11}" cy="${y + h / 2}" r="2.8" fill="${t.accent}" />
      <text x="${x + 20}" y="${y + h / 2 + 4}" font-family="${MONO}" font-size="${fs}" font-weight="600"
            letter-spacing="${ls}" fill="${t.textDim}">${esc(label)}</text>
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

  const caps = data.capabilities || ["AGENTIC WORKFLOWS", "DISTRIBUTED RUNTIMES", "LOW-LATENCY RAG"];
  let curX = M;
  const capSvgs = [];
  for (const cap of caps) {
    const p = capabilityPill(t, { x: curX, y: 226, label: cap });
    capSvgs.push(p.svg);
    curX += p.width + 10;
  }

  // diagram geometry
  const ax0 = 744;
  const ax1 = 1222;
  const ay = 158;
  const nx = [780, 895, 1010, 1125];

  const links = nx
    .slice(0, -1)
    .map((x, i) => `<line x1="${x + 14}" y1="${ay}" x2="${nx[i + 1] - 14}" y2="${ay}"
      stroke="${t.lineStrong}" stroke-width="1.2" stroke-dasharray="3 3" />
      <line x1="${x + 14}" y1="${ay}" x2="${nx[i + 1] - 14}" y2="${ay}"
      stroke="${t.accent}" stroke-width="1.5" stroke-dasharray="5 28" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="33;0" dur="2.4s" repeatCount="indefinite" />
      </line>`)
    .join("\n      ");

  const nodes = nx
    .map((x, i) => {
      const on = i === diagram.activeIndex;
      if (!on) {
        return `<g>
          <circle cx="${x}" cy="${ay}" r="9" fill="${t.bg}" stroke="${t.lineStrong}" stroke-width="1.4" />
          <circle cx="${x}" cy="${ay}" r="3.2" fill="${t.textDim}" opacity="0.6" />
        </g>`;
      }
      return `<g>
        <circle cx="${x}" cy="${ay}" r="17" fill="none" stroke="${t.accent}" stroke-opacity="0.35">
          <animate attributeName="r" values="13;23;13" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.55;0;0.55" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${x}" cy="${ay}" r="10" fill="${t.bg}" stroke="${t.accent}" stroke-width="2" />
        <circle cx="${x}" cy="${ay}" r="4.5" fill="${t.accent}">
          <animate attributeName="opacity" values="1;0.4;1" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </g>`;
    })
    .join("\n      ");

  const labels = nx
    .map(
      (x, i) =>
        `<text x="${x}" y="190" text-anchor="middle" font-family="${MONO}" font-size="9.5" letter-spacing="2"
          fill="${i === diagram.activeIndex ? t.accent : t.textDim}" ${i === diagram.activeIndex ? 'font-weight="700"' : ""}>${esc(diagram.nodes[i])}</text>
        <text x="${x}" y="204" text-anchor="middle" font-family="${MONO}" font-size="8" letter-spacing="1.2"
          fill="${t.muted}">0${i + 1}</text>`,
    )
    .join("\n      ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="Anil Pradhan &#8212; Backend &amp; AI Systems Engineer. Deterministic multi-agent systems &amp; high-throughput backends.">
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
  <text x="${M}" y="200" font-family="${SANS}" font-size="19" font-weight="400" letter-spacing="0.1"
        fill="${t.textDim}">${esc(pid.role)}</text>

  <!-- capability badges -->
  ${capSvgs.join("\n  ")}

  <!-- footer -->
  <line x1="${M}" y1="278" x2="${W - M}" y2="278" stroke="${t.line}" />
  <circle cx="${M + 3}" cy="295.5" r="3.2" fill="${t.accent}">
    <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" />
  </circle>
  <text x="${M + 16}" y="299.5" font-family="${MONO}" font-size="11" font-weight="600" letter-spacing="1.7"
        fill="${t.textDim}">${esc(proof.status)}</text>
  <text x="${W - M}" y="299.5" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="1.7"
        fill="${t.muted}">${esc(pid.location.toUpperCase())} &#183; ${esc(pid.timezone)}</text>

  <!-- system diagram container HUD -->
  <rect x="${ax0 - 12}" y="70" width="${W - M - ax0 + 24}" height="182" rx="8" fill="${t.chipBg}" stroke="${t.line}" stroke-width="1" />
  <line x1="${ax0 - 12}" y1="112" x2="${W - M + 12}" y2="112" stroke="${t.line}" stroke-opacity="0.4" />
  <text x="${ax0}" y="94" font-family="${MONO}" font-size="9.5" font-weight="600" letter-spacing="2.4"
        fill="${t.accent}">${esc(diagram.label)}</text>
  <text x="${W - M}" y="94" text-anchor="end" font-family="${MONO}" font-size="9" letter-spacing="1.6"
        fill="${t.muted}">${esc(pid.coordinates || "20.29°N 85.82°E")}</text>

  <!-- reflection loop -->
  <path d="M1125 ${ay - 10} C 1125 106, 895 106, 895 ${ay - 12}" fill="none" stroke="${t.accent}"
        stroke-opacity="0.45" stroke-width="1.2" stroke-dasharray="3 4" marker-end="url(#arrow-accent-${id})">
    <animate attributeName="stroke-dashoffset" values="0;-28" dur="2.6s" repeatCount="indefinite" />
  </path>
  <text x="1010" y="102" text-anchor="middle" font-family="${MONO}" font-size="8" letter-spacing="1.8"
        fill="${t.accent}" opacity="0.9">AGENTIC REFLECTION // LOOP</text>

  <g>
    ${links}
  </g>
  <g>
    ${nodes}
  </g>
  <g>
    ${labels}
  </g>
  <text x="${ax0}" y="234" font-family="${MONO}" font-size="8" letter-spacing="1.2"
        fill="${t.muted}">CONCURRENCY: ASYNC-UVLOOP &#183; MEMORY: VECTOR FAISS &#183; EVAL: EVAL-HARNESS</text>
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
  const caps = data.capabilities || ["AGENTIC WORKFLOWS", "DISTRIBUTED RUNTIMES", "LOW-LATENCY RAG"];
  let curX = M;
  const capSvgs = [];
  for (const cap of caps) {
    const p = capabilityPill(t, { x: curX, y: 242, h: 30, label: cap });
    capSvgs.push(p.svg);
    curX += p.width + 10;
  }

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
  role="img" aria-label="Anil Pradhan &#8212; Backend &amp; AI Systems Engineer. Deterministic multi-agent systems &amp; high-throughput backends.">
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

  ${capSvgs.join("\n  ")}

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
  role="img" aria-label="Anil Pradhan &#8212; Backend &amp; AI Systems Engineer. Deterministic multi-agent systems &amp; high-throughput backends.">
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
