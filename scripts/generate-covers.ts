/**
 * Generates the abstract cover artwork used by seeded content.
 * Deterministic: same seed → same file, so the repo stays reproducible.
 * Run with: npx tsx scripts/generate-covers.ts
 */
import fs from "node:fs";
import path from "node:path";

const W = 1200;
const H = 750;
const OUT = path.join(process.cwd(), "public", "covers");

const PALETTE = {
  indigo: "#7E8EFF",
  cyan: "#5FD3E8",
  amber: "#E2B06A",
  violet: "#A98BFF",
  green: "#6FCF97",
  rose: "#E88BA0",
} as const;

type Accent = keyof typeof PALETTE;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const f = (n: number) => Number(n.toFixed(2));

function grid(accent: string, opacity = 0.055) {
  const lines: string[] = [];
  for (let x = 0; x <= W; x += 60) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#FFFFFF" stroke-opacity="${opacity}" stroke-width="1"/>`,
    );
  }
  for (let y = 0; y <= H; y += 60) {
    lines.push(
      `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#FFFFFF" stroke-opacity="${opacity}" stroke-width="1"/>`,
    );
  }
  return `<g>${lines.join("")}</g>
  <line x1="0" y1="${H - 1}" x2="${W}" y2="${H - 1}" stroke="${accent}" stroke-opacity="0.35" stroke-width="1"/>`;
}

/* ── Motifs ────────────────────────────────────────────────────────────────── */

function lattice(accent: string, seed: number) {
  const r = rng(seed);
  const cells: string[] = [];
  const size = 34;
  const gap = 60;
  for (let y = 90; y < H - 90; y += gap) {
    for (let x = 90; x < W - 90; x += gap) {
      const p = r();
      if (p > 0.82) {
        cells.push(
          `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="${accent}" stroke-opacity="${f(0.38 + p * 0.5)}"/>`,
        );
      } else if (p > 0.55) {
        cells.push(
          `<rect x="${x + 10}" y="${y + 10}" width="${size - 20}" height="${size - 20}" fill="${accent}" fill-opacity="${f(0.1 + p * 0.2)}"/>`,
        );
      } else {
        cells.push(
          `<rect x="${x + 16}" y="${y + 16}" width="2" height="2" fill="#FFFFFF" fill-opacity="0.45"/>`,
        );
      }
    }
  }
  return `<g>${cells.join("")}</g>`;
}

function contour(accent: string, seed: number) {
  const r = rng(seed);
  const cx = 380 + r() * 320;
  const cy = 300 + r() * 160;
  const paths: string[] = [];
  for (let i = 1; i <= 13; i++) {
    const rx = 70 + i * 42 + r() * 8;
    const ry = 46 + i * 27 + r() * 6;
    const wobble = 6 + r() * 10;
    const pts: string[] = [];
    for (let a = 0; a <= 360; a += 12) {
      const rad = (a * Math.PI) / 180;
      const jitter = Math.sin(rad * 3 + i) * wobble;
      const x = cx + Math.cos(rad) * (rx + jitter);
      const y = cy + Math.sin(rad) * (ry + jitter * 0.6);
      pts.push(`${a === 0 ? "M" : "L"}${f(x)} ${f(y)}`);
    }
    paths.push(
      `<path d="${pts.join(" ")} Z" fill="none" stroke="${accent}" stroke-opacity="${f(0.1 + i * 0.045)}" stroke-width="1.1"/>`,
    );
  }
  return `<g>${paths.join("")}</g>`;
}

