import { Link, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Card, Icon, PageHeader } from "./components/ui";
import Overview from "./pages/Overview";
import CoreProcesses from "./pages/CoreProcesses";
import PersonnelAdmin from "./pages/PersonnelAdmin";
import OrganizationalManagement from "./pages/OrganizationalManagement";
import PayrollAccounting from "./pages/PayrollAccounting";
import TimeManagement from "./pages/TimeManagement";

function ComingSoon({ title }) {
  return (
    <>
      <PageHeader eyebrow="Assessment module" title={title} subtitle="This module's backend endpoints haven't been wired up yet." />
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon name="construction" size={40} className="text-secondary" />
        <p className="text-body-md text-secondary">Nothing to show here yet.</p>
        <Link to="/hcm-core" className="rounded bg-primary-container px-4 py-2 text-title-md text-on-primary hover:bg-primary">Back to HCM Core Processes</Link>
      </Card>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="hcm-core" element={<CoreProcesses />} />
        <Route path="personnel-administration" element={<PersonnelAdmin />} />
        <Route path="organizational-management" element={<OrganizationalManagement />} />
        <Route path="payroll-accounting" element={<PayrollAccounting />} />
        <Route path="time-management" element={<TimeManagement />} />
        <Route path="migration-readiness" element={<ComingSoon title="Migration Readiness" />} />
        <Route path="system-telemetry" element={<ComingSoon title="System Telemetry" />} />
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Route>
    </Routes>
  );
}
