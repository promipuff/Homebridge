// Small accessible SVG charts built on d3-scale / d3-shape.
// Every chart has a text summary for screen readers and an optional data table.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { area, line } from 'd3-shape';
import { cx } from './ui';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    setW(el.clientWidth || 600);
    const ro = new ResizeObserver(() => setW(el.clientWidth || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function DataTable({ caption, cols, rows }: { caption: string; cols: string[]; rows: (string | number)[][] }) {
  return (
    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-2">
          <tr>{cols.map((c) => <th key={c} scope="col" className="px-3 py-1.5 font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => <td key={j} className="px-3 py-1">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartFrame({ summary, children, table, legend }: { summary: string; children: ReactNode; table: ReactNode; legend?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="min-w-0">
      {children}
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span className="flex flex-wrap items-center gap-3">{legend}</span>
        <button type="button" className="rounded-md px-1 font-semibold text-forest underline underline-offset-2" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide data table' : 'Show data table'}
        </button>
      </figcaption>
      <p className="sr-only">{summary}</p>
      {open && table}
    </figure>
  );
}

export function Swatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="18" height="8" aria-hidden="true">
        <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="3" strokeDasharray={dashed ? '4 3' : undefined} />
      </svg>
      {label}
    </span>
  );
}

export interface BarDatum { label: string; value: number; flagged?: boolean }

export function BarChart({ data, unit, summary, height = 180, avgLine = true }: { data: BarDatum[]; unit: string; summary: string; height?: number; avgLine?: boolean }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const m = { t: 12, r: 8, b: 26, l: 40 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const x = scaleBand().domain(data.map((d) => d.label)).range([m.l, width - m.r]).padding(0.28);
  const y = scaleLinear().domain([0, max * 1.12]).nice().range([height - m.b, m.t]);
  const avg = data.slice(0, -1).reduce((a, d) => a + d.value, 0) / Math.max(data.length - 1, 1);
  const every = Math.ceil(data.length / Math.max(Math.floor(width / 64), 1));
  return (
    <ChartFrame
      summary={summary}
      legend={
        <>
          <Swatch color="var(--sage)" label={`Daily ${unit}`} />
          {data.some((d) => d.flagged) && <Swatch color="var(--danger)" label="Unusual day" />}
          {avgLine && <Swatch color="var(--muted)" label="Earlier average" dashed />}
        </>
      }
      table={<DataTable caption={summary} cols={['Day', unit]} rows={data.map((d) => [d.label, d.value + (d.flagged ? ' (unusual)' : '')])} />}
    >
      <div ref={ref} className="w-full">
        <svg width={width} height={height} role="img" aria-label={summary} className="block overflow-visible">
          {y.ticks(4).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={m.l - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
            </g>
          ))}
          {data.map((d) => (
            <rect key={d.label} x={x(d.label)} y={y(d.value)} width={x.bandwidth()} height={Math.max(height - m.b - y(d.value), 0)} rx={3} fill={d.flagged ? 'var(--danger)' : 'var(--sage)'}>
              <title>{`${d.label}: ${d.value} ${unit}`}</title>
            </rect>
          ))}
          {data.map((d, i) => (i % every === 0 || i === data.length - 1) && (
            <text key={'l' + d.label} x={(x(d.label) ?? 0) + x.bandwidth() / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
          ))}
          {avgLine && <line x1={m.l} x2={width - m.r} y1={y(avg)} y2={y(avg)} stroke="var(--muted)" strokeDasharray="4 4" strokeWidth={1.5} />}
        </svg>
      </div>
    </ChartFrame>
  );
}

export interface LinePoint { x: number; label: string; a: number; b?: number; solid?: boolean }

/** Cumulative cost line: solid where data is known, dashed for the projection, optional comparison line and budget. */
export function TrajectoryChart({ points, budget, summary, height = 220, formatY, aLabel, bLabel, markerX, markerLabel }: {
  points: LinePoint[]; budget?: number | null; summary: string; height?: number; formatY: (n: number) => string;
  aLabel: string; bLabel?: string; markerX?: number; markerLabel?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const m = { t: 16, r: 12, b: 28, l: 52 };
  const xMax = Math.max(...points.map((p) => p.x), 1);
  const yMax = Math.max(...points.map((p) => Math.max(p.a, p.b ?? 0)), budget ?? 0, 1);
  const x = scaleLinear().domain([0, xMax]).range([m.l, width - m.r]);
  const y = scaleLinear().domain([0, yMax * 1.1]).nice().range([height - m.b, m.t]);
  const solidPts = points.filter((p) => p.solid);
  const lastSolid = solidPts[solidPts.length - 1];
  const projPts = points.filter((p) => !p.solid);
  const ln = line<LinePoint>().x((p) => x(p.x)).y((p) => y(p.a));
  const lnB = line<LinePoint>().x((p) => x(p.x)).y((p) => y(p.b ?? 0));
  const ar = area<LinePoint>().x((p) => x(p.x)).y0(height - m.b).y1((p) => y(p.a));
  const ticksX = x.ticks(Math.min(6, Math.max(2, Math.floor(width / 80))));
  const end = points[points.length - 1];
  const showB = bLabel && points.some((p) => p.b !== undefined && Math.abs((p.b ?? 0) - p.a) > 0.005);
  return (
    <ChartFrame
      summary={summary}
      legend={
        <>
          <Swatch color="var(--forest)" label={aLabel} />
          {showB && <Swatch color="var(--ok)" label={bLabel!} dashed />}
          {budget ? <Swatch color="var(--amber)" label="Budget" dashed /> : null}
        </>
      }
      table={<DataTable caption={summary} cols={['Day', aLabel, ...(showB ? [bLabel!] : [])]} rows={points.map((p) => [p.label, formatY(p.a), ...(showB ? [formatY(p.b ?? 0)] : [])])} />}
    >
      <div ref={ref} className="w-full">
        <svg width={width} height={height} role="img" aria-label={summary} className="block overflow-visible">
          {y.ticks(4).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={m.l - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)">{formatY(t).replace('.00', '')}</text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} x={x(t)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">Day {t}</text>
          ))}
          <path d={ar(solidPts) ?? ''} fill="var(--forest)" opacity={0.1} />
          <path d={ln(solidPts) ?? ''} fill="none" stroke="var(--forest)" strokeWidth={2.5} />
          {lastSolid && <path d={ln([lastSolid, ...projPts]) ?? ''} fill="none" stroke="var(--forest)" strokeWidth={2.5} strokeDasharray="6 5" />}
          {showB && lastSolid && <path d={lnB([lastSolid, ...projPts]) ?? ''} fill="none" stroke="var(--ok)" strokeWidth={2} strokeDasharray="2 4" />}
          {budget ? (
            <g>
              <line x1={m.l} x2={width - m.r} y1={y(budget)} y2={y(budget)} stroke="var(--amber)" strokeWidth={2} strokeDasharray="7 4" />
              <text x={width - m.r} y={y(budget) - 6} textAnchor="end" fontSize="11" fontWeight={700} fill="var(--amber)">Budget {formatY(budget)}</text>
            </g>
          ) : null}
          {markerX !== undefined && (
            <g>
              <line x1={x(markerX)} x2={x(markerX)} y1={m.t} y2={height - m.b} stroke="var(--muted)" strokeDasharray="2 3" />
              <text x={x(markerX) + 4} y={m.t + 8} fontSize="11" fill="var(--muted)">{markerLabel}</text>
            </g>
          )}
          {lastSolid && <circle cx={x(lastSolid.x)} cy={y(lastSolid.a)} r={4.5} fill="var(--forest)" stroke="var(--surface)" strokeWidth={2} />}
          {end && <circle cx={x(end.x)} cy={y(end.a)} r={4.5} fill="var(--surface)" stroke="var(--forest)" strokeWidth={2.5} />}
        </svg>
      </div>
    </ChartFrame>
  );
}

export function MiniLine({ data, height = 70, className, summary, threshold }: { data: { label: string; value: number }[]; height?: number; className?: string; summary: string; threshold?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const vals = data.map((d) => d.value);
  const lo = Math.min(...vals, threshold ?? Infinity) - 1;
  const hi = Math.max(...vals, threshold ?? -Infinity) + 1;
  const x = scaleLinear().domain([0, data.length - 1]).range([4, width - 4]);
  const y = scaleLinear().domain([lo, hi]).range([height - 4, 4]);
  const ln = line<{ value: number }>().x((_, i) => x(i)).y((d) => y(d.value));
  const ar = area<{ value: number }>().x((_, i) => x(i)).y0(height).y1((d) => y(d.value));
  const last = data[data.length - 1];
  return (
    <div ref={ref} className={cx('w-full', className)}>
      <svg width={width} height={height} role="img" aria-label={summary} className="block">
        {threshold !== undefined && <line x1={0} x2={width} y1={y(threshold)} y2={y(threshold)} stroke="var(--danger)" strokeDasharray="3 3" />}
        <path d={ar(data) ?? ''} fill="var(--sage)" opacity={0.25} />
        <path d={ln(data) ?? ''} fill="none" stroke="var(--forest)" strokeWidth={2} />
        {last && <circle cx={x(data.length - 1)} cy={y(last.value)} r={3.5} fill="var(--forest)" />}
      </svg>
    </div>
  );
}
