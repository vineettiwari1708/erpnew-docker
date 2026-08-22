# erpnew — Multi-Tenant SaaS ERP

A multi-tenant Enterprise Resource Planning (ERP) platform built on Node.js, React, and PostgreSQL. Each tenant gets isolated data behind a shared backend, accessed via their own URL slug.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Queue / Cache | Redis, BullMQ |
| Auth | JWT (stateless) |
| Containerisation | Docker Compose |

**Key libraries:** `axios`, `@tanstack/react-table`, `react-pdf/renderer`, `recharts`, `lucide-react`, `react-hot-toast`, `stripe`, `zod`, `helmet`, `winston`, `express-rate-limit`, `multer`

---

## Services & Ports

| Container | Role | URL |
|---|---|---|
| `erpnew-frontend` | React SPA | http://localhost:3001 |
| `erpnew-backend` | REST API | http://localhost:5001 |
| `erpnew-db` | PostgreSQL | localhost:5432 |
| `erpnew-redis` | Redis | internal only |

---

## Getting Started

### Prerequisites
- Docker Desktop (Windows / Mac / Linux)
- Docker Compose v2

### Run

```bash
cd d:\Project\erpnew-docker
docker compose up -d
```

Frontend: **http://localhost:3001**  
API: **http://localhost:5001**

### Stop

```bash
docker compose down
```

---

## Login

Credentials are configured via the backend `.env` file before first run (see Environment Variables below).

| Role | URL |
|---|---|
| Super Admin | http://localhost:3001 |
| Tenant User | http://localhost:3001/tenant/:slug |

---

## Multi-Tenant Architecture

- **`SystemUser`** table — super admins only; can create and manage tenants
- **`Tenant`** table — one row per company; each has a `slug` (e.g. `urbanfeat-construction`)
- **`User`** table — tenant-level users; always scoped to exactly one tenant
- Frontend routes: `/tenant/:slug/*` for tenant users; `/admin/*` for super admins
- JWT tokens carry the tenant slug; all API calls are scoped to the authenticated tenant

---

## Environment Variables

Backend `.env` (at `d:\Project\erpnew-docker\backend\.env`):

```env
DATABASE_URL="postgresql://erpnew:erpnew123@erpnew-db:5432/erpnew"
JWT_SECRET="your-jwt-secret"
REDIS_URL="redis://erpnew-redis:6379"

SUPER_ADMIN_NAME="Your Name"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="changeme"
```

---

## Rebuild After Code Changes

```bash
# Rebuild one service
docker compose build backend
docker compose build frontend

# Restart after rebuild
docker compose up -d backend
docker compose up -d frontend

# Full rebuild
docker compose up -d --build
```

---

## Re-seed the Database

The backend seeds the super admin on startup if no `SystemUser` exists.  
To force a re-seed (e.g. after credential changes in `.env`):

```bash
docker compose down
docker volume rm erpnew-docker_erpnew-db-data
docker compose up -d
```

> **Warning:** This deletes all tenant data. Only do this in development.

---

## Database Access

```bash
# Connect to the database
docker exec -it erpnew-erpnew-db-1 psql -U erpnew -d erpnew

# Run a quick query
docker exec erpnew-erpnew-db-1 psql -U erpnew -d erpnew -c "SELECT email FROM \"SystemUser\";"
```

---

## Taking a Database Backup

Use **ServerPilot** (see `d:\Project\serverpilot`) to back up erpnew's database:

1. Start ServerPilot: `cd d:\Project\serverpilot && docker compose up -d`
2. Open http://localhost:8082
3. Go to **Backups → + Manual Backup**
4. Type: `PostgreSQL via Docker`
5. Target: `docker+postgres://erpnew:erpnew123@erpnew-erpnew-db-1/erpnew`
6. Click **Run Backup**

Then retrieve the file:
```powershell
docker exec sp-agent-local ls /opt/serverpilot/backups
docker cp sp-agent-local:/opt/serverpilot/backups/<filename> .
```

---

## Project Structure

```
erpnew-docker/
├── backend/
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── routes/routes.jsx   # Application router
│   │   ├── features/           # Redux slices + feature components
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── tenants/
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── layouts/
│   │   │       └── Header.jsx
│   │   └── store/
│   └── Dockerfile
└── docker-compose.yml
```

---

## Key Design Notes

- **Router:** Uses `createBrowserRouter` — the router definition lives in `frontend/src/routes/routes.jsx`
- **Auth state:** `tenantSlug` is stored in Redux and `localStorage`; the `Header` uses `user?.tenantSlug` to determine navigation context
- **Data isolation:** All Prisma queries are filtered by `tenantId` at the service layer
- **Queues:** BullMQ + Redis handle async jobs (email, PDF generation, etc.)
- **Rate limiting:** Applied at the API gateway level via `express-rate-limit`
- **Logging:** Structured JSON logs via `winston`
