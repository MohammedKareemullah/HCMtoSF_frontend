import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { EP } from "../api/client";
import { useApi } from "../hooks/useApi";
import { formatSync } from "../lib/format";
import { Icon } from "./ui";

const REMOTE_LOGO = "https://lh3.googleusercontent.com/aida/ALJJyrCJol0pjAyhO6Ww2AKNuozMy7_-8Zez8cv3hIrFY942s44uU8VkLji8j5gARvtiseUlGEjiMNscR3X0pbjQJsAz4NN1aPDHAHE-BZH5ss8tpTFLxrAS5IP9TU3ynSimj_6AsunRwasLRXSwcj-gHxktNk4DvjmtqT983R5OiGFUvrvQ5equDrpESArmZONlJRBPWFxqv8JnYmDa-3QcBXjrCXsF7mzfMi-2n4QoO588xTGT8_Ndyp4K-IhL";

const NAV = [
  {
    group: "Assessment Modules", items: [
      { to: "/", label: "Key Overview", icon: "dashboard", end: true },
      { to: "/hcm-core", label: "HCM Core Processes", icon: "account_tree" },
      { to: "/personnel-administration", label: "Personnel Administration", icon: "badge" },
      { to: "/organizational-management", label: "Organizational Management", icon: "lan" },
      { to: "/payroll-accounting", label: "Payroll Accounting", icon: "payments" },
      { to: "/time-management", label: "Time Management", icon: "more_time" },
    ]
  },
];

const TITLES = {
  "/": "Key HCM Overview",
  "/hcm-core": "HCM Core Processes",
  "/personnel-administration": "Personnel Administration",
  "/organizational-management": "Organizational Management",
  "/payroll-accounting": "Payroll Accounting",
  "/time-management": "Time Management",
};

function Logo({ className = "h-10" }) {
  // Drop your logo at /public/ktern-logo.png; falls back to the hosted copy, then to text.
  const [src, setSrc] = useState("/ktern-logo.png");
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-title-lg font-bold text-primary">KTern</span>;
  return (
    <img alt="KTern" className={`${className} w-auto object-contain`} src={src}
      onError={() => (src === REMOTE_LOGO ? setFailed(true) : setSrc(REMOTE_LOGO))} />
  );
}

function Sidebar({ sync, open, onClose }) {
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-title-md transition-colors ${isActive ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}`;
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between overflow-y-auto bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary-container" />
              <span className="text-label-md font-bold uppercase tracking-wider text-primary">Transformation</span>
            </div>
            <span className="rounded bg-surface-container-high px-1 py-0.5 text-label-xs font-semibold text-on-surface">V3.8</span>
          </div>
          {NAV.map((g) => (
            <div key={g.group} className="px-3 py-2">
              <div className="mb-1 px-2 py-1 text-label-xs font-bold uppercase tracking-wider text-secondary">{g.group}</div>
              <nav className="flex flex-col gap-0.5">
                {g.items.map((i) => (
                  <NavLink key={i.to} to={i.to} end={i.end} className={link} onClick={onClose}>
                    <Icon name={i.icon} />{i.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="m-3 rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center justify-between text-label-xs font-semibold uppercase text-secondary">
            <span>Data Sync</span>
            <span className={sync.ok ? "text-tertiary-container" : "text-error"}>{sync.ok ? "Live" : "Offline"}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
            <div className={`h-full ${sync.ok ? "bg-primary-container" : "bg-error"}`} style={{ width: sync.ok ? "100%" : "15%" }} />
          </div>
          <div className="mt-2 truncate text-body-sm text-on-surface-variant">{sync.when ? `Last sync ${sync.when}` : "Waiting for backend…"}</div>
        </div>
      </aside>
    </>
  );
}

function Meta({ label, value, cls = "" }) {
  return (
    <div className={`items-center gap-1.5 text-body-sm ${cls}`}>
      <span className="text-label-xs font-bold uppercase text-secondary">{label}:</span>{" "}
      <span className="text-title-md font-semibold text-on-surface">{value ?? "—"}</span>
    </div>
  );
}

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(true);
  const { pathname } = useLocation();
  const sys = useApi(EP.systemInfo);
  const d = sys.data;
  const ok = !!d && !sys.error;
  const sync = { ok, when: formatSync(sys.meta) };
  const page = TITLES[pathname] || "Cockpit Hub";

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar sync={sync} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="print-shift lg:pl-64">
        <header className="app-header fixed left-0 right-0 top-0 z-30 bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-64">
          <div className="flex h-20 items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button className="no-print rounded p-1 hover:bg-surface-container-high lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
              <Logo />
              <div className="hidden h-6 w-px bg-surface-container-highest sm:block" />
              <div className="hidden min-w-0 items-center gap-2 truncate sm:flex">
                <span className="truncate text-body-md text-secondary">SAP HCM to SAP SuccessFactors Migration</span>
                <Icon name="chevron_right" size={16} className="text-secondary" />
                <span className="truncate rounded-md bg-surface-container-low px-2 py-0.5 text-title-md font-semibold">{page}</span>
              </div>
            </div>
            <div className="no-print flex shrink-0 items-center gap-3">
              <div className="hidden items-center gap-1.5 rounded-full border border-surface-container-highest bg-surface-container px-3 py-1.5 xl:flex">
                <span className={`h-2 w-2 rounded-full ${ok ? "animate-pulse bg-emerald-600" : sys.loading ? "bg-amber-500" : "bg-error"}`} />
                <span className="text-label-xs font-bold uppercase tracking-wider text-secondary">{ok ? "Connected · Live discovery" : sys.loading ? "Connecting…" : "Backend unreachable"}</span>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded bg-primary-container px-3 py-1.5 text-title-md text-on-primary hover:bg-primary">
                <Icon name="picture_as_pdf" size={16} /><span className="hidden md:inline">Export Report</span>
              </button>
            </div>
          </div>

          {/* Collapsible system header */}
          <div className="border-t border-surface-container-highest bg-surface px-4 py-2 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              {metaOpen ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <Meta label="System" value={d?.systemName} />
                  <Meta label="Destination" value={d?.logicalDestination} />
                  <Meta label="Operating System" value={d?.operatingSystem} />
                  <Meta label="Database" value={d?.databaseSystem} />
                </div>
              ) : (
                <span className="text-body-sm text-secondary">System: <b className="text-on-surface">{d?.systemName ?? "—"}</b> · details hidden</span>
              )}
              <button onClick={() => setMetaOpen((o) => !o)} className="no-print flex shrink-0 items-center gap-1 text-label-xs font-bold uppercase tracking-wider text-secondary hover:text-primary" aria-expanded={metaOpen}>
                <Icon name={metaOpen ? "unfold_less" : "unfold_more"} size={16} />
                {metaOpen ? "Hide" : "Metadata"} Details
              </button>
            </div>
          </div>
        </header>
        <main className="min-h-screen px-4 pb-10 pt-36 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
