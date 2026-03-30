Operational Goverance Architecture 

> **Production-grade, security-hardened facility maintenance management system built for enterprise scale.**  
> Full-stack · Role-based · Audit-logged · Rate-limited · HTTPS-enforced

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Live Architecture](#2-live-architecture)
3. [Security Hardening Summary](#3-security-hardening-summary)
4. [Tech Stack](#4-tech-stack)
5. [Role System](#5-role-system)
6. [Ticket Workflow](#6-ticket-workflow)
7. [API Reference](#7-api-reference)
8. [Getting Started](#8-getting-started)
9. [Environment Variables](#9-environment-variables)
10. [Database Setup](#10-database-setup)
11. [Project Structure](#11-project-structure)
12. [Engineering Decisions](#12-engineering-decisions)
13. [Author](#13-author)

---

## 1. Project Overview

PlumFlow Desk is a **multi-role, enterprise-grade maintenance ticketing system** designed for facilities management teams operating across multiple buildings and departments. It handles the complete lifecycle of a maintenance request — from initial submission through inspection, cost estimation, finance approval, work execution, and final customer sign-off.

### What makes this production-ready

- **Zero plaintext secrets** — every credential lives in environment variables; the server refuses to start without them
- **JWT authentication** with 8-hour expiry, server-side verification, and client-side expiry pre-check
- **bcrypt password hashing** at cost factor 12 on every write path
- **7-tier rate limiting** — separate limiters for auth, account creation, ticket creation, writes, reads, and AI endpoints, each keyed by user ID (not just IP) to prevent NAT-bypass abuse
- **IDOR prevention** — every endpoint verifies the authenticated user owns or is permitted to access the requested resource before touching the database
- **Structured audit logging** via Winston — three log files (`combined`, `error`, `security`) with automatic rotation, capturing auth events, 403s, rate-limit hits, and unhandled exceptions with full request context
- **Bot and scraper blocking** — User-Agent pattern matching blocks headless browsers, curl, Python requests, scrapy, and 10+ other automation clients at the middleware layer
- **HTTPS enforcement** in production with correct `trust proxy` configuration for load-balancer deployments
- **PostgreSQL SSL** enforced in production via `getDbSslConfig()`
- **Helmet** security headers including HSTS (1 year, preload), CSP, X-Frame-Options deny, and X-Content-Type-Options

---

## 2. Live Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  React 18 · TypeScript · Vite · TailwindCSS · shadcn/ui  │
│  React Query · React Hook Form · Recharts · jsPDF        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS · Bearer JWT
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  EXPRESS REST API                         │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Helmet    │  │     CORS     │  │  Trust Proxy   │  │
│  │   Headers   │  │  Whitelist   │  │  HTTPS Redirect│  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │Bot Detection│  │  7-Tier Rate │  │  JWT Verify    │  │
│  │  UA Filter  │  │   Limiting   │  │  + Role Guard  │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Route Handlers + IDOR Checks              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Winston   │  │   Morgan     │  │  Global Error  │  │
│  │   Logger    │  │  HTTP Log    │  │   Handler      │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ SSL · Connection Pool (max 20)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (port 5433)                      │
│  users · tickets · categories · locations                │
│  workflow_history · notifications                        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Security Hardening Summary

Every item below was implemented and is verifiable in the codebase.

| Area | Implementation |
|---|---|
| Password storage | bcrypt, cost factor 12, never stored or logged in plaintext |
| Authentication | JWT (HS256), 8h expiry, server refuses start without `JWT_SECRET` |
| Token validation | `jwt.verify()` on every protected route; client pre-checks `exp` claim before refresh |
| Timing attack prevention | Dummy bcrypt hash run even when user not found |
| IDOR prevention | Ownership check in every GET/PUT/DELETE handler before DB write |
| Role enforcement | `requireRole()` middleware on all admin/manager routes |
| Rate limiting — auth | 10 requests / 15 min per IP |
| Rate limiting — account creation | 20 requests / 1 hour per IP |
| Rate limiting — ticket creation | 30 requests / 1 hour per user ID |
| Rate limiting — writes | 30 requests / 1 min per user ID |
| Rate limiting — reads | 60 requests / 1 min per user ID |
| Rate limiting — AI | 5 requests / 1 min per user ID |
| Bot blocking | UA pattern matching: curl, wget, python-requests, scrapy, headless Chrome, PhantomJS, etc. |
| Secrets | Zero hardcoded credentials; server exits on missing env vars |
| HTTPS | Enforced in production; `trust proxy` configured for load balancers |
| Database | SSL enforced in production; parameterised queries throughout (no string interpolation) |
| Security headers | Helmet: HSTS 1yr preload, CSP, X-Frame-Options deny, X-Content-Type-Options |
| Logging | Winston: `combined.log`, `error.log`, `security.log` with rotation; every 403, rate-limit hit, and auth event recorded |
| `.gitignore` | `.env`, `.env.*`, `logs/` excluded from version control |

---

## 4. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 5.4 | Build tool |
| TailwindCSS | 3.4 | Utility-first styling |
| shadcn/ui + Radix UI | latest | Accessible component library |
| React Query (TanStack) | 5.x | Server state management |
| React Hook Form + Zod | 7.x / 3.x | Form validation |
| React Router | 6.x | Client-side routing |
| Recharts | 2.x | Data visualisation |
| jsPDF + AutoTable | 2.x | PDF report generation |
| xlsx | 0.18 | Excel export |
| Axios | 1.x | HTTP client with interceptors |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 4.22 | REST API server |
| PostgreSQL | 14+ | Primary database |
| node-postgres (pg) | 8.x | DB connection pool |
| bcrypt | 5.x | Password hashing |
| jsonwebtoken | 9.x | JWT signing and verification |
| express-rate-limit | 7.x | Multi-tier rate limiting |
| helmet | 7.x | HTTP security headers |
| winston | 3.x | Structured logging |
| morgan | 1.x | HTTP access logging |
| express-validator | 7.x | Input validation |
| dotenv | 16.x | Environment variable loading |

---

## 5. Role System

The platform implements six distinct roles with strictly enforced permissions at the API layer.

| Role | Key Permissions |
|---|---|
| `PLATFORM_ADMIN` | Full system access — user management, all tickets, all settings |
| `HEAD` | View and manage all tickets, approve estimations, assign technicians |
| `MAINTENANCE_TEAM` | Manage ticket workflow, create estimations, assign technicians |
| `TECHNICIAN` | View assigned tickets only, update work status, upload completion reports |
| `REPORTER` | Submit tickets, view own tickets only, approve/reject completed work |
| `FINANCE_TEAM` | View finance-stage tickets, approve/reject invoices and budgets |

Role checks are enforced at two layers:
1. `requireRole()` middleware on the route definition
2. Ownership clause in the SQL query itself (defence in depth)

---

## 6. Ticket Workflow

Tickets move through a 24-state workflow. Each transition is validated server-side against the actor's role.

```
NEW
 └─► HELP_DESK_REVIEW
      ├─► REJECTED_BY_HELP_DESK
      └─► ASSIGNED_TO_TECHNICIAN
           ├─► REJECTED_BY_TECHNICIAN
           └─► TECHNICIAN_INSPECTION
                └─► WORK_ANALYSIS
                     └─► RCA_REPORT_ADDED
                          └─► ESTIMATION_CREATED
                               └─► ESTIMATION_SUBMITTED
                                    └─► PENDING_ESTIMATION_APPROVAL
                                         ├─► ESTIMATION_REJECTED
                                         └─► ESTIMATION_APPROVED
                                              └─► PENDING_FINANCE_APPROVAL
                                                   └─► INVOICE_GENERATED
                                                        └─► INVOICE_SENT
                                                             └─► WORK_STARTED
                                                                  └─► WORK_IN_PROGRESS
                                                                       └─► WORK_COMPLETED
                                                                            └─► COMPLETION_REPORT_UPLOADED
                                                                                 └─► PENDING_CUSTOMER_APPROVAL
                                                                                      ├─► CUSTOMER_SATISFIED
                                                                                      └─► CLOSED
```

---

## 7. API Reference

All endpoints require `Authorization: Bearer <token>` unless marked public.

### Auth
| Method | Endpoint | Auth | Limiter | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Public | 10/15min per IP | Authenticate and receive JWT |
| `POST` | `/api/auth/refresh` | Required | 10/15min per IP | Refresh JWT |

### Users
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/users` | Any (scoped) | Admins get all; others get own profile |
| `POST` | `/api/users` | `PLATFORM_ADMIN` | Create user account |
| `PUT` | `/api/users/:id` | Own or `PLATFORM_ADMIN` | Update profile |
| `DELETE` | `/api/users/:id` | `PLATFORM_ADMIN` | Deactivate user |

### Tickets
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | Any (scoped by role) | List tickets visible to caller |
| `GET` | `/api/tickets/:id` | Owner / Assigned / Manager | Get single ticket |
| `POST` | `/api/tickets` | Any authenticated | Submit new ticket |
| `PUT` | `/api/tickets/:id` | Owner or Manager | Edit ticket details |
| `PUT` | `/api/tickets/:id/status` | Owner / Assigned / Manager | Advance workflow state |
| `PUT` | `/api/tickets/:id/assign` | Manager roles | Assign technician |
| `DELETE` | `/api/tickets/:id` | Owner or `PLATFORM_ADMIN` | Delete ticket |

### Reference Data
| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Any authenticated | List active categories |
| `POST/PUT/DELETE` | `/api/categories/:id` | `PLATFORM_ADMIN` | Manage categories |
| `GET` | `/api/locations` | Any authenticated | List active locations |
| `POST/PUT/DELETE` | `/api/locations/:id` | `PLATFORM_ADMIN` | Manage locations |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get caller's notifications (last 50) |
| `PUT` | `/api/notifications/:id/read` | Mark one as read |
| `PUT` | `/api/notifications/mark-all-read` | Mark all as read |

### System
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Database connectivity check |
| `POST` | `/api/ai/generate` | Required | AI generation (5/min per user) |

---

## 8. Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running on port 5433
- npm or bun

### 1. Clone and install

```bash
git clone <repository-url>
cd plum-flow-desk-main

# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in every value. The server will refuse to start with missing `JWT_SECRET` or `DB_PASSWORD`.

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Set up the database

```bash
# Connect to PostgreSQL and run the schema
psql -U postgres -p 5433 -c "CREATE DATABASE \"Ticketing System\";"
psql -U postgres -p 5433 -d "Ticketing System" -f database/schema.sql
```

Seed initial users (passwords must be hashed — never insert plaintext):
```bash
cd backend
node migrate_passwords.js
```

### 4. Run the application

```bash
# Terminal 1 — Backend API
cd backend
npm run dev        # nodemon with hot reload
# or
npm start          # production

# Terminal 2 — Frontend
cd ..
npm run dev        # Vite dev server on http://localhost:8080
```

### 5. Build for production

```bash
npm run build      # outputs to dist/
```

---

## 9. Environment Variables

All variables live in `backend/.env`. Never commit this file — it is in `.gitignore`.

```env
# ── Database ──────────────────────────────────────────────────────────────────
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=<your_db_password>
DB_PORT=
DB_SSL_REJECT_UNAUTHORIZED=true   # set false only for self-signed certs

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET=<64-byte-hex-secret>   # node -e "require('crypto').randomBytes(64).toString('hex')"
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# ── Server ────────────────────────────────────────────────────────────────────
PORT=3002
NODE_ENV=development
TRUST_PROXY=0                     # set to 1 behind nginx/ALB in production

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# ── Rate Limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000       # general: 15 min
RATE_LIMIT_MAX_REQUESTS=200
AUTH_RATE_WINDOW_MS=900000        # auth: 15 min / 10 attempts
AUTH_RATE_MAX=10
ACCOUNT_CREATE_WINDOW_MS=3600000  # account creation: 1 hour / 20
ACCOUNT_CREATE_MAX=20
TICKET_CREATE_WINDOW_MS=3600000   # ticket creation: 1 hour / 30 per user
TICKET_CREATE_MAX=30
WRITE_RATE_WINDOW_MS=60000        # writes: 1 min / 30 per user
WRITE_RATE_MAX=30
AI_RATE_WINDOW_MS=60000           # AI: 1 min / 5 per user
AI_RATE_MAX=5
READ_RATE_WINDOW_MS=60000         # reads: 1 min / 60 per user
READ_RATE_MAX=60

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## 10. Database Setup

### Schema overview

```sql
users              -- accounts with role, bcrypt hash, login tracking, lockout fields
categories         -- ticket categories (HVAC, Electrical, Plumbing, IT Support, ...)
locations          -- buildings and sites
tickets            -- main workflow entity with 24-state status machine
workflow_history   -- immutable audit trail of every status transition
notifications      -- per-user in-app notification feed
```

### Key design decisions

- All primary keys are `UUID` generated by `gen_random_uuid()` — no sequential IDs that can be enumerated
- `password_hash` column stores bcrypt output only — schema comment explicitly forbids plaintext
- `login_attempts`, `locked_until`, `last_login` columns support account lockout and audit
- `email_verified`, `email_verify_token`, `email_verify_expires` columns ready for email verification flow
- `password_reset_token`, `password_reset_expires` columns ready for secure password reset
- All foreign keys reference `users(id)` — referential integrity enforced at DB level
- `workflow_history` is append-only — provides a tamper-evident audit trail

---

## 11. Project Structure

```
plum-flow-desk-main/
├── backend/                        # Express REST API
│   ├── middleware/
│   │   ├── auth.js                 # JWT verify + role guard
│   │   ├── limiters.js             # 7-tier rate limiting + bot detection
│   │   ├── logger.js               # Winston structured logger
│   │   ├── requestLogger.js        # Morgan HTTP log + suspicious traffic detector
│   │   ├── security.js             # Helmet, HTTPS redirect, DB SSL config
│   │   └── validation.js           # express-validator schemas
│   ├── services/
│   │   └── workflowValidator.js    # Ticket state machine transition rules
│   ├── logs/                       # Auto-created; gitignored
│   │   ├── combined.log
│   │   ├── error.log
│   │   └── security.log
│   ├── .env                        # Secrets — never committed
│   ├── .env.example                # Template with all required keys
│   ├── migrate_passwords.js        # One-time bcrypt migration utility
│   ├── server.js                   # Main API server
│   └── server_v2_enterprise.js     # Enterprise server with full workflow
│
├── database/
│   ├── schema.sql                  # Full PostgreSQL schema
│   ├── schema_v2_enterprise.sql    # Enterprise schema with workflow history
│   └── add_notifications_table.sql
│
├── src/                            # React frontend
│   ├── components/                 # Reusable UI components
│   ├── contexts/
│   │   ├── AuthContext.tsx         # JWT auth state + token refresh
│   │   └── NotificationContext.tsx
│   ├── hooks/                      # Custom React hooks
│   ├── pages/                      # Route-level page components
│   │   ├── Login.tsx
│   │   ├── RoleDashboard.tsx
│   │   ├── TicketManagement.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── FinanceDashboard.tsx
│   │   ├── Reports.tsx
│   │   └── ...
│   ├── services/
│   │   ├── apiService.ts           # Fetch wrapper with auth headers
│   │   ├── authService.ts          # Login, refresh, profile
│   │   └── ticketService.ts        # Ticket CRUD operations
│   ├── types/                      # TypeScript interfaces
│   └── App.tsx                     # Router + auth guards
│
├── .gitignore                      # Excludes .env, logs/, node_modules
├── package.json                    # Frontend dependencies
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 12. Engineering Decisions

### Why PostgreSQL over a hosted BaaS
Direct PostgreSQL gives full control over the query layer, connection pooling, SSL configuration, and schema migrations. It eliminates the risk of third-party service keys being embedded in frontend bundles — a vulnerability that was found and remediated during this project's security audit.

### Why JWT over sessions
Stateless JWTs work naturally with a decoupled frontend/backend architecture and scale horizontally without a shared session store. Tokens are short-lived (8h), verified on every request, and the client pre-checks the `exp` claim before attempting a refresh to avoid unnecessary round-trips.

### Why per-user rate limiting instead of per-IP
IP-based limiting breaks in corporate environments where hundreds of users share a single NAT IP. Keying write and read limiters by authenticated user ID means one abusive user cannot affect others on the same network, while unauthenticated endpoints (login) remain IP-keyed since no user identity is available yet.

### Why a 24-state workflow
Facility maintenance in enterprise environments involves multiple stakeholders — reporters, technicians, managers, finance teams, and customers — each with distinct approval gates. A flat status field with a validated state machine ensures no step can be skipped, every transition is audited, and role-based guards prevent actors from advancing stages outside their authority.

### Why Winston with three log files
Separating `combined`, `error`, and `security` logs allows different retention policies and alerting rules. Security events (auth failures, 403s, rate-limit hits, bot blocks) are written to `security.log` at `warn` level, making it trivial to pipe that file into a SIEM or set up CloudWatch alarms without noise from routine HTTP traffic.

---

## 13. Author
 
Full-Stack Engineer · Security-Focused · Enterprise Systems

This project demonstrates end-to-end ownership of a production-grade system — from database schema design and REST API architecture through frontend state management, security hardening, structured logging, and deployment configuration.

**Core competencies demonstrated in this codebase:**

- Secure authentication system design (JWT, bcrypt, timing-attack prevention)
- OWASP Top 10 mitigation (IDOR, injection, broken auth, security misconfiguration)
- Multi-tier abuse protection (rate limiting, bot detection, request fingerprinting)
- Structured observability (audit logs, security event streams, HTTP access logs)
- Role-based access control with defence-in-depth (middleware + query layer)
- Production deployment configuration (HTTPS, SSL, trust proxy, secret management)
- TypeScript full-stack development with React, Express, and PostgreSQL
- Complex state machine design for multi-stakeholder business workflows

---

*Built with precision. Secured by design. Ready for production.*
