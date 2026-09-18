import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/* Layouts */
import SystemLayout from "../components/layouts/SystemLayout";
import TenantLayout from "../components/layouts/TenantLayout";

/* Pages */
import Login from "../features/auth/Login";
import Dashboard from "../features/dashboard/Dashboard";
import Projects from "../features/projects/Projects";
import CreateProject from "../features/projects/CreateProject";
import ProjectDetails from "../features/projects/ProjectDetails";
import Clients from "../features/clients/Clients";
import ClientDetails from "../features/clients/ClientDetails";
import CreateClient from "../features/clients/CreateClient";
import Invoices from "../features/invoices/Invoices";
import CreateInvoices from "../features/invoices/CreateInvoices";
import InvoiceDetails from "../features/invoices/InvoiceDetails";
import CreatePayment from "../features/payments/CreatePayments";
import Payments from "../features/payments/Payments";
import PaymentDetails from "../features/payments/PaymentDetails";
import Users from "../features/users/Users";
import UserDetails from "../features/users/UserDetails";
import CreateUser from "../features/users/CreateUser";
import ClientInvoiceDetails from "../features/invoices/ClientInvoiceDetails";
import InvoiceRequests from "../features/invoices/InvoiceRequests";

/* System */
import SystemDashboard from "../features/system/SystemDashboard";
import Tenants from "../features/system/TenantManagement";
import CreateCompany from "../features/system/CreateCompany";
import TenantDetails from "../features/system/TenantDetails";
import SuperAdminProfile from "../features/system/SuperAdminProfile";
import SystemSettings from "../features/system/SystemSettings";
import Managers from "../features/system/Managers";
import Roles from "../features/Roles/Roles";
import RolePermissions from "../features/Roles/RolePermissions";
import Ledger from "../features/ledger/ledger";
import CompanyInvoices from "../features/system/CompanyInvoices";
import ClientInvoices from "../features/invoices/ClientInvoices";
import ClientPayments from "../features/payments/ClientPayments";
import ClientPaymentDetails from "../features/payments/ClientPaymentDetails";
import ClientStatement from "../features/clients/ClientStatement";
import AuditLogPage from "../features/audit/AuditLog";
import CompanySettings from "../features/settings/CompanySettings";
import MyProfile from "../features/profile/MyProfile";

