import { Route, Routes } from "react-router";

import AppLayout from "@/components/app-layout";
import RequireAuth from "@/components/require-auth";
import DashboardPage from "@/pages/dashboard";
import DepartmentsPage from "@/pages/departments";
import EmployeesPage from "@/pages/employees";
import LoginPage from "@/pages/login";
import OrgChartPage from "@/pages/org-chart";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/org-chart" element={<OrgChartPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
      </Route>
    </Routes>
  );
}
