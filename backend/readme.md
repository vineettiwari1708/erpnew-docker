# Urbanfeat ERP — Backend

REST API for the Urbanfeat ERP SaaS platform. Built with Node.js, Express, Prisma ORM, and PostgreSQL. Supports multi-tenant isolation, JWT authentication, role-based access control, and file uploads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Upload | Multer |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Dev Server | Nodemon |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # 15 models, 9 enums
│   ├── migrations/         # Auto-generated SQL migrations
│   └── seed.js             # Seed data (tenants, roles, users, clients, invoices)
│
├── src/
│   ├── config/
│   │   └── db.js           # Prisma singleton client
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification → sets req.user
│   │   ├── tenant.middleware.js    # URL tenantId must match JWT tenantId
│   │   ├── upload.middleware.js    # Multer config for payment proof files
│   │   └── error.middleware.js     # Centralized error handler (registered last)
│   │
│   ├── routes/
│   │   ├── auth.routes.js          # POST /api/auth/login
│   │   ├── dashboard.routes.js     # GET  /api/:tenantId/dashboard
│   │   ├── user.routes.js          # CRUD /api/:tenantId/users
│   │   ├── client.routes.js        # CRUD /api/:tenantId/clients
│   │   ├── project.routes.js       # CRUD /api/:tenantId/projects
│   │   ├── invoice.routes.js       # CRUD + approve + confirm-payment
│   │   ├── payment.routes.js       # CRUD + file upload
│   │   └── ledger.routes.js        # GET  /api/:tenantId/ledger (read-only)
│   │
│   └── server.js           # App entry point, middleware chain, route mounting
│
├── uploads/
│   └── proofs/             # Uploaded payment proof files (auto-created)
│
├── docs/
│   ├── schema-diagram.html         # Interactive ER diagram (browser)
│   └── schema-er-print.html        # A4 print-ready ER diagram
│
├── .env                    # Environment variables
└── package.json
```

---

## Getting Started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Create or update `.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/saas_db"
JWT_SECRET="your_secret_key_here"
JWT_EXPIRES="7d"
NODE_ENV="development"
```

### 3. Run database migration

```bash
npx prisma migrate dev --name init
```

### 4. Seed sample data

```bash
npm run prisma:seed
```

Seeds: 2 tenants, 4 roles, 29 permissions, 4 users, 2 clients, 2 projects, 2 invoices, 1 payment, 1 ledger entry.

### 5. Start dev server

```bash
npm run dev
```

Server runs at `http://localhost:5001`

---

## API Endpoints

### Public (no auth required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email + password, returns JWT |
| GET | `/health` | Health check |

### Protected (requires `Authorization: Bearer <token>`)

All protected routes are scoped to a tenant: `/api/:tenantId/...`

The `tenantId` in the URL must match the `tenantId` inside the JWT token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/:tenantId/dashboard` | Summary stats (clients, projects, revenue) |
| GET/POST | `/api/:tenantId/users` | List / create users |
| GET/PUT/DELETE | `/api/:tenantId/users/:id` | Get / update / soft-delete user |
| GET/POST | `/api/:tenantId/clients` | List / create clients |
| GET/PUT/DELETE | `/api/:tenantId/clients/:id` | Get / update / soft-delete client |
| GET/POST | `/api/:tenantId/projects` | List / create projects |
| GET/PUT/DELETE | `/api/:tenantId/projects/:id` | Get / update / delete project |
| GET/POST | `/api/:tenantId/invoices` | List / create invoices |
| GET/PUT/DELETE | `/api/:tenantId/invoices/:id` | Get / update / soft-delete invoice |
| PATCH | `/api/:tenantId/invoices/:id/approve` | Approve invoice (PENDING → APPROVED) |
| POST | `/api/:tenantId/invoices/:id/confirm-payment` | Mark invoice PAID + auto-create payment + ledger entry |
| GET/POST | `/api/:tenantId/payments` | List / create payments (supports file upload) |
| GET/PUT/DELETE | `/api/:tenantId/payments/:id` | Get / update / soft-delete payment |
| GET | `/api/:tenantId/ledger` | List ledger entries (read-only) |

---

## Authentication Flow

1. `POST /api/auth/login` with `{ email, password }`
2. Server returns `{ user, token }` — token contains `{ id, tenantId, role, permissions }`
3. Add header to all requests: `Authorization: Bearer <token>`
4. `authMiddleware` verifies the token and sets `req.user`
5. `tenantMiddleware` ensures the URL `tenantId` matches the token's `tenantId`

---

## Invoice Payment Flow

```
DRAFT → PENDING → APPROVED → PAID
                          ↘ OVERDUE (via cron)
```

- **PENDING** — invoice created, awaiting approval
- **APPROVED** — manager/admin approved it
- **PAID** — payment confirmed via `POST /invoices/:id/confirm-payment` (atomic transaction: creates Payment record + marks Invoice PAID + creates Ledger entry)

---

## File Uploads

Payment proofs are uploaded via `multipart/form-data`.

- Field name: `proof`
- Accepted types: JPG, PNG, PDF
- Max size: 5 MB
- Stored at: `backend/uploads/proofs/`
- Served publicly at: `http://localhost:5001/uploads/proofs/<filename>`

---

## Database

View and edit data using Prisma Studio:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

---

## Seeded Test Accounts

| Email | Password | Role | Tenant |
|---|---|---|---|
| admin@acme.com | admin123 | ADMIN | tnt_001 (Acme) |
| manager@acme.com | manager123 | MANAGER | tnt_001 (Acme) |
| accounts@acme.com | accounts123 | ACCOUNT | tnt_001 (Acme) |
| client@abc.com | client123 | CLIENT | tnt_001 (Acme) |

---

## Author

Vineet Tiwari — vineettiwari1708@gmail.com
