import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EP } from "../api/client";
import { useApi, usePaging } from "../hooks/useApi";
import { Async, Card, CardHeader, ChartTip, Chip, Icon, Kpi, PageHeader, Pagination, Pill, SearchBox } from "../components/ui";
import { C, fmt, pct } from "../lib/format";

const CLASS_COLORS = { "Universal Standard": C.tertiary, "Country Specific": C.secondary, Others: C.container };

/* ---------- Screen classification bar charts ---------- */
function ClassificationChart({ state, title, subtitle, icon, screenKey }) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle} />
      <Async state={state} minHeight={300}>
        {(d) => {
          const screens = {};
          d.items.forEach((i) => { screens[i[screenKey]] = (screens[i[screenKey]] || 0) + 1; });
          const topScreens = Object.entries(screens).sort((a, b) => b[1] - a[1]).slice(0, 6);
          return (
            <>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={d.summary} margin={{ top: 22, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="#e6e8ea" />
                    <XAxis dataKey="classification" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={40} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} content={<ChartTip render={(p) => <><b>{p.classification}</b><br />{fmt(p.count)} infotypes · {pct(p.count, d.total)}</>} />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={90}>
                      {d.summary.map((s) => <Cell key={s.classification} fill={CLASS_COLORS[s.classification] || C.slate} />)}
                      <LabelList dataKey="count" position="top" fontSize={12} fontWeight={700} formatter={fmt} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-body-sm text-secondary">
                <span>Screen numbers:</span>
                {topScreens.map(([s, n]) => <Chip key={s}>{s} · {fmt(n)}</Chip>)}
                <span className="ml-auto">{fmt(d.total)} infotypes</span>
              </div>
            </>
          );
        }}
      </Async>
    </Card>
  );
}

/* ---------- Field visibility table ---------- */
const COLS = [
  ["infotype", "Infotype"], ["hidden", "Hidden"], ["displayOnly", "Display only"], ["required", "Required"], ["optional", "Optional"], ["total", "Total fields"],
];

