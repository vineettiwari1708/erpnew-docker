# Urbanfeat ERP — Frontend

A multi-tenant ERP SaaS application built for service businesses to manage clients, projects, invoices, payments, and ledger — all under a single platform with role-based access control.

---

## What This App Does

Urbanfeat ERP lets companies (tenants) run their entire service workflow from one dashboard:

- Onboard clients and track their projects
- Raise invoices, get them approved, and confirm payments
- Maintain a full ledger of all financial transactions
- Manage team members with fine-grained role and permission control
- Super admin can manage all companies (tenants) from a system-level dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router DOM v6 (`createBrowserRouter`) |
| State | Redux Toolkit + React Redux |
| Styling | Tailwind CSS |
| HTTP | Axios |
| PDF | @react-pdf/renderer |
| Charts | Recharts |
| Icons | Lucide React |
| Tables | TanStack React Table |
| Notifications | react-hot-toast |

---

## Roles & Access

The app has two levels of access:

**System level** (across all tenants):
- `SUPER_ADMIN` — manages all companies, can create tenants, view all data

**Tenant level** (within one company):
- `ADMIN` — full access to everything inside the tenant
- `MANAGER` — can view and manage clients, projects, approve invoices and payments
- `ACCOUNT` — handles invoices, payments, and ledger
- `CLIENT` — read-only access to their own projects, invoices, and payments

Access to every route and UI element is controlled by **29 granular permissions** (e.g. `INVOICE_APPROVE`, `PAYMENT_CREATE`, `USER_MANAGE`). Sidebar menus, buttons, and actions only appear if the logged-in user has the required permission.

---

## Modules

### Dashboard
Summary cards showing total clients, active projects, pending invoices, and recent payments with revenue stats.

### Clients
Create and manage clients with company info, contact details, and status. Client detail page shows linked projects, invoices, and payments in one view.

### Projects
Track projects per client with status (ACTIVE / ON_HOLD / COMPLETED). Each project links back to its client.

### Invoices
Full invoice lifecycle:
1. Create invoice with line items, tax, and discount
2. Manager/Admin approves it (PENDING → APPROVED)
3. Admin confirms offline payment with proof upload (APPROVED → PAID)

Includes PDF preview and download per invoice.

### Payments
Record and track payments with method (Cash, UPI, Bank Transfer, Card, Cheque), transaction ID, paid date, and proof image/PDF upload. Payments link to both the invoice and the client.

### Ledger
Read-only view of all financial entries (CREDIT / DEBIT) auto-generated from confirmed payments.

### Users
Admin can add and manage team members, assign roles, and set account status.

### Roles & Permissions
View role-to-permission mappings. Admin can see what each role can access.

### System (Super Admin only)
- Manage all tenant companies
- View per-tenant data
- Create new tenants

---

## Project Structure

```
src/
├── components/
│   └── layouts/
│       ├── Header.jsx        # Top nav — tenant context from Redux auth state
│       └── Sidebar.jsx       # Permission-gated navigation links
├── features/                 # One folder per module
│   ├── auth/                 # Login, auth slice, token handling
│   ├── clients/
│   ├── dashboard/
│   ├── invoices/
│   ├── ledger/
│   ├── payments/
│   ├── projects/
│   ├── Roles/
│   ├── system/               # Super admin panel (tenants, system users)
│   └── users/
│       └── UserDetails.jsx   # Shows userNumber + tenant name (not raw UUID)
├── guards/                   # RoleGuard, PermissionGuard route wrappers
├── pdf/                      # Invoice and payment PDF templates
├── routes/
│   └── routes.jsx            # Main router definition (createBrowserRouter)
├── services/api/             # Axios API layer — calls backend at /api
├── store/                    # Redux store, auth slice, typed hooks
└── utils/                    # Permission helpers, formatters
```

---

## Running via Docker (recommended)

The frontend is built and served by nginx as part of the Docker Compose stack:

```bash
docker compose up -d
```

App is available at **http://localhost:3001**

Rebuild after code changes:

```bash
docker compose build frontend
docker compose up -d frontend
```

---

## URL Structure

| URL | Who uses it |
|---|---|
| `http://localhost:3001` | Super admin login + dashboard |
| `http://localhost:3001/tenant/:slug` | Tenant user login |
| `http://localhost:3001/tenant/:slug/*` | All tenant module pages |

The tenant `slug` (e.g. `urbanfeat-construction`) comes from the `Tenant` record in the database and is stored in the Redux auth state after login.

---

## Backend

API runs at **http://localhost:5001**. The frontend communicates via Axios with the `Authorization: Bearer <token>` header on all protected routes. See `backend/readme.md` for the full API reference.

---

## Author

Vineet Tiwari
