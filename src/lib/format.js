export const nf = new Intl.NumberFormat("en-US");
export const fmt = (n) => (n === null || n === undefined ? "—" : nf.format(n));
export const pct = (n, t) => (t ? `${((n / t) * 100).toFixed(1)}%` : "0%");
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const C = {
  primary: "#6b0110",
  container: "#8b1d24",
  tertiary: "#004c75",
  secondary: "#545f73",
  teal: "#0f766e",
  amber: "#b45309",
  violet: "#7c3aed",
  slate: "#94a3b8",
  track: "#e6e8ea",
};

export const PALETTE = [C.container, C.tertiary, C.secondary, C.teal, C.amber, C.violet, "#bcc7de", "#dfbfbd", "#ca8a04"];

export const CAT_COLORS = {
  "Personnel Administration (PA)": C.container,
  "Organizational Management (OM)": C.tertiary,
  "Time Management (TM)": C.teal,
  "SAP Reserved": C.secondary,
  Recruitment: C.amber,
  "E-Recruiting & Learning": C.violet,
  "Custom Infotypes": "#d97706",
  Unknown: C.slate,
};
export const catColor = (c) => CAT_COLORS[c] || C.slate;
export const catShort = (c) => {
  const m = /\(([^)]+)\)/.exec(c || "");
  return m ? m[1] : c || "Unknown";
};

export function formatSync(meta) {
  if (!meta?.lastSyncedAt) return null;
  const d = new Date(meta.lastSyncedAt);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
