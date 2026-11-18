import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis } from "recharts";
import { EP } from "../api/client";
import { useApi, usePaging } from "../hooks/useApi";
import { Async, Card, CardHeader, ChartTip, Collapsible, Icon, PageHeader, Pagination, Pill, SearchBox } from "../components/ui";
import { CAT_COLORS, C, catColor, catShort, fmt } from "../lib/format";

/* ---------- Infotype categories ---------- */
function CategoryChart({ state }) {
  return (
    <Card>
      <CardHeader icon="bar_chart" title="Infotypes by Category" subtitle="Number of infotypes in each SAP number range." />
      <Async state={state} minHeight={320}>
        {(d) => (
          <>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={d.items} layout="vertical" margin={{ right: 40 }}>
                  <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="category" width={170} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} content={<ChartTip render={(p) => <><b>{p.category}</b><br />Range {p.range ?? "n/a"}<br />{fmt(p.infotypeCount)} infotypes</>} />} />
                  <Bar dataKey="infotypeCount" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {d.items.map((i) => <Cell key={i.category} fill={catColor(i.category)} />)}
                    <LabelList dataKey="infotypeCount" position="right" fontSize={11} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-body-sm text-secondary">Total infotypes: <b className="text-on-surface">{fmt(d.total)}</b></div>
          </>
        )}
      </Async>
    </Card>
  );
}

/* ---------- Subtype treemap ---------- */
function TreeCell(props) {
  const { x, y, width, height, name, value, fill } = props;
  if (width < 2 || height < 2 || !name) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={1.5} rx={2} />
      {width > 38 && height > 22 && (
        <text x={x + 5} y={y + 14} fill="#fff" fontSize={11} fontWeight={700} fontFamily="monospace">{name}</text>
      )}
      {width > 38 && height > 38 && (
        <text x={x + 5} y={y + 28} fill="rgba(255,255,255,.85)" fontSize={10}>{fmt(value)}</text>
      )}
    </g>
  );
}

function SubtypeTreemap({ state, descMap }) {
  const [cat, setCat] = useState("all");
  const [top, setTop] = useState(120);
  return (
    <Card>
      <CardHeader icon="account_tree" title="Subtype Density by Infotype"
        subtitle="Treemap: each block is an infotype, sized by its number of subtypes and coloured by category."
        right={
          <Async state={state} minHeight={0}>
            {(d) => (
              <>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded bg-surface-container px-2 py-1 text-body-sm">
                  <option value="all">All categories</option>
                  {[...new Set(d.items.map((i) => i.category))].map((c) => <option key={c} value={c}>{catShort(c)}</option>)}
                </select>
                <select value={top} onChange={(e) => setTop(Number(e.target.value))} className="rounded bg-surface-container px-2 py-1 text-body-sm">
                  {[40, 120, 250, 0].map((n) => <option key={n} value={n}>{n ? `Top ${n}` : "All"}</option>)}
                </select>
              </>
            )}
          </Async>
        } />
      <Async state={state} minHeight={420}>
        {(d) => {
          const all = d.items.filter((i) => (cat === "all" || i.category === cat) && i.subtypeCount > 0).sort((a, b) => b.subtypeCount - a.subtypeCount);
          const shown = top ? all.slice(0, top) : all;
          const restItems = top ? all.slice(top) : [];
          const data = shown.map((i) => ({ name: i.infotype, value: i.subtypeCount, category: i.category, fill: catColor(i.category) }));
          if (restItems.length) data.push({ name: "…", value: restItems.reduce((s, i) => s + i.subtypeCount, 0), category: `${restItems.length} smaller infotypes`, fill: "#bcc7de" });
          return (
            <>
              <div className="h-[460px]">
                <ResponsiveContainer>
                  <Treemap data={data} dataKey="value" aspectRatio={1.9} isAnimationActive={false} content={<TreeCell />}>
                    <Tooltip content={<ChartTip render={(p) => (
                      <>
                        <b className="font-mono">{p.name === "…" ? "Others" : `IT${p.name}`}</b>{descMap[p.name] ? ` · ${descMap[p.name]}` : ""}<br />
                        {p.category}<br />{fmt(p.value)} subtypes
                      </>
                    )} />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-body-sm text-secondary">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(CAT_COLORS).filter(([c]) => d.items.some((i) => i.category === c)).map(([c, col]) => (
                    <span key={c} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: col }} />{catShort(c)}</span>
                  ))}
                </div>
                <span>{fmt(all.length)} infotypes with subtypes · <b className="text-on-surface">{fmt(d.totalSubtypes)}</b> subtypes in total</span>
              </div>
            </>
          );
        }}
      </Async>
    </Card>
  );
}