function aperture(accent: string, seed: number) {
  const r = rng(seed);
  const cx = W * 0.58;
  const cy = H * 0.52;
  const rings: string[] = [];
  const ringCount = 9;
  for (let i = 1; i <= ringCount; i++) {
    const rad = i * 32;
    rings.push(
      `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#FFFFFF" stroke-opacity="${f(0.1 + (i % 3) * 0.04)}"/>`,
    );
  }
  rings.push(
    `<circle cx="${cx}" cy="${cy}" r="112" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="1.5"/>`,
  );
  rings.push(
    `<circle cx="${cx}" cy="${cy}" r="6" fill="${accent}" fill-opacity="0.9"/>`,
  );
  const ticks: string[] = [];
  for (let a = 0; a < 360; a += 5) {
    const rad = (a * Math.PI) / 180;
    const long = a % 30 === 0;
    const r1 = 190;
    const r2 = long ? 210 : 200;
    ticks.push(
      `<line x1="${f(cx + Math.cos(rad) * r1)}" y1="${f(cy + Math.sin(rad) * r1)}" x2="${f(cx + Math.cos(rad) * r2)}" y2="${f(cy + Math.sin(rad) * r2)}" stroke="#FFFFFF" stroke-opacity="${long ? 0.34 : 0.14}"/>`,
    );
  }
  const sectors: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a0 = r() * 360;
    const a1 = a0 + 20 + r() * 40;
    const p0 = [(a0 * Math.PI) / 180, (a1 * Math.PI) / 180];
    const R = 150;
    sectors.push(
      `<path d="M${cx} ${cy} L${f(cx + Math.cos(p0[0]) * R)} ${f(cy + Math.sin(p0[0]) * R)} A${R} ${R} 0 0 1 ${f(cx + Math.cos(p0[1]) * R)} ${f(cy + Math.sin(p0[1]) * R)} Z" fill="${accent}" fill-opacity="0.05"/>`,
    );
  }
  return `<g>${sectors.join("")}${rings.join("")}${ticks.join("")}</g>`;
}

function waveform(accent: string, seed: number) {
  const r = rng(seed);
  const bars: string[] = [];
  const count = 96;
  const step = (W - 160) / count;
  for (let i = 0; i < count; i++) {
    const h = 20 + Math.abs(Math.sin(i * 0.21) * 150 * (0.4 + r() * 0.9));
    const x = 80 + i * step;
    bars.push(
      `<rect x="${f(x)}" y="${f(H / 2 - h / 2)}" width="${f(step * 0.36)}" height="${f(h)}" fill="${accent}" fill-opacity="${f(0.16 + r() * 0.3)}"/>`,
    );
  }
  const pts: string[] = [];
  for (let i = 0; i <= count; i++) {
    const x = 80 + i * step;
    const y =
      H / 2 +
      Math.sin(i * 0.16) * 70 +
      Math.sin(i * 0.53) * 26 +
      (r() - 0.5) * 8;
    pts.push(`${i === 0 ? "M" : "L"}${f(x)} ${f(y)}`);
  }
  return `<g>${bars.join("")}<path d="${pts.join(" ")}" fill="none" stroke="#FFFFFF" stroke-opacity="0.68" stroke-width="1.35"/></g>`;
}

function strata(accent: string, seed: number) {
  const r = rng(seed);
  const bands: string[] = [];
  let y = 120;
  while (y < H - 90) {
    const h = 6 + r() * 42;
    const gap = 8 + r() * 26;
    const op = 0.09 + r() * 0.2;
    const w = 120 + r() * (W - 260);
    const x = 100 + r() * (W - 240 - w);
    bands.push(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${accent}" fill-opacity="${f(op)}"/>`,
    );
    if (r() > 0.72) {
      bands.push(
        `<line x1="${f(x)}" y1="${f(y + h + 4)}" x2="${f(x + w)}" y2="${f(y + h + 4)}" stroke="#FFFFFF" stroke-opacity="0.16"/>`,
      );
    }
    y += h + gap;
  }
  return `<g>${bands.join("")}</g>`;
}

