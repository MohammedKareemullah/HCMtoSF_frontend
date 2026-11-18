import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { EP } from "../api/client";
import { useApi, usePaging } from "../hooks/useApi";
import {
  Async, Card, CardHeader, ChartTip, Chip, Icon, Kpi,
  PageHeader, Pagination, Pill, SearchBox, SyncBadge,
} from "../components/ui";
import { C, fmt, pct } from "../lib/format";

/* ───────── colours ───────── */
const STD = C.tertiary;
const CUST = C.primary;

/* ════════════════════════════════════════════════════════
   Shared: Std vs Custom bar chart
════════════════════════════════════════════════════════ */
function StdCustomBar({ title, subtitle, icon, stdVal, custVal, total }) {
  const data = [
    { label: "Standard", count: stdVal, fill: STD },
    { label: "Custom", count: custVal, fill: CUST },
  ];
  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle} />
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
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Schedule Dependency Card (Break, Overtime, Modifier)
════════════════════════════════════════════════════════ */
function ScheduleDependencyCard({
  state,
  title,
  tcode,
  badge,
  badgeClass,
  desc,
  icon,
  accentColor = "bg-primary-container",
  iconColor = "text-primary",
  totalWsr = 289,
}) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name={icon} className={iconColor} size={22} />
            <span className="font-title-md text-title-md text-on-surface font-semibold">
              {title} {tcode && <span className="text-secondary text-body-sm font-normal">({tcode})</span>}
            </span>
          </div>
          {badge && (
            <span className={`font-label-xs text-label-xs px-2 py-0.5 rounded font-bold uppercase ${badgeClass}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="font-body-sm text-body-sm text-secondary">
          {desc}
        </p>
      </div>

      <Async state={state} minHeight={120}>
        {(d) => {
          const schkzCount = d.noOfSchkz ?? 0;
          const zmodnCount = d.noOfZmodn ?? 0;
          const tprogCount = d.noOfTprog ?? 0;
          const totalCount = d.total ?? 0;
          const wsrRatio = totalWsr > 0 ? ((schkzCount / totalWsr) * 100).toFixed(1) : 0;

          return (
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-body-sm font-body-sm mb-1.5">
                  <span className="text-secondary font-medium">WSR Linked (Schkz)</span>
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    {fmt(schkzCount)} Rules <span className="text-secondary text-body-sm font-normal">({wsrRatio}%)</span>
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${accentColor}`} style={{ width: `${Math.min(100, Number(wsrRatio))}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-label-xs font-label-xs">
                <div className="p-2 rounded-lg bg-surface-container-low text-secondary flex items-center justify-between">
                  <span>Daily WS (Tprog):</span>
                  <span className="font-bold text-on-surface text-body-sm">{fmt(tprogCount)}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low text-secondary flex items-center justify-between">
                  <span>Period WS (Zmodn):</span>
                  <span className="font-bold text-on-surface text-body-sm">{fmt(zmodnCount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-label-xs text-secondary border-t border-surface-container-highest">
                <span>Total Combinations:</span>
                <span className="font-semibold text-on-surface">{fmt(totalCount)}</span>
              </div>
            </div>
          );
        }}
      </Async>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Work Schedule Hierarchy Mapping
════════════════════════════════════════════════════════ */
function WorkScheduleMapping({ state }) {
  const PAGE = 5;
  const items = state.data?.items ?? [];
  const pg = usePaging(items, PAGE);
  const [expanded, setExpanded] = useState({});

  return (
    <Card>
      <CardHeader icon="account_tree" title="Work Schedule Hierarchy Mapping"
        subtitle="Maps each Work Schedule Rule (SCHKZ) → Period Work Schedule (ZMODN) → Daily Work Schedules (DWS)."
        right={state.meta && <SyncBadge meta={state.meta} />} />
      <Async state={state} minHeight={320}>
        {() => (
          <>
            <div className="flex flex-col gap-3">
              {pg.slice.map((rule) => (
                <div key={rule.schkz} className="rounded-xl border border-surface-container-highest bg-surface-container-low p-4">
                  {/* Work Schedule Rule */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="rounded-lg bg-primary px-3 py-1 font-mono text-label-xs font-bold text-on-primary">{rule.schkz}</span>
                    <span className="text-label-xs font-bold uppercase tracking-wider text-secondary">Work Schedule Rule</span>
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [rule.schkz]: !e[rule.schkz] }))}
                      className="ml-auto text-label-xs font-bold text-primary hover:underline"
                    >
                      {expanded[rule.schkz] ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  {(expanded[rule.schkz] || rule.periods.length <= 2) && (
                    <div className="flex flex-col gap-2 ml-6">
                      {rule.periods.map((period) => (
                        <div key={period.zmodn} className="flex flex-col gap-2">
                          {/* Period Work Schedule */}
                          <div className="flex items-center gap-2">
                            <Icon name="arrow_right" size={16} className="text-secondary shrink-0" />
                            <span className="rounded-lg bg-tertiary-container px-2.5 py-0.5 font-mono text-label-xs font-bold text-white">{period.zmodn}</span>
                            <span className="text-label-xs text-secondary">Period Work Schedule</span>
                          </div>

                          {/* Daily Work Schedules */}
                          <div className="flex flex-wrap gap-1.5 ml-6">
                            <Icon name="arrow_right" size={14} className="text-secondary shrink-0 mt-0.5" />
                            {period.dailyWorkSchedules.map((dws) => (
                              <span key={dws}
                                className="rounded bg-surface-container px-2 py-0.5 font-mono text-label-xs font-semibold text-on-surface border border-surface-container-highest">
                                {dws}
                              </span>
                            ))}
                            <span className="text-label-xs text-secondary self-center">
                              ({period.dailyWorkSchedules.length} daily schedules)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!expanded[rule.schkz] && rule.periods.length > 2 && (
                    <div className="ml-6 text-label-xs text-secondary">
                      {rule.periods.length} period schedules · click Expand to view
                    </div>
                  )}
                </div>
              ))}
              {!pg.slice.length && (
                <p className="py-8 text-center text-body-md text-secondary">No mapping data available.</p>
              )}
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="work schedule rules" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Unused Absence/Attendance table
════════════════════════════════════════════════════════ */
function UnusedTypesTable({ state, title, subtitle, icon, subtypeKey = "subtype", descKey = "description", accentClass = "bg-error-container text-on-error-container" }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (state.data?.items ?? []).filter((i) =>
      !s || i[subtypeKey]?.toLowerCase().includes(s) || i[descKey]?.toLowerCase().includes(s)
    );
  }, [state.data, q, subtypeKey, descKey]);
  const pg = usePaging(rows, 10);

  return (
    <Card className="overflow-hidden">
      <CardHeader icon={icon} title={title} subtitle={subtitle}
        right={
          <>
            <Pill className={accentClass}>{state.data?.total ?? "—"} total</Pill>
            <SearchBox value={q} onChange={setQ} placeholder="Search…" className="w-48" />
          </>
        } />
      <Async state={state} minHeight={300}>
        {() => (
          <>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[380px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-label-xs font-bold uppercase tracking-wider text-secondary">
                    <th className="px-4 py-2.5">Subtype</th>
                    <th className="px-4 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-body-md">
                  {pg.slice.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2.5"><Chip className="text-primary">{r[subtypeKey]}</Chip></td>
                      <td className="px-4 py-2.5 text-secondary">{r[descKey]}</td>
                    </tr>
                  ))}
                  {!pg.slice.length && (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-secondary">No items match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onChange={pg.setPage} unit="types" />
          </>
        )}
      </Async>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   Schedule stat tile (with break/overtime/modifier counts)
════════════════════════════════════════════════════════ */
function ScheduleStat({ icon, title, value, hint, accent = "bg-primary-container" }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="mb-1 flex items-center justify-between">
        <span className="text-label-xs font-bold uppercase text-secondary">{title}</span>
        <Icon name={icon} className="text-secondary" />
      </div>
      <div className="text-metric-num text-on-surface">{value}</div>
      {hint && <div className="mt-1 text-body-sm text-secondary">{hint}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════ */
export default function TimeManagement() {
  const wsRules = useApi(EP.tmWorkScheduleRules);
  const dws = useApi(EP.tmDailyWorkSchedules);
  const pws = useApi(EP.tmPeriodWorkSchedules);
  const breakSchedules = useApi(EP.tmBreakSchedules);
  const overtimeSchedules = useApi(EP.tmOvertimeSchedules);
  const modifierSchedules = useApi(EP.tmModifierSchedules);
  const wsMapping = useApi(EP.tmWorkScheduleMapping);
  const absAttTypes = useApi(EP.tmAttendanceAbsenceTypes);
  const unusedAbs = useApi(EP.tmUnusedAbsenceTypes);
  const unusedAtt = useApi(EP.tmUnusedAttendanceTypes);

  const totalWsr = wsRules.data?.noOfWorkScheduleRules ?? 289;

  const absStd = absAttTypes.data?.absences?.stdAbsenceTypes ?? 0;
  const absCust = absAttTypes.data?.absences?.customAbsenceTypes ?? 0;
  const absTotal = absStd + absCust;
  const attStd = absAttTypes.data?.attendances?.stdAttendanceTypes ?? 0;
  const attCust = absAttTypes.data?.attendances?.customAttendanceTypes ?? 0;
  const attTotal = attStd + attCust;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="SAP HCM discovery · TM architecture & work schedule assessment"
        title="Time Management (TM) Architecture & Work Schedule Assessment"
        meta={wsRules.meta}
        subtitle="Comprehensive assessment of Work Schedule Rules, Daily Work Schedules, Period Work Schedules, Absence & Attendance types for SuccessFactors Time Off & Time Tracking migration."
      />

      {/* Top KPI tiles - work schedule counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScheduleStat icon="today" title="Work Schedule Rules" accent="bg-primary-container"
          value={<Async state={wsRules} minHeight={36}>{(d) => fmt(d.noOfWorkScheduleRules)}</Async>}
          hint="Total WSR (T508A)" />
        <ScheduleStat icon="calendar_view_day" title="Daily Work Schedules" accent="bg-tertiary-container"
          value={<Async state={dws} minHeight={36}>{(d) => fmt(d.noOfDailyWorkSchedules)}</Async>}
          hint="Total DWS (T550A)" />
        <ScheduleStat icon="date_range" title="Period Work Schedules" accent="bg-secondary"
          value={<Async state={pws} minHeight={36}>{(d) => fmt(d.noOfPeriodWorkSchedules)}</Async>}
          hint="Total PWS (T551A)" />
      </div>

      {/* Cross-Configuration Inter-Dependency Deck (Break, Overtime, Modifier Schedules) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ScheduleDependencyCard
          state={breakSchedules}
          title="Break Schedules"
          tcode="T550P"
          badge="92% SF Read"
          badgeClass="bg-emerald-100 text-emerald-800"
          desc="Break models mapped from ECC fixed and dynamic windows to SuccessFactors Dynamic Break deductions."
          icon="coffee"
          accentColor="bg-primary-container"
          iconColor="text-primary"
          totalWsr={totalWsr}
        />

        <ScheduleDependencyCard
          state={overtimeSchedules}
          title="Overtime Schedules"
          tcode="T559R"
          badge="Time Tracking"
          badgeClass="bg-secondary-fixed text-on-secondary-fixed"
          desc="Integrated overtime thresholds, night differentials (BZA/TV), and EC Time Valuation allowance chains."
          icon="alarm_on"
          accentColor="bg-tertiary-container"
          iconColor="text-tertiary"
          totalWsr={totalWsr}
        />

        <ScheduleDependencyCard
          state={modifierSchedules}
          title="Modifier Schedules"
          tcode="MODIF"
          badge="Holiday Calc"
          badgeClass="bg-surface-container-high text-on-surface"
          desc="Day Type Selection Rules (T553A/T553T) and Holiday Calendar variant assignments migrating to Holiday Calendars."
          icon="rule_settings"
          accentColor="bg-secondary"
          iconColor="text-secondary"
          totalWsr={totalWsr}
        />
      </div>

      {/* Work Schedule Mapping */}
      <WorkScheduleMapping state={wsMapping} />

      {/* Absence & Attendance bar charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {absAttTypes.data ? (
          <StdCustomBar
            title="Standard vs. Custom Absence Types (TS54)"
            subtitle="Count of SAP-standard vs. customer-defined absence types (IT2001)."
            icon="event_busy"
            stdVal={absStd} custVal={absCust} total={absTotal} />
        ) : (
          <Card><CardHeader icon="event_busy" title="Standard vs. Custom Absence Types (TS54)" />
            <Async state={absAttTypes} minHeight={220}>{() => null}</Async></Card>
        )}

        {absAttTypes.data ? (
          <StdCustomBar
            title="Standard vs. Custom Attendance Types (TS45)"
            subtitle="Count of SAP-standard vs. customer-defined attendance types (IT2002)."
            icon="event_available"
            stdVal={attStd} custVal={attCust} total={attTotal} />
        ) : (
          <Card><CardHeader icon="event_available" title="Standard vs. Custom Attendance Types (TS45)" />
            <Async state={absAttTypes} minHeight={220}>{() => null}</Async></Card>
        )}
      </div>

      {/* Unused absence & attendance tables */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <UnusedTypesTable
          state={unusedAbs}
          title="Unused Absence Types (Last 24 Months)"
          subtitle="Absence subtypes with zero usage in the last 24 months – candidates for decommission."
          icon="event_busy"
          accentClass="bg-error-container text-on-error-container" />
        <UnusedTypesTable
          state={unusedAtt}
          title="Unused Attendance Types (Last 24 Months)"
          subtitle="Attendance subtypes with zero usage in the last 24 months – candidates for decommission."
          icon="event_available"
          accentClass="bg-secondary-container text-secondary" />
      </div>
    </div>
  );
}
