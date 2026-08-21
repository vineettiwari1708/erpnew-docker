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
| Routing | React Router DOM v6 |
| State | Redux Toolkit + React Redux |
| Styling | Tailwind CSS |
| HTTP | Axios |
| PDF | @react-pdf/renderer |
| Charts | Recharts |
| Icons | Lucide React |
| Tables | TanStack React Table |

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
- View per-tenant invoices
- Create new tenants

---

## Project Structure

```
src/
├── assets/mockData/       # Local mock data (clients, invoices, payments, etc.)
├── components/layout/     # Sidebar, Header, layout wrappers
├── features/              # One folder per module (auth, clients, invoices, ...)
│   ├── auth/
│   ├── clients/
│   ├── dashboard/
│   ├── invoices/
│   ├── ledger/
│   ├── payments/
│   ├── projects/
│   ├── Roles/
│   ├── system/            # Super admin panel
│   └── users/
├── guards/                # RoleGuard, PermissionGuard route wrappers
├── pdf/                   # Invoice and payment PDF templates
├── services/api/          # API layer (currently mock, ready for real backend)
├── store/                 # Redux store, auth slice, hooks
└── utils/                 # Permission helpers, PDF generators
```

---

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Backend

The backend is a Node.js + Express + Prisma (PostgreSQL) API at `http://localhost:5001`.

The frontend currently uses mock data. To connect to the real backend, replace the mock imports in `src/services/api/` with axios calls to the live API.

---

## Author

Vineet Tiwari — vineettiwari1708@gmail.com
