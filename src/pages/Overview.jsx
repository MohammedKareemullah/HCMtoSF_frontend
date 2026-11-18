import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EP } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Async, Card, CardHeader, ChartTip, Chip, Collapsible, Icon, Kpi, PageHeader, Pagination, Pill, SearchBox } from "../components/ui";
import WorldMap from "../components/WorldMap";
import { C, MONTHS, PALETTE, fmt, pct } from "../lib/format";

const STATUS_COLORS = { Active: C.container, Inactive: C.secondary, Retiree: C.tertiary, Withdrawn: C.slate };

/* ---------- Status bar chart ---------- */
function StatusChart({ state }) {
  return (
    <Card>
      <CardHeader icon="badge" title="Employee Status Breakdown" subtitle="Employment status derived from Infotype 0000 (STAT2)." />
      <Async state={state} minHeight={300}>
        {(d) => (
          <>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={d.items} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e6e8ea" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={36} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} content={<ChartTip render={(p) => <><b>{p.label}</b> (STAT2 = {p.code})<br />{fmt(p.employees)} employees · {pct(p.employees, d.total)}</>} />} />
                  <Bar dataKey="employees" radius={[4, 4, 0, 0]} maxBarSize={80}>
                    {d.items.map((i) => <Cell key={i.code} fill={STATUS_COLORS[i.label] || C.slate} />)}
                    <LabelList dataKey="employees" position="top" fontSize={12} fontWeight={700} formatter={fmt} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {d.items.map((i) => (
                <div key={i.code} className="rounded-lg bg-surface p-2">
                  <div className="flex items-center gap-1.5 text-body-sm text-secondary"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[i.label] || C.slate }} />{i.label} <span className="font-mono text-[10px]">STAT2={i.code}</span></div>
                  <div className="text-title-md font-bold">{fmt(i.employees)} <span className="text-body-sm font-normal text-secondary">{pct(i.employees, d.total)}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </Async>
    </Card>
  );
}

/* ---------- Company-code pie ---------- */
function CompanyPie({ state }) {
  const TOP = 8;
  return (
    <Card>
      <CardHeader icon="pie_chart" title="Company Code Distribution" subtitle="Headcount share by company code / legal entity." />
      <Async state={state} minHeight={300}>
        {(d) => {
          const sorted = [...d.items].sort((a, b) => b.employees - a.employees);
          const known = sorted.filter((i) => i.companyCode);
          const unknown = sorted.filter((i) => !i.companyCode).reduce((s, i) => s + i.employees, 0);
          const head = known.slice(0, TOP).map((i, idx) => ({ name: i.label, value: i.employees, fill: PALETTE[idx % PALETTE.length] }));
          const rest = known.slice(TOP).reduce((s, i) => s + i.employees, 0);
          const slices = [...head];
          if (rest) slices.push({ name: `Others (${known.length - TOP})`, value: rest, fill: "#bcc7de" });
          if (unknown) slices.push({ name: "Unknown", value: unknown, fill: C.slate });
          return (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-56 w-56 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={slices} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="95%" paddingAngle={1} stroke="none">
                      {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTip render={(p) => <><b>{p.name}</b><br />{fmt(p.value)} employees · {pct(p.value, d.total)}</>} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-headline-md font-bold">{fmt(d.total)}</span>
                  <span className="text-label-xs font-semibold uppercase text-secondary">Employees</span>
                </div>
              </div>
              <div className="thin-scroll max-h-56 w-full overflow-y-auto pr-1">
                {slices.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-2 py-1 text-body-sm">
                    <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.fill }} /><span className="truncate font-semibold">{s.name}</span></span>
                    <span className="shrink-0 font-bold">{pct(s.value, d.total)} <span className="font-normal text-secondary">({fmt(s.value)})</span></span>
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

/* ---------- Payroll calendar heat-map ---------- */
function PayrollCalendar({ state }) {
  return (
    <Collapsible icon="calendar_month" title="Monthly Payroll Employee Volume" subtitle="Employees processed in payroll for each calendar month (cluster RX periods)." defaultOpen>
      <Async state={state} minHeight={200}>
        {(d) => <PayrollGrid items={d.items} />}
      </Async>
    </Collapsible>
  );
}

function PayrollGrid({ items }) {
  const { years, grid, max, unspecified } = useMemo(() => {
    const grid = {}; let max = 0, unspecified = 0;
    items.forEach((i) => {
      if (!i.year || i.year < 1900 || i.month < 1 || i.month > 12) { unspecified += i.employees; return; }
      (grid[i.year] ||= {})[i.month] = i.employees;
      max = Math.max(max, i.employees);
    });
    return { years: Object.keys(grid).map(Number).sort((a, b) => b - a), grid, max, unspecified };
  }, [items]);
  const [view, setView] = useState("calendar");
  const flat = years.slice().reverse().flatMap((y) => MONTHS.map((m, idx) => ({ label: `${m} ${String(y).slice(2)}`, employees: grid[y][idx + 1] ?? 0 })));

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-surface-container-low p-0.5">
          {[["calendar", "Calendar"], ["bars", "Bars"]].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} className={`rounded px-3 py-1 text-label-md ${view === k ? "bg-white shadow-sm" : "text-secondary"}`}>{l}</button>
          ))}
        </div>
        {unspecified > 0 && <Pill className="bg-amber-50 text-amber-800">{fmt(unspecified)} with no valid period (0000-00)</Pill>}
      </div>
      {view === "calendar" ? (
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-center">
            <thead>
              <tr>
                <th className="w-14" />
                {MONTHS.map((m) => <th key={m} className="text-label-xs font-bold uppercase text-secondary">{m}</th>)}
                <th className="text-label-xs font-bold uppercase text-secondary">Peak</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => {
                const peak = Math.max(...Object.values(grid[y]));
                return (
                  <tr key={y}>
                    <td className="text-title-md font-semibold text-secondary">{y}</td>
                    {MONTHS.map((m, idx) => {
                      const v = grid[y][idx + 1];
                      const a = v ? 0.18 + 0.82 * (v / max) : 0;
                      return (
                        <td key={m} title={v ? `${m} ${y}: ${fmt(v)} employees` : `${m} ${y}: no run`}
                          className="h-12 rounded-md text-title-md font-bold"
                          style={v ? { background: `rgba(139,29,36,${a.toFixed(2)})`, color: a > 0.5 ? "#fff" : "#191c1e" } : { background: "#f2f4f6", color: "#bcc7de" }}>
                          {v ?? "–"}
                        </td>
                      );
                    })}
                    <td className="text-title-md font-bold text-primary">{fmt(peak)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={flat}>
              <CartesianGrid vertical={false} stroke="#e6e8ea" />
              <XAxis dataKey="label" fontSize={10} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,0,0,.04)" }} />
              <Bar dataKey="employees" name="Employees" fill={C.container} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 flex items-center justify-end gap-2 text-body-sm text-secondary">
        Fewer <span className="h-3 w-24 rounded" style={{ background: "linear-gradient(90deg, rgba(139,29,36,.18), rgba(139,29,36,1))" }} /> More
      </div>
    </>
  );
}

/* ---------- Hires charts ---------- */
function HiresCharts({ state }) {
  const [year, setYear] = useState("all");
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader icon="trending_up" title="Hires per Year" subtitle="Hire actions (Infotype 0000) per calendar year." />
        <Async state={state} minHeight={280}>
          {(d) => {
            const map = Object.fromEntries(d.byYear.map((y) => [y.year, y.hires]));
            const ys = d.byYear.map((y) => y.year);
            const data = ys.length ? Array.from({ length: Math.max(...ys) - Math.min(...ys) + 1 }, (_, i) => { const y = Math.min(...ys) + i; return { year: String(y), hires: map[y] ?? 0 }; }) : [];
            const peak = data.reduce((b, x) => (x.hires > (b?.hires ?? -1) ? x : b), null);
            return (
              <>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 20, right: 8 }}>
                      <CartesianGrid vertical={false} stroke="#e6e8ea" />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} content={<ChartTip />} />
                      <Bar dataKey="hires" name="Hires" radius={[4, 4, 0, 0]} maxBarSize={56}>
                        {data.map((x) => <Cell key={x.year} fill={x.year === peak?.year ? C.container : C.secondary} />)}
                        <LabelList dataKey="hires" position="top" fontSize={11} fontWeight={700} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-between text-body-sm text-secondary">
                  <span>{peak ? <>Peak: <b className="text-on-surface">{peak.year}</b> ({fmt(peak.hires)} hires)</> : "No hires recorded"}</span>
                  <span>Total hires: <b className="text-on-surface">{fmt(d.total)}</b></span>
                </div>
              </>
            );
          }}
        </Async>
      </Card>

      <Card>
        <CardHeader icon="flag" title="Hires per Country" subtitle="Hire actions grouped by country."
          right={
            <Async state={state} minHeight={0}>
              {(d) => (
                <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded bg-surface-container px-2 py-1 text-body-sm">
                  <option value="all">All years</option>
                  {[...new Set(d.byCountry.map((r) => r.year))].sort().map((y) => <option key={y}>{y}</option>)}
                </select>
              )}
            </Async>
          } />
        <Async state={state} minHeight={280}>
          {(d) => {
            const agg = {};
            d.byCountry.filter((r) => year === "all" || String(r.year) === year).forEach((r) => { agg[r.country] = (agg[r.country] || 0) + r.hires; });
            const data = Object.entries(agg).map(([country, hires]) => ({ country, hires })).sort((a, b) => b.hires - a.hires);
            const total = data.reduce((s, x) => s + x.hires, 0);
            return (
              <>
                <div style={{ height: Math.max(220, data.length * 36 + 20) }}>
                  <ResponsiveContainer>
                    <BarChart data={data} layout="vertical" margin={{ right: 36 }}>
                      <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis type="category" dataKey="country" width={96} tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} content={<ChartTip />} />
                      <Bar dataKey="hires" name="Hires" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {data.map((x) => <Cell key={x.country} fill={x.country === "Unknown" ? C.slate : C.container} />)}
                        <LabelList dataKey="hires" position="right" fontSize={11} fontWeight={700} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-body-sm text-secondary">Hires shown: <b className="text-on-surface">{fmt(total)}</b>{year !== "all" && ` in ${year}`}</div>
              </>
            );
          }}
        </Async>
      </Card>
    </div>
  );
}

/* ---------- Employee table (server-side pagination) ---------- */
function EmployeeTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const state = useApi(EP.employees, { page, pageSize });
  return (
    <Collapsible icon="table_rows" title="Master Employee Records" subtitle="Personnel number, country and organisational assignment (Infotype 0001)."
      right={<SearchBox value={q} onChange={setQ} placeholder="Filter this page…" className="hidden w-56 sm:block" />}>
      <Async state={state} minHeight={300}>
        {(d) => {
          const rows = d.items.filter((r) => !q || Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()));
          return (
            <>
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="bg-surface text-label-xs font-bold uppercase tracking-wider text-secondary">
                      {["Emp ID", "Country", "Company Code", "Company Name", "Payroll Area", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-body-sm">
                    {rows.map((r) => {
                      const missing = !r.countryCode || !r.companyCode;
                      return (
                        <tr key={r.pernr} className={missing ? "bg-error-container/20" : "hover:bg-surface-container-low"}>
                          <td className="px-3 py-2 font-mono font-semibold">{r.pernr}</td>
                          <td className="px-3 py-2">{r.countryCode ? <span className="font-semibold">{r.countryCode} <span className="font-normal text-secondary">· {r.country}</span></span> : <span className="inline-flex items-center gap-1 font-semibold text-error"><Icon name="warning" size={14} />Unknown</span>}</td>
                          <td className="px-3 py-2 font-mono text-secondary">{r.companyCode ?? "—"}</td>
                          <td className="px-3 py-2 font-medium">{r.companyName ?? "—"}</td>
                          <td className="px-3 py-2 text-secondary">{r.payrollArea ?? "—"}</td>
                          <td className="px-3 py-2"><Pill className={r.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-secondary"}>{r.status}</Pill></td>
                        </tr>
                      );
                    })}
                    {!rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-secondary">No matching records on this page.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pagination page={d.page} pageCount={d.totalPages} total={fmt(d.total)} unit="employees"
                from={(d.page - 1) * d.pageSize + 1} to={Math.min(d.page * d.pageSize, d.total)}
                onChange={setPage} pageSizes={[10, 25, 50]} pageSize={pageSize} onPageSize={(s) => { setPageSize(s); setPage(1); }} />
            </>
          );
        }}
      </Async>
    </Collapsible>
  );
}

/* ---------- Page ---------- */
export default function Overview() {
  const status = useApi(EP.statusSummary);
  const country = useApi(EP.byCountry);
  const company = useApi(EP.byCompanyCode);
  const payroll = useApi(EP.payrollByMonth);
  const hires = useApi(EP.hiresPerYear);

  const knownCountries = country.data?.items.filter((i) => i.countryCode).length;
  const knownCompanies = company.data?.items.filter((i) => i.companyCode).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Employee Overview"
        subtitle="Track Employee Distribution across different modules for optimizied SucessFactors Licensing."
        meta={status.meta} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total employees" icon="groups" value={fmt(status.data?.total)} hint="across all entites" />
        <Kpi label="Countries" icon="public" value={fmt(knownCountries)} accent="bg-tertiary-container" hint={`${fmt(country.data?.items.find((i) => !i.countryCode)?.employees ?? 0)} with unknown country`} />
        <Kpi label="Company codes" icon="domain" value={fmt(knownCompanies)} accent="bg-primary" hint={`${fmt(company.data?.items.find((i) => !i.companyCode)?.employees ?? 0)} unassigned`} />
        <Kpi label="Total hires" icon="person_add" value={fmt(hires.data?.total)} accent="bg-secondary" hint="across all countries" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <StatusChart state={status} />
        <CompanyPie state={company} />
      </div>

      <Card>
        <CardHeader icon="public" title="Geographic Distribution & Country Scope" subtitle="Employees per country; employees without a country are shown separately." />
        <Async state={country} minHeight={380}>
          {(d) => <WorldMap items={d.items} total={d.total} />}
        </Async>
      </Card>

      <PayrollCalendar state={payroll} />
      <HiresCharts state={hires} />
      <EmployeeTable />
    </div>
  );
}