function nodes(accent: string, seed: number) {
  const r = rng(seed);
  const count = 22;
  const points = Array.from({ length: count }, () => ({
    x: 110 + r() * (W - 220),
    y: 100 + r() * (H - 200),
    r: 1.6 + r() * 2.6,
  }));
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (d < 210) {
        lines.push(
          `<line x1="${f(points[i].x)}" y1="${f(points[i].y)}" x2="${f(points[j].x)}" y2="${f(points[j].y)}" stroke="${accent}" stroke-opacity="${f(0.38 - d / 1200)}"/>`,
        );
      }
    }
  }
  const dots = points.map(
    (p, i) =>
      `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" fill="${i % 7 === 0 ? accent : "#FFFFFF"}" fill-opacity="${i % 7 === 0 ? 1 : 0.72}"/>`,
  );
  return `<g>${lines.join("")}${dots.join("")}</g>`;
}

/* ── Composition ───────────────────────────────────────────────────────────── */

interface CoverSpec {
  file: string;
  motif: "lattice" | "contour" | "aperture" | "waveform" | "strata" | "nodes";
  accent: Accent;
  seed: number;
  tag: string;
}

const MOTIFS = {
  lattice,
  contour,
  aperture,
  waveform,
  strata,
  nodes,
} as const;

const SPECS: CoverSpec[] = [
  { file: "memory", motif: "lattice", accent: "indigo", seed: 12, tag: "MEMORY / VIRTUAL ADDRESS" },
  { file: "raft", motif: "nodes", accent: "cyan", seed: 44, tag: "CONSENSUS / REPLICATION" },
  { file: "ebpf", motif: "waveform", accent: "violet", seed: 7, tag: "KERNEL / TRACING" },
  { file: "attention", motif: "nodes", accent: "rose", seed: 91, tag: "ATTENTION / SEQUENCE" },
  { file: "cache", motif: "strata", accent: "amber", seed: 33, tag: "CACHE / LATENCY" },
  { file: "cortex", motif: "contour", accent: "green", seed: 58, tag: "EMBEDDED / BARE METAL" },
  { file: "light", motif: "aperture", accent: "amber", seed: 21, tag: "OPTICS / 35MM" },
  { file: "threat", motif: "lattice", accent: "rose", seed: 77, tag: "THREAT MODEL / SURFACE" },
  { file: "notes", motif: "strata", accent: "indigo", seed: 5, tag: "NOTES / KNOWLEDGE" },
  { file: "zero-copy", motif: "waveform", accent: "cyan", seed: 64, tag: "IO / PIPELINE" },
  { file: "lumen", motif: "aperture", accent: "cyan", seed: 101, tag: "PROJECT / OBSERVABILITY" },
  { file: "atlas", motif: "strata", accent: "violet", seed: 118, tag: "PROJECT / STORAGE" },
  { file: "prism", motif: "contour", accent: "amber", seed: 133, tag: "PROJECT / IMAGING" },
  { file: "ripple", motif: "waveform", accent: "green", seed: 147, tag: "PROJECT / RTOS" },
  { file: "haze", motif: "lattice", accent: "indigo", seed: 159, tag: "PROJECT / GRAPHICS" },
];

function build(spec: CoverSpec): string {
  const accent = PALETTE[spec.accent];
  const motif = MOTIFS[spec.motif](accent, spec.seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B0D12"/>
      <stop offset="0.55" stop-color="#0A0B0F"/>
      <stop offset="1" stop-color="#07080B"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.24" r="0.72">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${grid(accent)}
    <g opacity="0.92">${motif}</g>
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#FFFFFF" stroke-opacity="0.08"/>
    <text x="44" y="${H - 34}" font-family="monospace" font-size="15" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.42">${spec.tag}</text>
    <text x="${W - 44}" y="${H - 34}" text-anchor="end" font-family="monospace" font-size="15" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.28">JSB / ${String(spec.seed).padStart(3, "0")}</text>
  </g>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const spec of SPECS) {
  fs.writeFileSync(path.join(OUT, `${spec.file}.svg`), build(spec), "utf8");
}
console.log(`Generated ${SPECS.length} covers in ${OUT}`);
