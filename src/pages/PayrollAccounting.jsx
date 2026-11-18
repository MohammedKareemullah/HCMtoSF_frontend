import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { EP } from "../api/client";
import { useApi, usePaging } from "../hooks/useApi";
import {
  Async, Card, CardHeader, ChartTip, Chip, Icon, Kpi, PageHeader,
  Pagination, Pill, SearchBox, SyncBadge,
} from "../components/ui";
import { C, fmt, pct } from "../lib/format";

/* ───────── colours ───────── */
const STD = C.tertiary;
const CUST = C.primary;

/* ════════════════════════════════════════════════════════
   Shared: Std vs Custom vertical bar chart
════════════════════════════════════════════════════════ */
function StdCustomBar({ title, subtitle, icon, stdKey, custKey, state, minH = 220 }) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle}
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={minH}>
        {(d) => {
          const stdVal = d[stdKey] ?? 0;
          const custVal = d[custKey] ?? 0;
          const total = d.total ?? stdVal + custVal;
          const data = [
            { label: "Standard", count: stdVal, fill: STD },
            { label: "Custom", count: custVal, fill: CUST },
          ];
          return (
            <>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={data} margin={{ top: 22, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="#e6e8ea" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={52} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                      content={<ChartTip render={(p) =>
                        <><b>{p.label}</b><br />{fmt(p.count)} · {pct(p.count, total)}</>} />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={80}>
                      {data.map((s) => <Cell key={s.label} fill={s.fill} />)}
                      <LabelList dataKey="count" position="top" fontSize={12} fontWeight={700} formatter={fmt} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STD }} />
                  Standard: <b className="text-on-surface">{fmt(stdVal)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CUST }} />
                  Custom: <b className="text-on-surface">{fmt(custVal)}</b>
                </span>
                <span className="ml-auto">Total: <b className="text-on-surface">{fmt(total)}</b></span>
              </div>
            </>
          );
        }}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Employees per Payroll Area – horizontal stacked (paginated)
