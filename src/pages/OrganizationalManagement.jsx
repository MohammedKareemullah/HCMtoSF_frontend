import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { EP } from "../api/client";
import { useApi, usePaging } from "../hooks/useApi";
import {
  Async, Card, CardHeader, ChartTip, Chip, Icon, Kpi, PageHeader, Pagination, Pill, SyncBadge,
} from "../components/ui";
import { C, fmt, pct } from "../lib/format";

/* ───────── colour tokens ───────── */
const STD_COLOR = C.tertiary;    // deep blue
const CUST_COLOR = C.primary;    // brand red

/* ═══════════════════════════════════════════════════════
   Shared: Std vs Custom bar chart
═══════════════════════════════════════════════════════ */
function StdCustomBar({ title, subtitle, icon, stdKey, custKey, state }) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle}
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={220}>
        {(d) => {
          const stdVal = d[stdKey] ?? 0;
          const custVal = d[custKey] ?? 0;
          const total = d.total ?? stdVal + custVal;
          const data = [
            { label: "Standard", count: stdVal, fill: STD_COLOR },
            { label: "Custom", count: custVal, fill: CUST_COLOR },
          ];
          return (
            <>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={data} margin={{ top: 24, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="#e6e8ea" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={50} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                      content={<ChartTip render={(p) => <><b>{p.label}</b><br />{fmt(p.count)} · {pct(p.count, total)}</>} />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={80}>
                      {data.map((s) => <Cell key={s.label} fill={s.fill} />)}
                      <LabelList dataKey="count" position="top" fontSize={12} fontWeight={700} formatter={fmt} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STD_COLOR }} />
                  Standard: <b className="text-on-surface">{fmt(stdVal)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CUST_COLOR }} />
                  Custom: <b className="text-on-surface">{fmt(custVal)}</b>
                </span>
                <span className="ml-auto text-secondary">Total: <b className="text-on-surface">{fmt(total)}</b></span>
              </div>
            </>
          );
        }}
      </Async>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   Auth Profiles Pie
