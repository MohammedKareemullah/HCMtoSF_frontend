import { useState } from "react";
import { formatSync } from "../lib/format";

export const Icon = ({ name, className = "", size = 20 }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>{name}</span>
);

export function Card({ className = "", children }) {
  return <section className={`rounded-xl bg-surface-container-lowest p-5 shadow-sm ${className}`}>{children}</section>;
}

export function CardHeader({ icon, title, subtitle, right }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="text-primary-container" size={22} />}
          <h2 className="text-title-lg font-semibold text-on-surface">{title}</h2>
        </div>
        {subtitle && <p className="mt-0.5 text-body-sm text-secondary">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export const Pill = ({ children, className = "bg-surface-container text-secondary" }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-xs font-bold uppercase tracking-wider ${className}`}>{children}</span>
);

export const Chip = ({ children, className = "" }) => (
  <span className={`inline-block rounded bg-surface-container px-2 py-0.5 font-mono text-label-xs font-semibold text-on-surface ${className}`}>{children}</span>
);

export function Skeleton({ h = 160 }) {
  return <div className="animate-pulse rounded-lg bg-surface-container-low" style={{ height: h }} />;
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-error-container/50 p-4 text-on-error-container">
      <div className="flex items-center gap-2 text-body-md">
        <Icon name="error" />
        <span>Could not load data{error?.message ? `: ${error.message}` : "."}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="rounded bg-primary-container px-3 py-1 text-title-md text-on-primary hover:bg-primary">Retry</button>
      )}
    </div>
  );
}

/** Renders loading / error / content for a useApi() state. children(data, meta) */
export function Async({ state, children, minHeight = 180 }) {
  const { data, meta, loading, error, reload } = state;
  if (!data && loading) return <Skeleton h={minHeight} />;
  if (!data && error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return null;
  return (
    <div className={loading ? "opacity-70 transition-opacity" : ""}>
      {error && <div className="mb-2"><ErrorBox error={error} onRetry={reload} /></div>}
      {children(data, meta)}
    </div>
  );
}

export function SyncBadge({ meta }) {
  const when = formatSync(meta);
  if (!when) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-label-xs font-bold uppercase tracking-wider ${meta.stale ? "text-amber-700" : "text-secondary"}`}>
      <Icon name={meta.stale ? "warning" : "sync"} size={14} />
      {meta.stale ? "Stale · " : "Synced · "}{when}
    </span>
  );
}

export function Collapsible({ icon, title, subtitle, right, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <div className="flex cursor-pointer select-none items-start justify-between gap-3" onClick={() => setOpen((o) => !o)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} className="text-primary-container" size={22} />}
            <h2 className="text-title-lg font-semibold">{title}</h2>
          </div>
          {subtitle && <p className="mt-0.5 text-body-sm text-secondary">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {right}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-xs font-bold uppercase tracking-wider text-secondary hover:bg-surface-container-high"
          >
            {open ? "Collapse" : "Expand"}
            <Icon name="expand_less" size={18} className={`transition-transform duration-300 ${open ? "" : "rotate-180"}`} />
          </button>
        </div>
      </div>
      {open && <div className="mt-4">{children}</div>}
    </Card>
  );
}

export function Pagination({ page, pageCount, onChange, from, to, total, unit = "items", pageSizes, pageSize, onPageSize }) {
  const pages = [];
  const add = (p) => pages.push(p);
  const w = 1;
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || (p >= page - w && p <= page + w)) add(p);
    else if (pages[pages.length - 1] !== "…") add("…");
  }
  const btn = "rounded px-2.5 py-1 text-body-sm transition-colors";
  return (
    <div className="mt-3 flex flex-col items-center justify-between gap-2 border-t border-surface-container pt-3 text-body-sm text-secondary sm:flex-row">
      <div className="flex items-center gap-3">
        <span>Showing {from}–{to} of {total} {unit}</span>
        {pageSizes && (
          <label className="flex items-center gap-1">
            Rows
            <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded bg-surface-container px-1.5 py-0.5 text-on-surface">
              {pageSizes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button className={`${btn} bg-surface-container hover:bg-surface-container-high disabled:opacity-40`} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        {pages.map((p, i) =>
          p === "…" ? <span key={`e${i}`} className="px-1">…</span> : (
            <button key={p} onClick={() => onChange(p)} className={`${btn} ${p === page ? "bg-primary-container font-bold text-on-primary" : "bg-surface-container hover:bg-surface-container-high"}`}>{p}</button>
          ))}
        <button className={`${btn} bg-surface-container hover:bg-surface-container-high disabled:opacity-40`} disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, className = "w-64" }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={18} className="absolute left-2.5 top-2 text-secondary" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg bg-surface-container-low pl-8 pr-3 text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

export function Kpi({ label, value, hint, icon, accent = "bg-primary-container" }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="mb-1 flex items-center justify-between">
        <span className="text-label-xs font-bold uppercase text-secondary">{label}</span>
        {icon && <Icon name={icon} className="text-secondary" />}
      </div>
      <div className="text-metric-num text-on-surface">{value}</div>
      {hint && <div className="mt-1 text-body-sm text-secondary">{hint}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, meta, actions }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-label-xs font-bold uppercase tracking-wider text-secondary">
          {/* <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-container" />           */}
          {meta && <><SyncBadge meta={meta} /></>}
        </div>
        <h1 className="text-headline-lg tracking-tight text-on-surface">{title}</h1>
        {subtitle && <p className="max-w-3xl text-body-md text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Recharts tooltip with a consistent look. */
export function ChartTip({ active, payload, label, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-inverse-surface px-3 py-2 text-body-sm text-white shadow-lg" style={{ background: "#2d3133" }}>
      {render ? render(payload[0].payload, payload) : (
        <>
          {label !== undefined && <div className="mb-0.5 font-semibold">{label}</div>}
          {payload.map((p) => (
            <div key={p.dataKey || p.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
              {p.name}: <b>{Number(p.value).toLocaleString()}</b>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
