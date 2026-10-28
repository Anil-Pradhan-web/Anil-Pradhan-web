/**
 * Shared design tokens + SVG primitives.
 *
 * One palette, one type stack, one set of frame primitives. Both the banner
 * generator and the stats generator import from here, so the README can never
 * show two slightly different greens.
 */

export const SANS = `'Inter','Segoe UI Variable Display','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif`;
export const MONO = `'Cascadia Mono','SF Mono','JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace`;

export const THEMES = {
  dark: {
    bg: "#0b0f14",
    text: "#f0f4f8",
    textDim: "#9aa7b4",
    muted: "#6b7785",
    accent: "#3ddc97",
    accentSoft: "rgba(61,220,151,0.5)",
    accentWash: "rgba(61,220,151,0.12)",
    gold: "#e3b341",
    line: "rgba(255,255,255,0.095)",
    lineStrong: "rgba(255,255,255,0.22)",
    chipBg: "rgba(255,255,255,0.028)",
    chipBorder: "rgba(255,255,255,0.16)",
    glow: "rgba(61,220,151,0.11)",
    glow2: "rgba(82,140,255,0.05)",
    heatEmpty: "rgba(255,255,255,0.055)",
    heatLevels: ["rgba(61,220,151,0.20)", "rgba(61,220,151,0.38)", "rgba(61,220,151,0.62)", "rgba(61,220,151,0.95)"],
  },
  light: {
    bg: "#ffffff",
    text: "#0e141a",
    textDim: "#4b5764",
    muted: "#6b7683",
    accent: "#0e7c5a",
    accentSoft: "rgba(14,124,90,0.5)",
    accentWash: "rgba(14,124,90,0.08)",
    gold: "#8a6200",
    line: "rgba(14,20,26,0.14)",
    lineStrong: "rgba(14,20,26,0.30)",
    chipBg: "rgba(14,20,26,0.018)",
    chipBorder: "rgba(14,20,26,0.16)",
    glow: "rgba(14,124,90,0.07)",
    glow2: "rgba(30,90,200,0.04)",
    heatEmpty: "rgba(14,20,26,0.07)",
    heatLevels: ["rgba(14,124,90,0.18)", "rgba(14,124,90,0.34)", "rgba(14,124,90,0.58)", "rgba(14,124,90,0.92)"],
  },
};

export const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // keep generated SVGs pure ASCII: every client decodes numeric entities
    .replace(/[^\x00-\x7f]/g, (c) => `&#${c.codePointAt(0)};`);

export const approxWidth = (str, size, ls = 0, factor = 0.6) =>
  str.length * (size * factor) + Math.max(0, str.length - 1) * ls;

export function defs(t, id) {
  return `
  <defs>
    <radialGradient id="glow-${id}" cx="86%" cy="-14%" r="72%">
      <stop offset="0%" stop-color="${t.glow}" />
      <stop offset="55%" stop-color="${t.glow}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${t.glow}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow2-${id}" cx="4%" cy="118%" r="46%">
      <stop offset="0%" stop-color="${t.glow2}" />
      <stop offset="100%" stop-color="${t.glow2}" stop-opacity="0" />
    </radialGradient>
    <filter id="soft-${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <marker id="arrow-${id}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0 0 L6 3 L0 6 z" fill="${t.lineStrong}" />
    </marker>
    <marker id="arrow-accent-${id}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0 0 L6 3 L0 6 z" fill="${t.accent}" />
    </marker>
  </defs>`;
}

/** Technical-drawing corner brackets — the banner's signature frame. */
export function brackets(t, w, h, inset = 20, arm = 26) {
  const s = `stroke="${t.accent}" stroke-opacity="0.55" stroke-width="1.4" fill="none" stroke-linecap="square"`;
  return `
  <g>
    <path d="M${inset} ${inset + arm} L${inset} ${inset} L${inset + arm} ${inset}" ${s} />
    <path d="M${w - inset - arm} ${inset} L${w - inset} ${inset} L${w - inset} ${inset + arm}" ${s} />
    <path d="M${inset} ${h - inset - arm} L${inset} ${h - inset} L${inset + arm} ${h - inset}" ${s} />
    <path d="M${w - inset - arm} ${h - inset} L${w - inset} ${h - inset} L${w - inset} ${h - inset - arm}" ${s} />
  </g>`;
}

export function backdrop(t, w, h, id) {
  return `
  <rect width="${w}" height="${h}" fill="${t.bg}" />
  <rect width="${w}" height="${h}" fill="url(#glow-${id})" />
  <rect width="${w}" height="${h}" fill="url(#glow2-${id})" />
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${t.line}" />`;
}

export const number = (n) => n.toLocaleString("en-US");

/** hex (#rrggbb) -> rgba() with an explicit alpha, for renderers without color-mix(). */
export function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