/* ---------- Four process tiles ---------- */
const TILES = [
  { to: "/personnel-administration", icon: "badge", title: "Personnel Administration", sub: "Core PA infotypes, screens & dynamic actions", cat: "Personnel Administration (PA)", accent: "border-primary", tone: "text-primary", chipBg: "bg-primary/10", cta: "Open PA Assessment" },
  { to: "/organizational-management", icon: "lan", title: "Organizational Management", sub: "OM objects, relationships & hierarchy", cat: "Organizational Management (OM)", accent: "border-tertiary-container", tone: "text-tertiary-container", chipBg: "bg-tertiary/10", cta: "Open OM Architecture" },
  { to: "/payroll-accounting", icon: "payments", title: "Payroll Accounting", sub: "Payroll clusters, wage types & schemas", accent: "border-secondary", tone: "text-secondary", chipBg: "bg-secondary/10", cta: "Open Payroll Assessment" },
  { to: "/time-management", icon: "more_time", title: "Time Management", sub: "Absences, quotas & time evaluation", cat: "Time Management (TM)", accent: "border-emerald-700", tone: "text-emerald-800", chipBg: "bg-emerald-700/10", cta: "Open Time Management" },
];

function Tiles({ state }) {
  const counts = Object.fromEntries((state.data?.items || []).map((i) => [i.category, i.infotypeCount]));
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TILES.map((t) => (
        <Link key={t.to} to={t.to} className={`group flex min-h-[210px] flex-col justify-between rounded-xl border-t-2 bg-surface-container-lowest p-5 shadow-sm transition-all hover:shadow-md ${t.accent}`}>
          <div className="flex flex-col gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${t.chipBg} ${t.tone}`}><Icon name={t.icon} size={26} /></div>
            <div>
              <div className={`text-title-lg font-semibold transition-colors`}>{t.title}</div>
              <p className="mt-1 text-body-sm text-secondary">{t.sub}</p>
            </div>
            {t.cat && (
              <div className="rounded-lg bg-surface-container-low py-2 text-center">
                <div className="text-title-lg font-bold">{state.data ? fmt(counts[t.cat] ?? 0) : "…"}</div>
                <div className="text-label-xs uppercase text-secondary">Infotypes in range</div>
              </div>
            )}
          </div>
          <div className={`mt-4 flex items-center justify-between border-t border-surface-container pt-3 text-title-md font-semibold ${t.tone}`}>
            <span>{t.cta}</span>
            <Icon name="arrow_forward" size={18} className="transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Catalogue table ---------- */
function InfotypeTable({ state }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [withSub, setWithSub] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const items = state.data?.items;
  const cats = useMemo(() => [...new Set((items || []).map((i) => i.category))], [items]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter((i) =>
      (cat === "all" || i.category === cat) && (!withSub || i.noOfSubtypes > 0) &&
      (!s || i.infotype.includes(s) || (i.infotypeText || "").toLowerCase().includes(s)));
  }, [items, q, cat, withSub]);
  const pg = usePaging(filtered, pageSize);

  return (
    <Collapsible icon="view_list" title="Infotype Catalogue" subtitle="Every infotype with its subtype count, category and description."
      right={<Pill className="bg-surface-container-high text-on-surface">{fmt(filtered.length)} shown</Pill>}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search code or description…" className="w-64" />
        <div className="flex flex-wrap gap-1">
          {["all", ...cats].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-label-xs font-bold uppercase ${cat === c ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-highest"}`}>
              {c === "all" ? "All" : catShort(c)}
            </button>
          ))}
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-body-sm text-secondary">
          <input type="checkbox" checked={withSub} onChange={(e) => setWithSub(e.target.checked)} /> Only with subtypes
        </label>
      </div>
      <Async state={state} minHeight={320}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    <th className="px-4 py-2">Infotype</th><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-center">Category</th><th className="px-3 py-2 text-center">Subtypes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-body-md">
                  {pg.slice.map((i) => (
                    <tr key={i.infotype} className="hover:bg-surface-container-low/70">
                      <td className="px-4 py-2.5 font-mono font-bold" style={{ color: catColor(i.category) }}>IT{i.infotype}</td>
                      <td className="px-3 py-2.5 font-semibold">{i.infotypeText || "—"}</td>
                      <td className="px-3 py-2.5 text-center"><span className="rounded px-2 py-0.5 text-label-xs font-bold text-white" style={{ background: catColor(i.category) }}>{catShort(i.category)}</span></td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold">{i.noOfSubtypes ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-label-xs text-blue-900">{fmt(i.noOfSubtypes)}</span> : 0}</td>
                    </tr>
                  ))}
                  {!pg.slice.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-secondary">No infotypes match your filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="infotypes" pageSizes={[15, 30, 50, 100]} pageSize={pageSize} onPageSize={setPageSize} />
          </>
        )}
      </Async>
    </Collapsible>
  );
}

/* ---------- Page ---------- */
export default function CoreProcesses() {
  const cats = useApi(EP.infotypeCategories);
  const subs = useApi(EP.subtypesPerInfotype);
  const detail = useApi(EP.infotypeDetail);
  const descMap = useMemo(() => Object.fromEntries((detail.data?.items || []).map((i) => [i.infotype, i.infotypeText])), [detail.data]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Process architecture" title="HCM Core Processes" meta={cats.meta}
        subtitle="Infotype inventory, subtype density and the four core HR process areas targeting SuccessFactors Employee Central." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-5"><CategoryChart state={cats} /></div>
        <div className="xl:col-span-7"><SubtypeTreemap state={subs} descMap={descMap} /></div>
      </div>
      <Tiles state={cats} />
      <InfotypeTable state={detail} />
    </div>
  );
}
