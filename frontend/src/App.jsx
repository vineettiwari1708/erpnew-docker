import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ── LAYOUTS ── */
import TenantLayout from "./components/layouts/TenantLayout";
import SystemLayout from "./components/layouts/SystemLayout";

/* ── GUARDS ── */
import RoleGuard from "./guards/RoleGuard";

/* ── FEATURES ── */
import Login          from "./features/auth/Login";
import Dashboard      from "./features/dashboard/Dashboard";
import Projects       from "./features/projects/Projects";

import Clients        from "./features/clients/Clients";
import ClientDetails  from "./features/clients/ClientDetails";

import Invoices             from "./features/invoices/Invoices";
import InvoiceDetails       from "./features/invoices/InvoiceDetails";
import ClientInvoices       from "./features/invoices/ClientInvoices";
import ClientInvoiceDetails from "./features/invoices/ClientInvoiceDetails";

import Payments             from "./features/payments/Payments";
import PaymentDetails       from "./features/payments/PaymentDetails";
import ClientPayments       from "./features/payments/ClientPayments";
import ClientPaymentDetails from "./features/payments/ClientPaymentDetails";

import Users          from "./features/users/Users";
import UserDetails    from "./features/users/UserDetails";
import CreateUser     from "./features/users/CreateUser";
import Ledger         from "./features/ledger/Ledger";
import Roles          from "./features/Roles/Roles";
import RolePermissions from "./features/Roles/RolePermissions";
import SystemDashboard      from "./features/system/SystemDashboard";
import SuperAdminProfile   from "./features/system/SuperAdminProfile";
import SystemSettings      from "./features/system/SystemSettings";
import CreateClient    from "./features/clients/CreateClient";
import CreateProject   from "./features/projects/CreateProject";
import ProjectDetails  from "./features/projects/ProjectDetails";
import AuditLogPage      from "./features/audit/AuditLog";
import ClientStatement   from "./features/clients/ClientStatement";
import CompanySettings   from "./features/settings/CompanySettings";
import MyProfile         from "./features/profile/MyProfile";

