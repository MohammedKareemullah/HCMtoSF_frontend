// Base URL: empty in dev (Vite proxies /api), absolute URL in production via VITE_API_BASE.
const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export async function apiGet(path, params = {}, signal) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch { /* ignore */ }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` – ${detail}` : ""}`);
  }
  return res.json(); // { data, meta }
}

// Every endpoint used by the UI, in one place.
export const EP = {
  systemInfo: "/api/header/system-info",
  statusSummary: "/api/headcount/status-summary",
  byCountry: "/api/headcount/by-country",
  byCompanyCode: "/api/headcount/by-company-code",
  employees: "/api/headcount/employees",
  payrollByMonth: "/api/headcount/payroll-by-month",
  hiresPerYear: "/api/headcount/hires-per-year",
  infotypeCategories: "/api/hcm-core/infotype-categories",
  subtypesPerInfotype: "/api/hcm-core/subtypes-per-infotype",
  infotypeDetail: "/api/hcm-core/infotype-detail",
  singleScreen: "/api/pa/single-screen-classification",
  listScreen: "/api/pa/list-screen-classification",
  fieldVisibility: "/api/pa/field-visibility-summary",
  dynActionCount: "/api/pa/dynamic-action-count",
  dynActionTriggers: "/api/pa/dynamic-action-triggers",
  dynActionByOperation: "/api/pa/dynamic-action-by-operation",
  dynActionRoutines: "/api/pa/dynamic-action-routines",

  // Organizational Management
  omObjectTypes: "/api/om/object-types",
  omRelationships: "/api/om/relationships",
  omEvaluationPaths: "/api/om/evaluation-paths",
  omObjectsPerPlanVersion: "/api/om/objects-per-plan-version",
  omRelationshipsPerPlanVersion: "/api/om/relationships-per-plan-version",
  omAuthProfiles: "/api/om/auth-profiles",

  // Payroll Accounting
  pePayrollAreaSummary: "/api/pe/payroll-area-summary",
  pePeriodParameterSummary: "/api/pe/period-parameter-summary",
  peEmployeesPerPayrollArea: "/api/pe/employees-per-payroll-area",
  pePayrollAreasPerPeriod: "/api/pe/payroll-areas-per-period",
  peCompanyFeaturesSummary: "/api/pe/company-features-summary",
  peFeatureFunctions: "/api/pe/feature-functions",
  peWageTypeSummary: "/api/pe/wage-type-summary",
  peWageTypesPerCountry: "/api/pe/wage-types-per-country",
  peActiveWageTypes: "/api/pe/active-wage-types",
  pePayrollSchemaSummary: "/api/pe/payroll-schema-summary",
  pePayrollSchemaSubschemas: "/api/pe/payroll-schema-subschemas",
  pePcrSummary: "/api/pe/pcr-summary",
  pePayrollFunctionsOperationsSummary: "/api/pe/payroll-functions-operations-summary",
  peCustomFunctionsOperations: "/api/pe/custom-functions-operations",
  peUnusedPayrollAreas: "/api/pe/unused-payroll-areas",

  // Time Management
  tmWorkScheduleRules: "/api/tm/work-schedule-rules",
  tmDailyWorkSchedules: "/api/tm/daily-work-schedules",
  tmPeriodWorkSchedules: "/api/tm/period-work-schedules",
  tmBreakSchedules: "/api/tm/break-schedules",
  tmOvertimeSchedules: "/api/tm/overtime-schedules",
  tmModifierSchedules: "/api/tm/modifier-schedules",
  tmWorkScheduleMapping: "/api/tm/work-schedule-mapping",
  tmAttendanceAbsenceTypes: "/api/tm/attendance-absence-types",
  tmUnusedAbsenceTypes: "/api/tm/unused-absence-types",
  tmUnusedAttendanceTypes: "/api/tm/unused-attendance-types",
};
