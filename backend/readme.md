# Urbanfeat ERP — Backend

REST API for the Urbanfeat ERP SaaS platform. Built with Node.js, Express, Prisma ORM, and PostgreSQL. Supports multi-tenant isolation, JWT authentication, role-based access control, and file uploads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Queue | BullMQ + Redis |
| File Upload | Multer |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Winston |
| Validation | Zod |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # DB models (SystemUser, Tenant, User, Client, Invoice, …)
│   ├── migrations/         # Auto-generated SQL migrations
│   └── seed.js             # Seeds super admin + sample tenant on first run
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
│   │   ├── auth.routes.js          # POST /api/auth/login, POST /api/auth/super-login
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

## Running via Docker (recommended)

The backend runs as part of the Docker Compose stack. From the project root:

```bash
docker compose up -d
```

API is available at **http://localhost:5001**

Rebuild after code changes:

```bash
docker compose build backend
docker compose up -d backend
```

---

## Environment Variables

Set in `backend/.env` — picked up automatically by Docker Compose:

```env
DATABASE_URL="postgresql://erpnew:erpnew123@erpnew-db:5432/erpnew"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES="7d"
NODE_ENV="production"
REDIS_URL="redis://erpnew-redis:6379"

SUPER_ADMIN_NAME="Your Name"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="changeme"
```

---

## API Endpoints

### Public (no auth required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Tenant user login — returns JWT |
| POST | `/api/auth/super-login` | Super admin login — returns JWT |
| GET | `/health` | Health check |

### Protected (requires `Authorization: Bearer <token>`)

All tenant routes are scoped: `/api/:tenantId/...`

The `tenantId` in the URL must match the `tenantId` inside the JWT.

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
| POST | `/api/:tenantId/invoices/:id/confirm-payment` | Mark PAID + auto-create payment + ledger entry |
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

Super admin uses `POST /api/auth/super-login` — token contains `{ id, role: "SUPER_ADMIN" }` with no `tenantId`.

---

## Invoice Payment Flow

```
DRAFT → PENDING → APPROVED → PAID
                           ↘ OVERDUE (via scheduled job)
```

- **PENDING** — invoice created, awaiting approval
- **APPROVED** — manager/admin approved it
- **PAID** — payment confirmed via `POST /invoices/:id/confirm-payment`  
  (atomic transaction: creates Payment + marks Invoice PAID + creates Ledger entry)

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

```bash
# Connect directly
docker exec -it erpnew-erpnew-db-1 psql -U erpnew -d erpnew

# Run Prisma Studio (local dev only)
npx prisma studio
```

Schema auto-migrates on container startup.

---

## Author

Vineet Tiwari
