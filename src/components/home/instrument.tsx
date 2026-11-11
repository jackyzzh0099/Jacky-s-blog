/**
 * The hero's "instrument": a precision-dial graphic drawn entirely in SVG.
 * Purely decorative, but labelled like a real readout.
 */
export function Instrument({
  articleCount,
  projectCount,
  lastUpdated,
}: {
  articleCount: number;
  projectCount: number;
  lastUpdated: string;
}) {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  const nodes = Array.from({ length: 8 }, (_, i) => i);
  const bars = [18, 32, 14, 44, 26, 52, 38, 22, 46, 30, 16, 40];

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[60px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent) / 0.14), transparent 62%)",
        }}
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 520 520"
        className="relative h-auto w-full text-muted"
        role="img"
        aria-label="Decorative instrument dial"
      >
        <defs>
          <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0" />
            <stop offset="55%" stopColor="rgb(var(--accent))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.42" />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* crosshair */}
        <g stroke="currentColor" strokeOpacity="0.22">
          <line x1="260" y1="18" x2="260" y2="150" strokeDasharray="2 6" />
          <line x1="260" y1="370" x2="260" y2="502" strokeDasharray="2 6" />
          <line x1="18" y1="260" x2="150" y2="260" strokeDasharray="2 6" />
          <line x1="370" y1="260" x2="502" y2="260" strokeDasharray="2 6" />
        </g>

        <circle cx="260" cy="260" r="244" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeDasharray="1 7" />
        <circle cx="260" cy="260" r="196" fill="none" stroke="currentColor" strokeOpacity="0.22" />

        {/* rotating tick ring */}
        <g className="animate-orbit" style={{ transformOrigin: "260px 260px" }}>
          {ticks.map((i) => {
            const angle = (i / ticks.length) * Math.PI * 2;
            const long = i % 6 === 0;
            const r1 = long ? 206 : 214;
            const r2 = 226;
            return (
              <line
                key={i}
                x1={260 + Math.cos(angle) * r1}
                y1={260 + Math.sin(angle) * r1}
                x2={260 + Math.cos(angle) * r2}
                y2={260 + Math.sin(angle) * r2}
                stroke="currentColor"
                strokeOpacity={long ? 0.62 : 0.3}
                strokeWidth={long ? 1.3 : 1}
              />
            );
          })}
          <path
            d="M260 42 A218 218 0 0 1 412 108"
            fill="none"
            stroke="url(#arc)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect x="256" y="34" width="8" height="8" fill="rgb(var(--accent))" fillOpacity="0.85" />
        </g>

        {/* accent arc */}
        <circle
          cx="260"
          cy="260"
          r="176"
          fill="none"
          stroke="rgb(var(--accent))"
          strokeOpacity="0.85"
          strokeWidth="1.3"
          strokeDasharray="118 990"
          transform="rotate(-58 260 260)"
        />

        {/* nodes on inner ring */}
        <circle cx="260" cy="260" r="131" fill="none" stroke="currentColor" strokeOpacity="0.18" />
        {nodes.map((i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = 260 + Math.cos(angle) * 131;
          const y = 260 + Math.sin(angle) * 131;
          const accent = i === 1;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={accent ? 4 : 2.4}
                fill={accent ? "rgb(var(--accent))" : "currentColor"}
                fillOpacity={accent ? 1 : 0.45}
              />
              {accent && (
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="none"
                  stroke="rgb(var(--accent))"
                  strokeOpacity="0.28"
                  className="animate-pulse-soft"
                />
              )}
            </g>
          );
        })}

        {/* blade */}
        <path d="M260 260 L392 176 A152 152 0 0 1 404 200 Z" fill="url(#blade)" />

        {/* centre */}
        <circle cx="260" cy="260" r="52" fill="none" stroke="currentColor" strokeOpacity="0.28" />
        <circle cx="260" cy="260" r="2.4" fill="rgb(var(--accent))" />
        <g stroke="currentColor" strokeOpacity="0.45" strokeWidth="1">
          <line x1="260" y1="216" x2="260" y2="228" />
          <line x1="260" y1="292" x2="260" y2="304" />
          <line x1="216" y1="260" x2="228" y2="260" />
          <line x1="292" y1="260" x2="304" y2="260" />
        </g>

        {/* readouts */}
        <text x="30" y="42" fontFamily="monospace" fontSize="9.5" letterSpacing="2.4" fill="currentColor" fillOpacity="0.9">
          SYS.01 / INDEX
        </text>
        <text x="490" y="42" textAnchor="end" fontFamily="monospace" fontSize="9.5" letterSpacing="2.4" fill="currentColor" fillOpacity="0.6">
          {lastUpdated.toUpperCase()}
        </text>
        <text x="30" y="486" fontFamily="monospace" fontSize="9.5" letterSpacing="2.4" fill="currentColor" fillOpacity="0.55">
          22.54°N 114.05°E
        </text>
        <text x="490" y="486" textAnchor="end" fontFamily="monospace" fontSize="9.5" letterSpacing="2.4" fill="currentColor" fillOpacity="0.9">
          {String(articleCount).padStart(2, "0")} ART · {String(projectCount).padStart(2, "0")} PRJ
        </text>

        {/* activity bars */}
        <g transform="translate(400 424)">
          {bars.map((h, i) => (
            <rect
              key={i}
              x={i * 5.2}
              y={-h}
              width="2.2"
              height={h}
              fill="currentColor"
              fillOpacity={0.42 + (i % 3) * 0.1}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
