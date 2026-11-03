import { useMemo, useState } from 'react';

export interface ServicePoint {
  id: string;
  name: string;
  starts_at: string | null;
  total: number;
  presential: number;
  online: number;
}

const W = 640;
const H = 220;
const PAD = { top: 24, right: 12, bottom: 28, left: 36 };

function roundedBar(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${
    x + w - rr
  },${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

export function AttendanceChart({ points }: { points: ServicePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { bars, avg, avgY, ticks, maxIdx } = useMemo(() => {
    const max = Math.max(...points.map((p) => p.total), 1);
    const niceMax = Math.max(Math.ceil(max * 1.15), 4);
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const step = plotW / Math.max(points.length, 1);
    const barW = Math.min(step * 0.55, 48);

    const bars = points.map((p, i) => {
      const h = (p.total / niceMax) * plotH;
      return {
        ...p,
        x: PAD.left + step * i + (step - barW) / 2,
        y: PAD.top + plotH - h,
        w: barW,
        h,
        cx: PAD.left + step * i + step / 2,
      };
    });

    const avg = points.reduce((s, p) => s + p.total, 0) / Math.max(points.length, 1);
    const avgY = PAD.top + plotH - (avg / niceMax) * plotH;

    const ticks = [0.5, 1].map((f) => ({
      value: Math.round(niceMax * f),
      y: PAD.top + plotH - f * plotH,
    }));

    let maxIdx = 0;
    points.forEach((p, i) => {
      if (p.total > points[maxIdx].total) maxIdx = i;
    });

    return { bars, avg, avgY, ticks, maxIdx };
  }, [points]);

  if (points.length === 0) return null;

  const baseline = H - PAD.bottom;
  const hovered = hover !== null ? bars[hover] : null;

  return (
    <div className="relative">
      <p className="mb-2 flex items-center gap-2 text-xs text-carbon/60">
        <svg width="22" height="4" aria-hidden>
          <line
            x1="0"
            x2="22"
            y1="2"
            y2="2"
            stroke="#6B5344"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        </svg>
        Promedio: {avg.toFixed(1)} asistentes
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Asistencia por culto, últimos cultos"
      >
        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="#2E2E2E"
              strokeOpacity={0.08}
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#2E2E2E"
              fillOpacity={0.45}
            >
              {t.value}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={baseline}
          y2={baseline}
          stroke="#2E2E2E"
          strokeOpacity={0.2}
        />

        {bars.map((b, i) => (
          <g key={b.id}>
            <path
              d={roundedBar(b.x, b.y, b.w, b.h)}
              fill="#4A6E4A"
              opacity={hover === null || hover === i ? 1 : 0.45}
            />
            {(i === maxIdx || i === bars.length - 1) && b.total > 0 && (
              <text
                x={b.cx}
                y={b.y - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight={500}
                fill="#2E2E2E"
              >
                {b.total}
              </text>
            )}
            <text
              x={b.cx}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#2E2E2E"
              fillOpacity={0.5}
            >
              {b.starts_at
                ? new Date(b.starts_at).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                  })
                : '—'}
            </text>
            <rect
              x={b.cx - 24}
              y={PAD.top}
              width={48}
              height={baseline - PAD.top}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={avgY}
          y2={avgY}
          stroke="#6B5344"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          strokeOpacity={0.7}
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-carbon px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: `${(hovered.cx / W) * 100}%`,
            top: `${(hovered.y / H) * 100}%`,
            marginTop: -52,
          }}
        >
          <p className="font-medium">{hovered.name}</p>
          <p className="mt-0.5 text-white/80">
            {hovered.total} asistentes · {hovered.presential} presencial ·{' '}
            {hovered.online} online
          </p>
        </div>
      )}
    </div>
  );
}
