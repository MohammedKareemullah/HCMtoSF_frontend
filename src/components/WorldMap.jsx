import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import world from "world-atlas/countries-110m.json";
import { C, fmt, pct } from "../lib/format";
import { Icon } from "./ui";

const W = 960;
const H = 480;
const FEATURES = feature(world, world.objects.countries).features.filter((f) => String(f.id) !== "010");
const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
const path = geoPath(projection);

const alpha2 = (f) => {
  try { return countries.numericToAlpha2(String(f.id).padStart(3, "0")) || null; } catch { return null; }
};

export default function WorldMap({ items, total }) {
  const [hover, setHover] = useState(null);
  const [zoom, setZoom] = useState(false);

  const byCode = useMemo(() => {
    const m = {};
    items.forEach((i) => { if (i.countryCode) m[i.countryCode] = i; });
    return m;
  }, [items]);
  const max = Math.max(1, ...items.filter((i) => i.countryCode).map((i) => i.employees));
  const unknown = items.filter((i) => !i.countryCode).reduce((s, i) => s + i.employees, 0);

  const shapes = useMemo(() => FEATURES.map((f) => ({ f, code: alpha2(f), d: path(f) })), []);
  const withData = shapes.filter((s) => s.code && byCode[s.code]);

  const viewBox = useMemo(() => {
    if (!zoom || !withData.length) return `0 0 ${W} ${H}`;
    const [[x0, y0], [x1, y1]] = path.bounds({ type: "FeatureCollection", features: withData.map((s) => s.f) });
    let w = Math.max(x1 - x0, 80) + 120;
    let h = Math.max(y1 - y0, 40) + 80;
    const ar = W / H;
    if (w / h < ar) w = h * ar; else h = w / ar;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
  }, [zoom, withData]);

  const scale = zoom ? 0.4 : 1;
  const shade = (n) => `rgba(139,29,36,${(0.3 + 0.7 * Math.sqrt(n / max)).toFixed(2)})`;
  const sorted = [...items].sort((a, b) => b.employees - a.employees);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className="relative xl:col-span-8">
        <svg viewBox={viewBox} className="w-full rounded-lg bg-surface-container-low" role="img" aria-label="Employees by country">
          {shapes.map(({ f, code, d }) => {
            const row = code && byCode[code];
            return (
              <path key={String(f.id) + d?.length} d={d} stroke="#fff" strokeWidth={0.5 * scale}
                fill={row ? shade(row.employees) : C.track}
                onMouseEnter={() => row && setHover(row)} onMouseLeave={() => setHover(null)}
                style={{ transition: "fill .2s" }} />
            );
          })}
          {withData.map(({ f, code }) => {
            const row = byCode[code];
            const [x, y] = projection(geoCentroid(f));
            const r = (6 + Math.sqrt(row.employees / max) * 14) * scale;
            return (
              <g key={code} onMouseEnter={() => setHover(row)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={r} fill={C.primary} fillOpacity="0.88" stroke="#fff" strokeWidth={1.5 * scale} />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(9, r * 0.9)} fill="#fff" fontWeight="700">{row.employees}</text>
              </g>
            );
          })}
        </svg>
        <button onClick={() => setZoom((z) => !z)} className="absolute right-3 top-3 flex items-center gap-1 rounded bg-white/90 px-2.5 py-1 text-label-md text-on-surface shadow hover:bg-white">
          <Icon name={zoom ? "zoom_out_map" : "zoom_in_map"} size={16} /> {zoom ? "World view" : "Zoom to data"}
        </button>
        {hover && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg px-3 py-2 text-body-sm text-white shadow-lg" style={{ background: "#2d3133" }}>
            <b>{hover.country}</b> · {fmt(hover.employees)} employees ({pct(hover.employees, total)})
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 xl:col-span-4">
        {sorted.map((i) => {
          const isUnknown = !i.countryCode;
          return (
            <div key={i.countryCode || "unknown"} className={`rounded-lg p-3 ${isUnknown ? "bg-error-container/40" : "bg-surface"}`}>
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-title-md ${isUnknown ? "text-on-error-container" : ""}`}>
                  {isUnknown && <Icon name="help" size={18} className="text-error" />}
                  {i.country}
                  {i.countryCode && <span className="font-mono text-label-xs text-secondary">{i.countryCode}</span>}
                </span>
                <span className="text-title-md font-bold">{fmt(i.employees)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full rounded-full" style={{ width: pct(i.employees, total), background: isUnknown ? "#ba1a1a" : C.container }} />
              </div>
              <div className={`mt-1 text-body-sm ${isUnknown ? "font-semibold text-error" : "text-secondary"}`}>
                {pct(i.employees, total)} of workforce{isUnknown ? " · needs data remediation" : ""}
              </div>
            </div>
          );
        })}
        {unknown > 0 && (
          <p className="flex items-start gap-1.5 text-body-sm text-secondary">
            <Icon name="info" size={16} className="text-primary" />
            {fmt(unknown)} employees have no resolvable country and can't be plotted.
          </p>
        )}
      </div>
    </div>
  );
}