═══════════════════════════════════════════════════════ */
function AuthProfilesPie({ state }) {
  return (
    <Card>
      <CardHeader icon="shield_person" title="Structural Authorization Profiles"
        subtitle="Number of used (assigned) vs. unused authorization profiles in OOSP."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={280}>
        {(d) => {
          const slices = [
            { name: "Assigned (Used)", value: d.assignedAuthProfiles ?? 0, fill: STD_COLOR },
            { name: "Unassigned (Unused)", value: d.unassignedAuthProfiles ?? 0, fill: CUST_COLOR },
          ];
          const total = d.total ?? slices.reduce((s, x) => s + x.value, 0);
          return (
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="relative h-56 w-56 shrink-0">
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
                  <span className="text-label-xs font-semibold text-primary">profiles</span>
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

/* ═══════════════════════════════════════════════════════
   Objects per plan version (bar)
═══════════════════════════════════════════════════════ */
function PlanVersionBars({ state, title, subtitle, icon, countKey }) {
  const pg = usePaging((state.data?.items ?? []), 10);
  const data = useMemo(
    () => (state.data?.items ?? []).map((i) => ({ label: i.plvar, text: i.ptext, count: i[countKey] })),
    [state.data, countKey]
  );
  const paged = useMemo(() => data.slice((pg.page - 1) * 10, pg.page * 10), [data, pg.page]);

  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle}
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={280}>
        {() => (
          <>
            <div style={{ height: Math.max(240, paged.length * 32 + 32) }}>
              <ResponsiveContainer>
                <BarChart data={paged} layout="vertical" margin={{ right: 48, left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#e6e8ea" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="label" width={36} tickLine={false} axisLine={false}
                    fontSize={11} fontFamily="monospace" />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }}
                    content={<ChartTip render={(p) => <><b>{p.label} – {p.text}</b><br />{fmt(p.count)} {countKey === "noOfObjects" ? "objects" : "relationships"}</>} />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {paged.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? C.tertiary : C.container} />)}
                    <LabelList dataKey="count" position="right" fontSize={11} fontWeight={700} formatter={fmt} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Pagination
              page={pg.page} pageCount={pg.pageCount} onChange={pg.setPage}
              from={(pg.page - 1) * 10 + 1} to={Math.min(pg.page * 10, data.length)} total={data.length} unit="plan versions" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════ */
export default function OrganizationalManagement() {
  const objects = useApi(EP.omObjectTypes);
  const rels = useApi(EP.omRelationships);
  const evalPaths = useApi(EP.omEvaluationPaths);
  const authProfiles = useApi(EP.omAuthProfiles);
  const objPlanVer = useApi(EP.omObjectsPerPlanVersion);
  const relPlanVer = useApi(EP.omRelationshipsPerPlanVersion);

  const kpisMeta = objects.meta;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="SAP HCM discovery · OM architecture"
        title="Organizational Management"
        meta={kpisMeta}
        subtitle="Assessment of Object Types (T77OM), Relationship Definitions (T77RR), Evaluation Paths (T77AW), and Structural Authorization Profiles for SuccessFactors Position Management & Org-Structure porting."
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total OM Object Types" icon="category" accent="bg-tertiary-container"
          value={fmt(objects.data?.total)} hint={`Std: ${fmt(objects.data?.stdOmObjects)} · Custom: ${fmt(objects.data?.customOmObjects)}`} />
        <Kpi label="Total Relationships" icon="swap_horiz" accent="bg-primary-container"
          value={fmt(rels.data?.total)} hint={`Std: ${fmt(rels.data?.stdOmRelationships)} · Custom: ${fmt(rels.data?.customOmRelationships)}`} />
        <Kpi label="Total Evaluation Paths" icon="account_tree" accent="bg-secondary"
          value={fmt(evalPaths.data?.total)} hint={`Std: ${fmt(evalPaths.data?.stdOmEvaluationPaths)} · Custom: ${fmt(evalPaths.data?.customOmEvaluationPaths)}`} />
        <Kpi label="Auth Profiles" icon="shield_person" accent="bg-primary"
          value={fmt(authProfiles.data?.total)} hint={`Assigned: ${fmt(authProfiles.data?.assignedAuthProfiles)} · Unassigned: ${fmt(authProfiles.data?.unassignedAuthProfiles)}`} />
      </div>

      {/* Std vs Custom charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <StdCustomBar
          title="Standard vs. Custom Object Types"
          subtitle="Analysis of OM Object Instances: Standard (SAP) vs. Customer-custom OM objects."
          icon="category" stdKey="stdOmObjects" custKey="customOmObjects" state={objects} />
        <StdCustomBar
          title="Std. vs. Custom Relationships (T77RR)"
          subtitle="Evaluation of all system-delivered relationship definitions vs. custom project & customer-defined relationships."
          icon="swap_horiz" stdKey="stdOmRelationships" custKey="customOmRelationships" state={rels} />
        <StdCustomBar
          title="Std. vs. Custom Evaluation Paths (T77AW)"
          subtitle="Evaluation paths used in HR reporting and org-chart navigation: standard vs. custom configurations."
          icon="account_tree" stdKey="stdOmEvaluationPaths" custKey="customOmEvaluationPaths" state={evalPaths} />
      </div>

      {/* Auth Profiles Pie */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AuthProfilesPie state={authProfiles} />

        {/* Plan version summary */}
        <Card>
          <CardHeader icon="layers" title="Plan Versions Overview"
            subtitle="Number of active plan versions holding OM objects and relationships." />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Plan versions (objects)", value: objPlanVer.data?.total, icon: "inventory_2" },
              { label: "Plan versions (rels)", value: relPlanVer.data?.total, icon: "hub" },
            ].map((k) => (
              <div key={k.label} className="relative overflow-hidden rounded-xl bg-surface-container-low p-4">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary-container" />
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-label-xs font-bold uppercase text-secondary">{k.label}</span>
                  <Icon name={k.icon} className="text-secondary" />
                </div>
                <div className="text-metric-num text-on-surface">{fmt(k.value)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Plan version bars */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PlanVersionBars
          state={objPlanVer} countKey="noOfObjects" icon="inventory_2"
          title="Objects per Plan Version" subtitle="Distribution of OM objects across all plan versions." />
        <PlanVersionBars
          state={relPlanVer} countKey="noOfRelationships" icon="hub"
          title="Relationships per Plan Version" subtitle="Distribution of OM relationships across all plan versions." />
      </div>
    </div>
  );
}