/* ── APP ── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/"      element={<Navigate to="/login" replace />} />

        {/* ======================================================
            TENANT ROUTES  —  all pages under /tenant/:tenantId/
            TenantLayout renders Sidebar + Header + <Outlet />
        ====================================================== */}
        <Route
          path="/tenant/:tenantId"
          element={<TenantLayout />}
        >
          {/* DASHBOARD */}
          <Route
            path="dashboard"
            element={
              <RoleGuard permission="DASHBOARD_VIEW">
                <Dashboard />
              </RoleGuard>
            }
          />

          {/* PROJECTS */}
          <Route
            path="projects"
            element={
              <RoleGuard permission="PROJECT_VIEW">
                <Projects />
              </RoleGuard>
            }
          />
          <Route
            path="projects/create"
            element={
              <RoleGuard permission="PROJECT_CREATE">
                <CreateProject />
              </RoleGuard>
            }
          />
          <Route
            path="projects/:id"
            element={
              <RoleGuard permission="PROJECT_VIEW">
                <ProjectDetails />
              </RoleGuard>
            }
          />

          {/* CLIENTS */}
          <Route
            path="clients"
            element={
              <RoleGuard permission="CLIENT_VIEW">
                <Clients />
              </RoleGuard>
            }
          />
          <Route
            path="clients/create"
            element={
              <RoleGuard permission="CLIENT_CREATE">
                <CreateClient />
              </RoleGuard>
            }
          />
          <Route
            path="clients/edit/:id"
            element={
              <RoleGuard permission="CLIENT_UPDATE">
                <CreateClient />
              </RoleGuard>
            }
          />
          <Route
            path="clients/:id/statement"
            element={
              <RoleGuard permission="CLIENT_VIEW">
                <ClientStatement />
              </RoleGuard>
            }
          />
          <Route
            path="clients/:id"
            element={
              <RoleGuard permission="CLIENT_VIEW">
                <ClientDetails />
              </RoleGuard>
            }
          />

          {/* INVOICES — static sub-paths before dynamic :id */}
          <Route
            path="invoices"
            element={
              <RoleGuard permission="INVOICE_VIEW">
                <Invoices />
              </RoleGuard>
            }
          />
          <Route
            path="invoices/client"
            element={
              <RoleGuard permission="INVOICE_VIEW">
                <ClientInvoices />
              </RoleGuard>
            }
          />
          <Route
            path="invoices/client/:id"
            element={
              <RoleGuard permission="INVOICE_VIEW">
                <ClientInvoiceDetails />
              </RoleGuard>
            }
          />
          <Route
            path="invoices/:id"
            element={
              <RoleGuard permission="INVOICE_VIEW">
                <InvoiceDetails />
              </RoleGuard>
            }
          />

          {/* PAYMENTS — static sub-paths before dynamic :id */}
          <Route
            path="payments"
            element={
              <RoleGuard permission="PAYMENT_VIEW">
                <Payments />
              </RoleGuard>
            }
          />
          <Route
            path="payments/client"
            element={
              <RoleGuard permission="PAYMENT_VIEW">
                <ClientPayments />
              </RoleGuard>
            }
          />
          <Route
            path="payments/client/:id"
            element={
              <RoleGuard permission="PAYMENT_VIEW">
                <ClientPaymentDetails />
              </RoleGuard>
            }
          />
          <Route
            path="payments/:id"
            element={
              <RoleGuard permission="PAYMENT_VIEW">
                <PaymentDetails />
              </RoleGuard>
            }
          />

          {/* USERS */}
          <Route
            path="users"
            element={
              <RoleGuard permission="USER_MANAGE">
                <Users />
              </RoleGuard>
            }
          />
          <Route
            path="users/create"
            element={
              <RoleGuard permission="USER_CREATE">
                <CreateUser />
              </RoleGuard>
            }
          />
          <Route
            path="users/edit/:id"
            element={
              <RoleGuard permission="USER_UPDATE">
                <CreateUser />
              </RoleGuard>
            }
          />
          <Route
            path="users/:id"
            element={
              <RoleGuard permission="USER_VIEW">
                <UserDetails />
              </RoleGuard>
            }
          />

          {/* LEDGER */}
          <Route
            path="ledger"
            element={
              <RoleGuard permission="LEDGER_VIEW">
                <Ledger />
              </RoleGuard>
            }
          />

          {/* ROLES */}
          <Route
            path="roles"
            element={
              <RoleGuard permission="ROLE_MANAGE">
                <Roles />
              </RoleGuard>
            }
          />
          <Route
            path="roles/:id"
            element={
              <RoleGuard permission="ROLE_MANAGE">
                <RolePermissions />
              </RoleGuard>
            }
          />

          {/* AUDIT LOG */}
          <Route
            path="audit"
            element={
              <RoleGuard permission="ROLE_MANAGE">
                <AuditLogPage />
              </RoleGuard>
            }
          />

          {/* COMPANY SETTINGS */}
          <Route
            path="settings"
            element={
              <RoleGuard permission="ROLE_MANAGE">
                <CompanySettings />
              </RoleGuard>
            }
          />

          {/* MY PROFILE — every authenticated tenant user can edit their own details */}
          <Route path="my-profile" element={<MyProfile />} />
        </Route>

        {/* ======================================================
            SYSTEM ROUTES  —  super admin only, no tenant prefix
            SystemLayout renders Sidebar + Header + <Outlet />
        ====================================================== */}
        <Route
          path="/system"
          element={
            <RoleGuard superAdminOnly={true}>
              <SystemLayout />
            </RoleGuard>
          }
        >
          <Route index            element={<SystemDashboard />} />
          <Route path="dashboard" element={<SystemDashboard />} />
          <Route path="profile"   element={<SuperAdminProfile />} />
          <Route path="settings"  element={<SystemSettings />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