function FieldVisibility({ state }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "total", dir: "desc" });
  const rows = useMemo(() => {
    const items = (state.data?.items || []).map((i) => ({ ...i, total: i.hidden + i.displayOnly + i.required + i.optional }));
    const s = q.trim().toLowerCase();
    const f = items.filter((i) => !s || i.infotype.includes(s));
    return f.sort((a, b) => {
      const r = sort.key === "infotype" ? a.infotype.localeCompare(b.infotype) : a[sort.key] - b[sort.key];
      return sort.dir === "asc" ? r : -r;
    });
  }, [state.data, q, sort]);
  const pg = usePaging(rows, 10);
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "infotype" ? "asc" : "desc" }));

  return (
    <Card className="overflow-hidden">
      <CardHeader icon="view_column" title="Infotype Field Visibility (T588M)" subtitle="Hidden / display-only / required / optional field counts per infotype. Click a column to sort."
        right={<SearchBox value={q} onChange={setQ} placeholder="Filter infotype (e.g. 0008)…" />} />
      <Async state={state} minHeight={380}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    {COLS.map(([k, l]) => (
                      <th key={k} onClick={() => toggle(k)} className={`cursor-pointer select-none px-4 py-2.5 hover:text-primary ${k === "infotype" ? "" : "text-center"}`}>
                        {l}{sort.key === k && <Icon name={sort.dir === "asc" ? "arrow_upward" : "arrow_downward"} size={12} className="ml-0.5 align-middle" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-body-md">
                  {pg.slice.map((r) => (
                    <tr key={r.infotype} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2.5"><Chip className="text-primary">IT{r.infotype}</Chip></td>
                      <td className="px-4 py-2.5 text-center text-secondary">{fmt(r.hidden)}</td>
                      <td className="px-4 py-2.5 text-center text-secondary">{fmt(r.displayOnly)}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-primary-container">{fmt(r.required)}</td>
                      <td className="px-4 py-2.5 text-center text-secondary">{fmt(r.optional)}</td>
                      <td className="px-4 py-2.5 text-center font-bold">{fmt(r.total)}</td>
                    </tr>
                  ))}
                  {!pg.slice.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary">No infotypes match.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="infotypes" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ---------- Dynamic actions per infotype ---------- */
function DynamicActionBars({ state }) {
  const [metric, setMetric] = useState("dynamicCount");
  const [top, setTop] = useState(15);
  return (
    <Card>
      <CardHeader icon="equalizer" title="Dynamic Actions per Infotype" subtitle="Infotypes whose T588Z rules fire the most dynamic actions."
        right={
          <>
            <div className="flex gap-1 rounded-lg bg-surface-container-low p-0.5">
              {[["dynamicCount", "Actions"], ["dynamicActionSeqCount", "Sequences"]].map(([k, l]) => (
                <button key={k} onClick={() => setMetric(k)} className={`rounded px-2.5 py-1 text-label-md ${metric === k ? "bg-white shadow-sm" : "text-secondary"}`}>{l}</button>
              ))}
            </div>
            <select value={top} onChange={(e) => setTop(Number(e.target.value))} className="rounded bg-surface-container px-2 py-1 text-body-sm">
              {[10, 15, 25, 40].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </>
        } />
      <Async state={state} minHeight={420}>
        {(d) => {
          const data = [...d.items].sort((a, b) => b[metric] - a[metric]).slice(0, top).map((i) => ({ ...i, label: `IT${i.infotype}` }));
          return (
            <>
              <div style={{ height: Math.max(260, data.length * 28 + 24) }}>
                <ResponsiveContainer>
                  <BarChart data={data} layout="vertical" margin={{ right: 44 }}>
                    <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis type="category" dataKey="label" width={62} tickLine={false} axisLine={false} fontSize={12} fontFamily="monospace" />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} content={<ChartTip render={(p) => <><b>{p.label}</b><br />{fmt(p.dynamicCount)} dynamic actions<br />{fmt(p.dynamicActionSeqCount)} action sequences</>} />} />
                    <Bar dataKey={metric} radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {data.map((x, i) => <Cell key={x.infotype} fill={i < 3 ? C.primary : i < 8 ? C.container : C.secondary} />)}
                      <LabelList dataKey={metric} position="right" fontSize={11} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 text-body-sm text-secondary">
                {fmt(d.total)} infotypes carry dynamic actions · {fmt(d.totalActions)} action sequences in T588Z
              </div>
            </>
          );
        }}
      </Async>
    </Card>
  );
}

/* ---------- Dependency matrix ---------- */
function DependencyMatrix({ state }) {
  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({});
  const items = useMemo(() => [...(state.data?.items || [])].sort((a, b) => b.targetInfotypes.length - a.targetInfotypes.length || a.infotype.localeCompare(b.infotype)), [state.data]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((i) => !s || i.infotype.includes(s) || i.targetInfotypes.some((t) => t.includes(s)));
  }, [items, q]);
  const pg = usePaging(filtered, 8);

  const matrix = useMemo(() => {
    const src = items.slice(0, 15);
    const cols = [...new Set(src.flatMap((s) => s.targetInfotypes))].sort();
    return { src, cols };
  }, [items]);

  return (
    <Card>
      <CardHeader icon="schema" title="Dynamic Action Dependency Matrix" subtitle="Which other infotypes get created / changed / deleted when an infotype is maintained (T588Z)."
        right={
          <>
            <SearchBox value={q} onChange={setQ} placeholder="Search infotype…" className="w-44" />
            <div className="flex gap-1 rounded-lg bg-surface-container-low p-0.5">
              {[["list", "List"], ["matrix", "Matrix"]].map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} className={`rounded px-2.5 py-1 text-label-md ${view === k ? "bg-white shadow-sm" : "text-secondary"}`}>{l}</button>
              ))}
            </div>
          </>
        } />
      <Async state={state} minHeight={420}>
        {(d) => view === "list" ? (
          <>
            <div className="flex flex-col gap-2">
              {pg.slice.map((r) => {
                const expanded = open[r.infotype];
                const shown = expanded ? r.targetInfotypes : r.targetInfotypes.slice(0, 10);
                return (
                  <div key={r.infotype} className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 items-center gap-2 sm:w-36">
                      <span className="rounded bg-primary px-2.5 py-1 font-mono text-label-xs font-bold text-on-primary">IT{r.infotype}</span>
                      <span className="text-body-sm text-secondary">affects <b className="text-on-surface">{r.targetInfotypes.length}</b></span>
                    </div>
                    <Icon name="trending_flat" size={18} className="hidden text-secondary sm:block" />
                    <div className="flex flex-wrap items-center gap-1">
                      {shown.map((t) => <span key={t} className="rounded bg-white px-2 py-0.5 font-mono text-label-xs font-semibold">IT{t}</span>)}
                      {r.targetInfotypes.length > 10 && (
                        <button onClick={() => setOpen((o) => ({ ...o, [r.infotype]: !expanded }))} className="rounded px-2 py-0.5 text-label-xs font-bold text-primary hover:underline">
                          {expanded ? "Show less" : `+${r.targetInfotypes.length - 10} more`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!pg.slice.length && <p className="py-8 text-center text-body-md text-secondary">No dependencies match.</p>}
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="infotypes" />
          </>
        ) : (
          <>
            <p className="mb-2 text-body-sm text-secondary">Top {matrix.src.length} triggering infotypes (rows) vs. every infotype they affect (columns). A filled cell means the row's dynamic action touches that infotype.</p>
            <div className="thin-scroll max-h-[520px] overflow-auto rounded-lg">
              <table className="border-separate border-spacing-0.5 text-center">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-20 bg-surface-container-lowest px-2 text-left text-label-xs font-bold uppercase text-secondary">Source ↓ / Target →</th>
                    {matrix.cols.map((c) => (
                      <th key={c} className="sticky top-0 z-10 bg-surface-container-lowest pb-1 font-mono text-[10px] font-semibold text-secondary" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 44 }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.src.map((s) => {
                    const set = new Set(s.targetInfotypes);
                    return (
                      <tr key={s.infotype}>
                        <td className="sticky left-0 z-10 bg-surface-container-lowest px-2 text-left"><Chip className="text-primary">IT{s.infotype}</Chip></td>
                        {matrix.cols.map((c) => (
                          <td key={c} title={set.has(c) ? `IT${s.infotype} → IT${c}` : ""} className="h-5 w-5 min-w-[20px] rounded-sm"
                            style={{ background: set.has(c) ? (c === s.infotype ? C.tertiary : C.container) : "#f2f4f6" }} />
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-body-sm text-secondary">{fmt(d.total)} infotypes trigger other infotypes in total; the list view covers all of them.</div>
          </>
        )}
      </Async>
    </Card>
  );
}

/* ---------- Operation donut ---------- */
const OP_GROUPS = [
  { key: "Create", match: (o) => o === "04", color: C.tertiary },
  { key: "Change", match: (o) => o === "02", color: C.container },
  { key: "Change & create", match: (o) => o === "06", color: C.teal },
  { key: "Delete", match: (o) => o === "08", color: C.secondary },
  { key: "Independent", match: (o) => o === "00", color: "#bcc7de" },
  { key: "Change & delete", match: (o) => o === "10", color: C.amber },
];

function OperationPie({ state }) {
  return (
    <Card>
      <CardHeader icon="donut_large" title="Dynamic Actions by Operation" subtitle="Number of dynamic actions per triggering operation (T588Z operation code)." />
      <Async state={state} minHeight={320}>
        {(d) => {
          const used = new Set();
          const slices = OP_GROUPS.map((g) => {
            const rows = d.items.filter((i) => g.match(i.operation));
            rows.forEach((r) => used.add(r.operation));
            return { name: g.key, value: rows.reduce((s, r) => s + r.dynamicActionCount, 0), seq: rows.reduce((s, r) => s + r.dynamicActionSeqCount, 0), fill: g.color };
          }).filter((s) => s.value > 0);
          const unk = d.items.filter((i) => !used.has(i.operation));
          if (unk.length) slices.push({ name: "Unmapped codes", value: unk.reduce((s, r) => s + r.dynamicActionCount, 0), seq: unk.reduce((s, r) => s + r.dynamicActionSeqCount, 0), fill: C.slate, codes: unk.map((u) => u.operation).join(", ") });
          const total = slices.reduce((s, x) => s + x.value, 0);
          return (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-56 w-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={slices} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="96%" paddingAngle={1} stroke="none">
                      {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTip render={(p) => <><b>{p.name}</b>{p.codes ? ` (codes ${p.codes})` : ""}<br />{fmt(p.value)} actions · {pct(p.value, total)}<br />{fmt(p.seq)} sequences</>} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-label-xs font-bold uppercase text-secondary">Total</span>
                  <span className="text-headline-md font-bold">{fmt(total)}</span>
                  <span className="text-label-xs font-semibold text-primary">actions</span>
                </div>
              </div>
              <div className="w-full space-y-1.5">
                {slices.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded bg-surface-container-low p-2">
                    <span className="flex items-center gap-2 text-body-md font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: s.fill }} />{s.name}</span>
                    <span className="text-title-md font-bold">{pct(s.value, total)} <span className="ml-1 text-label-xs font-normal text-secondary">({fmt(s.value)})</span></span>
                  </div>
                ))}
              </div>
            </div>
          );
        }}
      </Async>
    </Card>
  );
}

/* ---------- ABAP routines table ---------- */
function RoutinesTable({ state }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({});
  const items = state.data?.items;
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter((i) => !s || i.infotype.includes(s) || i.routineNames.toLowerCase().includes(s));
  }, [items, q]);
  const pg = usePaging(filtered, 8);

  return (
    <Card className="overflow-hidden">
      <CardHeader icon="terminal" title="ABAP Routines Used by Dynamic Actions" subtitle="Function modules, includes and programs called from T588Z, grouped by infotype."
        right={<SearchBox value={q} onChange={setQ} placeholder="Search infotype or routine…" className="w-64" />} />
      <Async state={state} minHeight={380}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    <th className="px-4 py-2.5">Infotype</th><th className="px-3 py-2.5 text-center">Unique routines</th><th className="px-3 py-2.5 text-center">Dynamic actions</th><th className="px-3 py-2.5">ABAP routines</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-body-md">
                  {pg.slice.map((r) => {
                    const names = r.routineNames ? r.routineNames.split(",").map((n) => n.trim()).filter(Boolean) : [];
                    const expanded = open[r.infotype];
                    const shown = expanded ? names : names.slice(0, 6);
                    return (
                      <tr key={r.infotype} className="align-top hover:bg-surface-container-low">
                        <td className="px-4 py-3"><Chip className="text-primary">IT{r.infotype}</Chip></td>
                        <td className="px-3 py-3 text-center font-bold">{fmt(r.uniqueRoutineCount)}</td>
                        <td className="px-3 py-3 text-center text-secondary">{fmt(r.totalDynamicActions)}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {shown.map((n) => <span key={n} className="rounded bg-surface-container px-2 py-0.5 font-mono text-label-xs font-bold">{n}</span>)}
                            {names.length > 6 && (
                              <button onClick={() => setOpen((o) => ({ ...o, [r.infotype]: !expanded }))} className="px-1 text-label-xs font-bold text-primary hover:underline">
                                {expanded ? "Show less" : `+${names.length - 6} more`}
                              </button>
                            )}
                            {!names.length && <span className="text-secondary">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!pg.slice.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-secondary">No routines match.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="infotypes" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ---------- Page ---------- */
export default function PersonnelAdmin() {
  const single = useApi(EP.singleScreen);
  const list = useApi(EP.listScreen);
  const fields = useApi(EP.fieldVisibility);
  const count = useApi(EP.dynActionCount);
  const triggers = useApi(EP.dynActionTriggers);
  const ops = useApi(EP.dynActionByOperation);
  const routines = useApi(EP.dynActionRoutines);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="SAP HCM discovery · T588M / T588Z diagnostics" title="Personnel Administration" meta={single.meta}
        subtitle="Screen classification, field status, dynamic-action cascades and ABAP logic for the PA infotypes." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Infotypes analysed" icon="view_list" value={fmt(single.data?.total)} hint="With a single-screen assignment" />
        <Kpi label="Infotypes w/ dynamic actions" icon="bolt" value={fmt(count.data?.total)} accent="bg-tertiary-container" hint="T588Z" />
        <Kpi label="Action sequences" icon="account_tree" value={fmt(count.data?.totalActions)} accent="bg-primary" hint="Total T588Z entries" />
        <Kpi label="Infotypes w/ ABAP routines" icon="terminal" value={fmt(routines.data?.total)} accent="bg-secondary" hint="Custom + standard routines" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ClassificationChart state={single} icon="web" screenKey="singleScreen" title="Single Screen Classification" subtitle="Infotypes by single-screen category (Universal Standard, Country Specific, Others)." />
        <ClassificationChart state={list} icon="list_alt" screenKey="listScreen" title="List Screen Classification" subtitle="Infotypes by list-screen category (Universal Standard, Country Specific, Others)." />
      </div>

      <FieldVisibility state={fields} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7"><DynamicActionBars state={count} /></div>
        <div className="xl:col-span-5"><OperationPie state={ops} /></div>
      </div>

      <DependencyMatrix state={triggers} />
      <RoutinesTable state={routines} />
    </div>
  );
}
