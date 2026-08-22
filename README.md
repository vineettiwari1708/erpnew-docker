# erpnew — Multi-Tenant SaaS ERP

A multi-tenant Enterprise Resource Planning platform built on Node.js, React, and PostgreSQL. Each tenant gets isolated data behind a shared backend, accessed via their own URL slug.

Monitored by **ServerPilot** (`d:\Project\serverpilot`) — live CPU, RAM, disk, and container metrics visible at http://localhost:8082.

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
| `erpnew-erpnew-frontend-1` | React SPA (Nginx) | http://localhost:3001 |
| `erpnew-erpnew-backend-1` | REST API | http://localhost:5001 |
| `erpnew-erpnew-db-1` | PostgreSQL | internal |

---

## Getting Started

### Prerequisites
- Docker Desktop
- Docker Compose v2

### Build Images

```bash
cd d:\Project\erpnew-docker
docker compose -f docker-compose.build.yml build
```

### Run

The project is deployed and managed via **ServerPilot**. Once ServerPilot is running:

1. Open http://localhost:8082 → **Applications → + New App**
2. Point it to the compose file and deploy

Or run directly via Docker if the images are already built:

```bash
docker compose -f docker-compose.build.yml up -d
```

Frontend: **http://localhost:3001**  
API: **http://localhost:5001**

### Stop

```bash
docker compose -f docker-compose.build.yml down
```

---

## Login

| Role | URL |
|---|---|
| Super Admin | http://localhost:3001 |
| Tenant User | http://localhost:3001/tenant/:slug |

Credentials set in backend `.env` before first run.

---

## Multi-Tenant Architecture

- **`SystemUser`** — super admins; can create and manage tenants
- **`Tenant`** — one row per company; each has a unique `slug` (e.g. `urbanfeat-construction`)
- **`User`** — tenant-scoped users; always belong to one tenant
- Frontend routes: `/tenant/:slug/*` for tenant users; `/admin/*` for super admins
- JWT tokens carry the tenant slug; all API calls are scoped to the authenticated tenant
- All Prisma queries filtered by `tenantId` at the service layer

---

## Environment Variables

`d:\Project\erpnew-docker\backend\.env`:

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
docker compose -f docker-compose.build.yml build backend
docker compose -f docker-compose.build.yml build frontend

# Rebuild all
docker compose -f docker-compose.build.yml build

# Via CI/CD (GitHub Actions self-hosted runner)
# Push to main → runner builds → ServerPilot webhook redeploys
```

---

## CI/CD Pipeline

Defined in `.github/workflows/deploy.yml`. Triggered on push to `main`:

1. GitHub Actions self-hosted runner picks up the job
2. Builds `frontend` and `backend` images via `docker-compose.build.yml`
3. Calls ServerPilot webhook → redeploys running containers

No inbound ports needed — the runner polls GitHub.

---

## Re-seed the Database

The backend seeds the super admin on startup if no `SystemUser` exists.  
To force re-seed after credential changes:

```bash
docker compose -f docker-compose.build.yml down
docker volume rm erpnew-build_erpnew-db-data
docker compose -f docker-compose.build.yml up -d
```

> **Warning:** Deletes all tenant data. Development only.

---

## Database Access

```bash
docker exec -it erpnew-erpnew-db-1 psql -U erpnew -d erpnew

# Quick query
docker exec erpnew-erpnew-db-1 psql -U erpnew -d erpnew -c "SELECT email FROM \"SystemUser\";"
```

---

## Database Backup via ServerPilot

1. Start ServerPilot: `cd d:\Project\serverpilot && docker compose up -d`
2. Open http://localhost:8082 → **Backups → + Manual Backup**
3. Type: `PostgreSQL via Docker`
4. Target: `docker+postgres://erpnew:erpnew123@erpnew-erpnew-db-1/erpnew`
5. Click **Run Backup**

Retrieve the file:

```powershell
docker exec sp-agent-local ls /opt/serverpilot/backups
docker cp sp-agent-local:/opt/serverpilot/backups/<filename> .
```

---

## ServerPilot Monitoring

To make this ERP appear as a live server in ServerPilot:

```powershell
$r = Invoke-RestMethod -Method POST -Uri "http://localhost:8081/api/agent/register" `
  -ContentType "application/json" `
  -Body '{"name":"ERP New Docker","hostname":"erpnew-docker.local","ip":"127.0.0.1","agent_secret":"change-this-agent-secret-too"}'

docker run -d --name sp-agent-erpnew `
  -e CONTROL_URL=http://host.docker.internal:8081 `
  -e AGENT_TOKEN=$($r.token) `
  -e HEARTBEAT_INTERVAL=30000 `
  -v /var/run/docker.sock:/var/run/docker.sock `
  --restart unless-stopped `
  serverpilot-agent:latest
```

---

## Project Structure

```
erpnew-docker/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── routes/routes.jsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── tenants/
│   │   │   └── ...
│   │   ├── components/layouts/
│   │   └── store/
│   └── Dockerfile
├── .github/workflows/deploy.yml   # CI/CD pipeline
└── docker-compose.build.yml       # Build-only compose file
```

---

## Key Design Notes

- **Router:** `createBrowserRouter` — defined in `frontend/src/routes/routes.jsx`
- **Auth state:** `tenantSlug` stored in Redux and `localStorage`
- **Data isolation:** All Prisma queries filtered by `tenantId` at service layer
- **Queues:** BullMQ + Redis for async jobs (email, PDF generation)
- **Rate limiting:** `express-rate-limit` at API level
- **Logging:** Structured JSON via `winston`

---

## Author

**Vineet Tiwari**
- GitHub: [@vineettiwari1708](https://github.com/vineettiwari1708)
- Email: vineettiwari1708@gmail.com

Full-stack multi-tenant SaaS ERP — Node.js backend, React frontend, PostgreSQL with Prisma, containerised with Docker.