════════════════════════════════════════════════════════ */
function EmployeesPerPayrollArea({ state }) {
  const PAGE = 8;
  const items = state.data?.items ?? [];
  const pg = usePaging(items, PAGE);

  return (
    <Card>
      <CardHeader icon="groups" title="Employee Count by Payroll Area"
        subtitle="Number of employees assigned to each payroll area (IT0001)."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={280}>
        {() => (
          <>
            <div style={{ height: Math.max(240, pg.slice.length * 36 + 32) }}>
              <ResponsiveContainer>
                <BarChart data={pg.slice} layout="vertical" margin={{ right: 56, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="payrollArea" width={36} tickLine={false} axisLine={false}
                    fontSize={11} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                    content={<ChartTip render={(p) =>
                      <><b>Area {p.payrollArea}</b><br />{fmt(p.noOfEmployees)} employees</>} />} />
                  <Bar dataKey="noOfEmployees" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {pg.slice.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? C.tertiary : C.container} />)}
                    <LabelList dataKey="noOfEmployees" position="right" fontSize={11} fontWeight={700} formatter={fmt} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="payroll areas" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Payroll Areas per Period Parameter (paginated)
════════════════════════════════════════════════════════ */
function PayrollAreasPerPeriod({ state }) {
  const PAGE = 7;
  const items = state.data?.items ?? [];
  const pg = usePaging(items, PAGE);

  return (
    <Card>
      <CardHeader icon="calendar_month" title="Payroll Areas per Period Parameter"
        subtitle="Count of payroll areas grouped under each period parameter (T549R)."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={280}>
        {() => (
          <>
            <div style={{ height: Math.max(240, pg.slice.length * 36 + 32) }}>
              <ResponsiveContainer>
                <BarChart data={pg.slice} layout="vertical" margin={{ right: 56, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="periodParameter" width={36} tickLine={false} axisLine={false}
                    fontSize={11} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                    content={<ChartTip render={(p) =>
                      <><b>{p.periodParameterText}</b><br />{fmt(p.noOfPayrollAreas)} payroll areas</>} />} />
                  <Bar dataKey="noOfPayrollAreas" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {pg.slice.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? C.amber : C.container} />)}
                    <LabelList dataKey="noOfPayrollAreas" position="right" fontSize={11} fontWeight={700} formatter={fmt} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="period parameters" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Company Features tiles + feature-functions table
════════════════════════════════════════════════════════ */
function CompanyFeatures({ summaryState, detailState }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (detailState.data?.items ?? []).filter((i) =>
      !s || i.feature?.toLowerCase().includes(s) || i.featureName?.toLowerCase().includes(s)
    );
  }, [detailState.data, q]);
  const pg = usePaging(rows, 8);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-tertiary-container" />
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-xs font-bold uppercase text-secondary">Standard Company Features</span>
            <Icon name="check_circle" className="text-secondary" />
          </div>
          <div className="text-metric-num text-on-surface">
            <Async state={summaryState} minHeight={40}>
              {(d) => fmt(d.stdCompanyFeatures)}
            </Async>
          </div>
          <div className="mt-1 text-body-sm text-secondary">SAP-delivered payroll features</div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary-container" />
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-xs font-bold uppercase text-secondary">Custom Company Features</span>
            <Icon name="tune" className="text-secondary" />
          </div>
          <div className="text-metric-num text-on-surface">
            <Async state={summaryState} minHeight={40}>
              {(d) => fmt(d.customCompanyFeatures)}
            </Async>
          </div>
          <div className="mt-1 text-body-sm text-secondary">Customer-defined FEAT entries</div>
        </div>
      </div>

      {/* Feature-functions table */}
      <Card className="overflow-hidden">
        <CardHeader icon="functions" title="Feature Functions List"
          subtitle="All features with their associated function module names."
          right={<SearchBox value={q} onChange={setQ} placeholder="Filter feature…" className="w-56" />} />
        <Async state={detailState} minHeight={340}>
          {() => (
            <>
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                      <th className="px-4 py-2.5">Feature</th>
                      <th className="px-4 py-2.5">Feature Name</th>
                      <th className="px-4 py-2.5">Function Name(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest text-body-md">
                    {pg.slice.map((r, i) => (
                      <tr key={i} className="hover:bg-surface-container-low">
                        <td className="px-4 py-2.5"><Chip className="text-primary">{r.feature}</Chip></td>
                        <td className="px-4 py-2.5 text-secondary max-w-xs truncate" title={r.featureName}>{r.featureName}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(r.functions ?? []).map((f) => (
                              <span key={f} className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-label-xs font-semibold">{f}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!pg.slice.length && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-secondary">No features match.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...pg} onChange={pg.setPage} unit="features" />
            </>
          )}
        </Async>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Wage Types per Country – bar chart (sorted)
════════════════════════════════════════════════════════ */
function WageTypesPerCountry({ state }) {
  const PAGE = 10;
  const items = useMemo(
    () => [...(state.data?.items ?? [])].sort((a, b) => b.noOfWageTypes - a.noOfWageTypes),
    [state.data]
  );
  const pg = usePaging(items, PAGE);

  return (
    <Card>
      <CardHeader icon="public" title="Wage Types per Country"
        subtitle="Map of wage type counts distributed across countries (T510 country grouping)."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={300}>
        {() => (
          <>
            <div style={{ height: Math.max(260, pg.slice.length * 32 + 32) }}>
              <ResponsiveContainer>
                <BarChart data={pg.slice} layout="vertical" margin={{ right: 56, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="countryCode" width={30} tickLine={false} axisLine={false}
                    fontSize={11} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                    content={<ChartTip render={(p) =>
                      <><b>{p.countryName} ({p.countryCode})</b><br />{fmt(p.noOfWageTypes)} wage types</>} />} />
                  <Bar dataKey="noOfWageTypes" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {pg.slice.map((_, i) => (
                      <Cell key={i} fill={[C.tertiary, C.container, C.teal, C.amber, C.secondary, C.violet][i % 6]} />
                    ))}
                    <LabelList dataKey="noOfWageTypes" position="right" fontSize={11} fontWeight={700} formatter={fmt} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="countries" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Active Wage Types table (paginated)
════════════════════════════════════════════════════════ */
function ActiveWageTypesTable({ state }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (state.data?.items ?? []).filter((i) =>
      !s || i.wageType?.toLowerCase().includes(s) || i.wageTypeText?.toLowerCase().includes(s)
    );
  }, [state.data, q]);
  const pg = usePaging(rows, 10);

  return (
    <Card className="overflow-hidden">
      <CardHeader icon="receipt_long" title="Active Wage Types (last 24 months)"
        subtitle="Wage types (T512W) used in payroll within the last 24 months."
        right={
          <>
            <Pill className="bg-primary-container text-on-primary">{state.data?.total ?? "—"} total</Pill>
            <SearchBox value={q} onChange={setQ} placeholder="Search wage type…" className="w-52" />
          </>
        } />
      <Async state={state} minHeight={320}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[400px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    <th className="px-4 py-2.5">Wage Type</th>
                    <th className="px-4 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-body-md">
                  {pg.slice.map((r) => (
                    <tr key={r.wageType} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2.5"><Chip className="text-primary">{r.wageType}</Chip></td>
                      <td className="px-4 py-2.5 text-secondary">{r.wageTypeText}</td>
                    </tr>
                  ))}
                  {!pg.slice.length && (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-secondary">No wage types match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="wage types" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Payroll Schema Pie
════════════════════════════════════════════════════════ */
function PayrollSchemaPie({ state }) {
  return (
    <Card>
      <CardHeader icon="schema" title="Payroll Schema (Std. vs. Custom)"
        subtitle="Breakdown of payroll calculation schemas: standard SAP vs. customer-created."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={280}>
        {(d) => {
          const slices = [
            { name: "Standard", value: d.stdPayrollSchemas ?? 0, fill: STD },
            { name: "Custom", value: d.customPayrollSchemas ?? 0, fill: CUST },
          ];
          const total = d.total ?? slices.reduce((s, x) => s + x.value, 0);
          return (
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="relative h-52 w-52 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={slices} dataKey="value" nameKey="name"
                      innerRadius="55%" outerRadius="92%" paddingAngle={2} stroke="none">
                      {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTip render={(p) =>
                      <><b>{p.name}</b><br />{fmt(p.value)} · {pct(p.value, total)}</>} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-label-xs font-bold uppercase text-secondary">Total</span>
                  <span className="text-headline-md font-bold">{fmt(total)}</span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                {slices.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
                    <span className="flex items-center gap-2 text-body-md font-semibold">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ background: s.fill }} />
                      {s.name}
                    </span>
                    <span className="text-title-md font-bold">
                      {fmt(s.value)} <span className="ml-1 text-label-xs font-normal text-secondary">({pct(s.value, total)})</span>
                    </span>
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

/* ════════════════════════════════════════════════════════
   Subschemas per Payroll Schema (paginated horizontal bars)
════════════════════════════════════════════════════════ */
function SubschemasBar({ state }) {
  const PAGE = 10;
  const items = useMemo(
    () => [...(state.data?.std?.items ?? [])].sort((a, b) => b.noOfSubschemas - a.noOfSubschemas),
    [state.data]
  );
  const pg = usePaging(items, PAGE);

  return (
    <Card>
      <CardHeader icon="account_tree" title="No. of Subschemas per Payroll Schema"
        subtitle="Payroll schemas ordered by the number of referenced subschemas (standard schemas)."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={300}>
        {() => (
          <>
            <div style={{ height: Math.max(260, pg.slice.length * 32 + 32) }}>
              <ResponsiveContainer>
                <BarChart data={pg.slice} layout="vertical" margin={{ right: 56, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="schema" width={48} tickLine={false} axisLine={false}
                    fontSize={11} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                    content={<ChartTip render={(p) =>
                      <><b>Schema {p.schema}</b><br />{fmt(p.noOfSubschemas)} subschemas</>} />} />
                  <Bar dataKey="noOfSubschemas" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {pg.slice.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? C.teal : C.tertiary} />)}
                    <LabelList dataKey="noOfSubschemas" position="right" fontSize={11} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="schemas"
              from={pg.from} to={pg.to} total={items.length} />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Payroll Functions & Operations Pies
════════════════════════════════════════════════════════ */
function FunctionsOperationsPies({ state }) {
  return (
    <Card>
      <CardHeader icon="functions" title="Payroll Functions & Operations"
        subtitle="Standard vs. custom payroll functions (T52FC) and operations (T52OP)."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={280}>
        {(d) => {
          const groups = [
            { title: "Payroll Functions", std: d.functions?.stdFunctions ?? 0, cust: d.functions?.customFunctions ?? 0, total: d.functions?.total ?? 0 },
            { title: "Payroll Operations", std: d.operations?.stdOperations ?? 0, cust: d.operations?.customOperations ?? 0, total: d.operations?.total ?? 0 },
          ];
          return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {groups.map((g) => {
                const slices = [
                  { name: "Standard", value: g.std, fill: STD },
                  { name: "Custom", value: g.cust, fill: CUST },
                ];
                return (
                  <div key={g.title} className="flex flex-col items-center gap-3">
                    <span className="text-title-md font-semibold text-on-surface">{g.title}</span>
                    <div className="relative h-48 w-48">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={slices} dataKey="value" innerRadius="55%" outerRadius="92%"
                            paddingAngle={2} stroke="none">
                            {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                          </Pie>
                          <Tooltip content={<ChartTip render={(p) =>
                            <><b>{p.name}</b><br />{fmt(p.value)} · {pct(p.value, g.total)}</>} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-headline-md font-bold">{fmt(g.total)}</span>
                        <span className="text-label-xs text-secondary">total</span>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-1.5">
                      {slices.map((s) => (
                        <div key={s.name} className="flex items-center justify-between rounded bg-surface-container-low px-3 py-2">
                          <span className="flex items-center gap-2 text-body-md">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                            {s.name}
                          </span>
                          <span className="font-bold">{fmt(s.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Custom Functions/Operations table
════════════════════════════════════════════════════════ */
function CustomFunctionsTable({ state }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (state.data?.items ?? []).filter((i) =>
      !s || i.name?.toLowerCase().includes(s) || i.description?.toLowerCase().includes(s)
    );
  }, [state.data, q]);
  const pg = usePaging(rows, 8);

  return (
    <Card className="overflow-hidden">
      <CardHeader icon="code" title="Custom Payroll Functions / Operations"
        subtitle="List of all customer-created payroll functions and operations."
        right={
          <>
            <Pill className="bg-primary-container text-on-primary">{state.data?.total ?? "—"} custom</Pill>
            <SearchBox value={q} onChange={setQ} placeholder="Search…" className="w-52" />
          </>
        } />
      <Async state={state} minHeight={280}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    <th className="px-4 py-2.5 w-28">Type</th>
                    <th className="px-4 py-2.5">Func / Op Name</th>
                    <th className="px-4 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-body-md">
                  {pg.slice.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2.5">
                        <Pill className={r.type === "Function" ? "bg-tertiary-container text-white" : "bg-primary-container text-on-primary"}>
                          {r.type}
                        </Pill>
                      </td>
                      <td className="px-4 py-2.5"><Chip>{r.name}</Chip></td>
                      <td className="px-4 py-2.5 text-secondary">{r.description}</td>
                    </tr>
                  ))}
                  {!pg.slice.length && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-secondary">No items match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="items" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Unused Payroll Areas table (paginated)
════════════════════════════════════════════════════════ */
function UnusedPayrollAreasTable({ state }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (state.data?.items ?? []).filter((i) =>
      !s || i.payrollArea?.toLowerCase().includes(s) || i.payrollAreaDesc?.toLowerCase().includes(s)
    );
  }, [state.data, q]);
  const pg = usePaging(rows, 10);

  return (
    <Card className="overflow-hidden">
      <CardHeader icon="block" title="Unused Payroll Areas"
        subtitle="Payroll areas with no employees assigned (candidates for cleanup before migration)."
        right={
          <>
            <Pill className="bg-error-container text-on-error-container">{state.data?.total ?? "—"} unused</Pill>
            <SearchBox value={q} onChange={setQ} placeholder="Search payroll area…" className="w-52" />
          </>
        } />
      <Async state={state} minHeight={320}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[380px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    <th className="px-4 py-2.5">Payroll Area</th>
                    <th className="px-4 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-body-md">
                  {pg.slice.map((r) => (
                    <tr key={r.payrollArea} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2.5"><Chip className="text-primary">{r.payrollArea}</Chip></td>
                      <td className="px-4 py-2.5 text-secondary">{r.payrollAreaDesc}</td>
                    </tr>
                  ))}
                  {!pg.slice.length && (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-secondary">No results.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="payroll areas" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════ */
export default function PayrollAccounting() {
  const payrollArea = useApi(EP.pePayrollAreaSummary);
  const periodParam = useApi(EP.pePeriodParameterSummary);
  const empPerArea = useApi(EP.peEmployeesPerPayrollArea);
  const areasPerPeriod = useApi(EP.pePayrollAreasPerPeriod);
  const companyFeatSum = useApi(EP.peCompanyFeaturesSummary);
  const featureFuncs = useApi(EP.peFeatureFunctions);
  const wageTypeSum = useApi(EP.peWageTypeSummary);
  const wagePerCountry = useApi(EP.peWageTypesPerCountry);
  const activeWage = useApi(EP.peActiveWageTypes);
  const schemaSum = useApi(EP.pePayrollSchemaSummary);
  const schemaSubschemas = useApi(EP.pePayrollSchemaSubschemas);
  const pcrSum = useApi(EP.pePcrSummary);
  const funcOpSum = useApi(EP.pePayrollFunctionsOperationsSummary);
  const customFuncOps = useApi(EP.peCustomFunctionsOperations);
  const unusedAreas = useApi(EP.peUnusedPayrollAreas);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="SAP HCM discovery · PE01 / PE02 / PE04 · T512W / T549A"
        title="Payroll Accounting (PY) & Schema Architecture"
        meta={payrollArea.meta}
        subtitle="Deep-dive audit of Payroll Areas, Period Parameters, Wage Types, Calculation Schemas, Personnel Calculation Rules (PCRs), and Custom Functions/Operations for SFSF EC Payroll migration readiness."
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Payroll Areas" icon="domain" accent="bg-primary"
          value={fmt(payrollArea.data?.total)} hint={`Std: ${fmt(payrollArea.data?.stdPayrollAreas)} · Custom: ${fmt(payrollArea.data?.customPayrollAreas)}`} />
        <Kpi label="Total Wage Types" icon="receipt_long" accent="bg-tertiary-container"
          value={fmt(wageTypeSum.data?.total)} hint={`Std: ${fmt(wageTypeSum.data?.stdWageTypes)} · Custom: ${fmt(wageTypeSum.data?.customWageTypes)}`} />
        <Kpi label="Total PCRs" icon="calculate" accent="bg-secondary"
          value={fmt(pcrSum.data?.total)} hint={`Std: ${fmt(pcrSum.data?.stdPcr)} · Custom: ${fmt(pcrSum.data?.customPcr)}`} />
        <Kpi label="Payroll Schemas" icon="schema" accent="bg-primary-container"
          value={fmt(schemaSum.data?.total)} hint={`Std: ${fmt(schemaSum.data?.stdPayrollSchemas)} · Custom: ${fmt(schemaSum.data?.customPayrollSchemas)}`} />
      </div>

      {/* Payroll Area + Period Parameter charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StdCustomBar title="Std. vs. Custom Payroll Area" subtitle="Standard vs. customer-defined payroll areas in T549A."
          icon="domain" stdKey="stdPayrollAreas" custKey="customPayrollAreas" state={payrollArea} />
        <StdCustomBar title="Std. vs. Custom Period Parameters" subtitle="Period parameters controlling payroll run frequency."
          icon="calendar_month" stdKey="stdPeriodParameters" custKey="customPeriodParameters" state={periodParam} />
      </div>

      {/* Employees per area + Areas per period */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <EmployeesPerPayrollArea state={empPerArea} />
        <PayrollAreasPerPeriod state={areasPerPeriod} />
      </div>

      {/* Company Features */}
      <CompanyFeatures summaryState={companyFeatSum} detailState={featureFuncs} />

      {/* Wage Types */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StdCustomBar title="Std. vs. Custom Wage Types" subtitle="Standard and customer-defined wage type catalog entries (T512W)."
          icon="receipt_long" stdKey="stdWageTypes" custKey="customWageTypes" state={wageTypeSum} />
        <WageTypesPerCountry state={wagePerCountry} />
      </div>

      <ActiveWageTypesTable state={activeWage} />

      {/* Schema section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PayrollSchemaPie state={schemaSum} />
        <SubschemasBar state={schemaSubschemas} />
      </div>

      {/* PCR */}
      <StdCustomBar title="Std. vs. Custom Personnel Calc. Rules (PCR)"
        subtitle="Personnel calculation rules used in payroll schemas (T52C5 / T52CF)."
        icon="calculate" stdKey="stdPcr" custKey="customPcr" state={pcrSum} />

      {/* Functions & Operations */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FunctionsOperationsPies state={funcOpSum} />
        <CustomFunctionsTable state={customFuncOps} />
      </div>

      {/* Unused Payroll Areas */}
      <UnusedPayrollAreasTable state={unusedAreas} />
    </div>
  );
}