export const router = createBrowserRouter([
  /* ROOT */
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  /* AUTH */
  {
    path: "/login",
    element: <Login />,
  },

  /* SYSTEM ADMIN */
  {
    path: "/system",
    element: (
      <ProtectedRoute systemOnly={true}>
        <SystemLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SystemDashboard /> },
      { path: "dashboard", element: <SystemDashboard /> },
      {
        path: "tenants",
        element: <ProtectedRoute permission="COMPANY_VIEW"><Tenants /></ProtectedRoute>,
      },
      {
        path: "tenants/:id",
        element: <ProtectedRoute permission="COMPANY_VIEW"><TenantDetails /></ProtectedRoute>,
      },
      {
        path: "edit-company/:id",
        element: <ProtectedRoute permission="COMPANY_UPDATE"><CreateCompany /></ProtectedRoute>,
      },
      {
        path: "create-company",
        element: <ProtectedRoute permission="COMPANY_CREATE"><CreateCompany /></ProtectedRoute>,
      },
      {
        path: "company-invoices/:id",
        element: <ProtectedRoute permission="COMPANY_VIEW"><CompanyInvoices /></ProtectedRoute>,
      },
      { path: "profile", element: <SuperAdminProfile /> },
      {
        path: "settings",
        element: <ProtectedRoute permission="SETTINGS_VIEW"><SystemSettings /></ProtectedRoute>,
      },
      {
        path: "managers",
        element: <ProtectedRoute superAdminExclusive={true}><Managers /></ProtectedRoute>,
      },
    ],
  },

  /* TENANT APP */
  {
    path: "/tenant/:tenantId",
    element: (
      <ProtectedRoute>
        <TenantLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },

      {
        path: "projects",
        element: (
          <ProtectedRoute permission="PROJECT_VIEW">
            <Projects />
          </ProtectedRoute>
        ),
      },

      {
        path: "projects/create",
        element: (
          <ProtectedRoute permission="PROJECT_CREATE">
            <CreateProject />
          </ProtectedRoute>
        ),
      },

      {
        path: "projects/edit/:id",
        element: (
          <ProtectedRoute permission="PROJECT_UPDATE">
            <CreateProject />
          </ProtectedRoute>
        ),
      },

      {
        path: "projects/:id",
        element: (
          <ProtectedRoute permission="PROJECT_VIEW">
            <ProjectDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <ProtectedRoute permission="CLIENT_VIEW">
            <Clients />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients/create",
        element: (
          <ProtectedRoute permission="CLIENT_CREATE">
            {" "}
            <CreateClient />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "clients/edit/:id",
        element: (
          <ProtectedRoute permission="CLIENT_UPDATE">
            {" "}
            <CreateClient />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "clients/:id",
        element: (
          <ProtectedRoute permission="CLIENT_VIEW">
            <ClientDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoices/client",
        element: (
          <ProtectedRoute permission="INVOICE_VIEW">
            <ClientInvoices />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoices/client/:id",
        element: (
          <ProtectedRoute permission="INVOICE_VIEW">
            <ClientInvoiceDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoices",
        element: (
          <ProtectedRoute permission="INVOICE_VIEW">
            <Invoices />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoices/create",
        element: (
          <ProtectedRoute permission="INVOICE_CREATE">
            <CreateInvoices />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoices/:id",
        element: (
          <ProtectedRoute permission="INVOICE_VIEW">
            <InvoiceDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoices/edit/:id",
        element: (
          <ProtectedRoute permission="INVOICE_UPDATE">
            <CreateInvoices />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoice-requests",
        element: (
          <ProtectedRoute permission="INVOICE_VIEW">
            <InvoiceRequests />
          </ProtectedRoute>
        ),
      },

      {
        path: "payments",
        element: (
          <ProtectedRoute permission="PAYMENT_VIEW">
            <Payments />
          </ProtectedRoute>
        ),
      },
      {
        path: "payments/create",
        element: (
          <ProtectedRoute permission="PAYMENT_CREATE">
            <CreatePayment />
          </ProtectedRoute>
        ),
      },
      {
        path: "payments/:id",
        element: (
          <ProtectedRoute permission="PAYMENT_VIEW">
            <PaymentDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "payments/edit/:id",
        element: (
          <ProtectedRoute permission="PAYMENT_UPDATE">
            <CreatePayment />
          </ProtectedRoute>
        ),
      },
      {
        path: "payments/client",
        element: (
          <ProtectedRoute permission="PAYMENT_VIEW">
            <ClientPayments />
          </ProtectedRoute>
        ),
      },
      {
        path: "payments/client/:id",
        element: (
          <ProtectedRoute permission="PAYMENT_VIEW">
            <ClientPaymentDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute permission="USER_MANAGE">
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/:id",
        element: (
          <ProtectedRoute permission="USER_MANAGE">
            <UserDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/create",
        element: (
          <ProtectedRoute permission="USER_CREATE">
            {" "}
            <CreateUser />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "users/edit/:id",
        element: (
          <ProtectedRoute permission="USER_UPDATE">
            {" "}
            <CreateUser />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "ledger",
        element: (
          <ProtectedRoute permission="LEDGER_VIEW">
            <Ledger />
          </ProtectedRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <ProtectedRoute permission="ROLE_MANAGE">
            <Roles />
          </ProtectedRoute>
        ),
      },

      {
        path: "roles/:id",
        element: (
          <ProtectedRoute permission="ROLE_MANAGE">
            <RolePermissions />
          </ProtectedRoute>
        ),
      },

      /* ── CLIENT STATEMENT ── */
      {
        path: "clients/:id/statement",
        element: (
          <ProtectedRoute permission="CLIENT_VIEW">
            <ClientStatement />
          </ProtectedRoute>
        ),
      },

      /* ── AUDIT LOG ── */
      {
        path: "audit",
        element: (
          <ProtectedRoute permission="ROLE_MANAGE">
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },

      /* ── COMPANY SETTINGS ── */
      {
        path: "settings",
        element: (
          <ProtectedRoute permission="ROLE_MANAGE">
            <CompanySettings />
          </ProtectedRoute>
        ),
      },

      /* ── MY PROFILE — all authenticated tenant users ── */
      {
        path: "my-profile",
        element: (
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "system/create-company",
        element: (
          <ProtectedRoute systemOnly={true}>
            <CreateCompany />
          </ProtectedRoute>
        ),
      },
      {
        path: "system/projects",
        element: (
          <ProtectedRoute systemOnly={true}>
            <Projects />
          </ProtectedRoute>
        ),
      },
      {
        path: "system/users",
        element: (
          <ProtectedRoute systemOnly={true}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "system/invoices",
        element: (
          <ProtectedRoute systemOnly={true}>
            <Invoices />
          </ProtectedRoute>
        ),
      },
      {
        path: "system/payments",
        element: (
          <ProtectedRoute systemOnly={true}>
            <Payments />
          </ProtectedRoute>
        ),
      },
      {
        path: "system/clients",
        element: (
          <ProtectedRoute systemOnly={true}>
            <Clients />
          </ProtectedRoute>
        ),
      },
    ],
  },

  /* FALLBACK */
  {
    path: "/unauthorized",
    element: (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">403 — Unauthorized</h1>
          <p className="mt-2 text-sm">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    ),
  },
  {
    path: "*",
    element: (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">404 — Page Not Found</h1>
          <p className="mt-2 text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    ),
  },
]);

