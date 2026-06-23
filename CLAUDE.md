# ApexFit — Project Guide for Claude

> This file provides context and conventions for AI assistants (Claude, Antigravity, etc.)
> working on the ApexFit project. Keep this file up to date as the project evolves.

---

## 📌 Project Overview

**ApexFit** is a full-stack fitness and workout tracking web application backed by a
cloud-native DevOps pipeline. The project covers:

- A **React** frontend based on `UIUX/` templates
- A **Microservices Architecture** using Node.js / Express:
    - **User Service**: Identity & Profiles
    - **Membership Service**: Business logic for plans/expiration
    - **Admin Service**: Staff operations & payments
    - **API Gateway**: Single entry point & routing
- A **PostgreSQL** database (provisioned via AWS RDS)
- **Docker** containers for each microservice
- **Kubernetes (EKS)** orchestrating the service mesh
- **Terraform** for all cloud infrastructure (IaC)
- **CI/CD** via GitHub Actions

---

## 🗂️ Repository Structure (Planned)

```
ApexFit/
├── frontend/               # React (Vite) frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API call wrappers (axios)
│   │   └── styles/         # Global CSS / design tokens
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── services/               # Microservices logic
│   ├── user-service/       # ✅ Auth, profiles, member data
│   │   ├── src/
│   │   │   ├── config/     # db.js, logger.js
│   │   │   ├── controllers/# auth.controller.js, profile.controller.js
│   │   │   ├── db/         # migrate.js, rollback.js
│   │   │   ├── middleware/ # auth.middleware.js, error.middleware.js
│   │   │   ├── models/     # user.model.js
│   │   │   ├── routes/     # auth.routes.js, profile.routes.js, health.routes.js
│   │   │   ├── services/   # token.service.js
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── __tests__/      # Jest + Supertest integration tests
│   │   ├── Dockerfile      # Multi-stage production build
│   │   ├── .env.example
│   │   └── README.md
│   ├── membership-service/ # ✅ Plans, subscriptions, payments, expiry job
│   │   ├── src/
│   │   │   ├── config/     # db.js, logger.js
│   │   │   ├── controllers/# plan, subscription, payment controllers
│   │   │   ├── db/         # migrate.js, seed.js, rollback.js
│   │   │   ├── jobs/       # expiry.job.js (hourly cron)
│   │   │   ├── middleware/ # auth.middleware.js, error.middleware.js
│   │   │   ├── models/     # plan, subscription, payment models
│   │   │   ├── routes/     # plan, subscription, payment, health routes
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── __tests__/
│   │   ├── Dockerfile
│   │   └── README.md
│   ├── admin-service/      # ✅ Staff portal backend, aggregation, audit logs
│   │   ├── src/
│   │   │   ├── config/     # db.js, logger.js
│   │   │   ├── controllers/# dashboard, member, staff, audit controllers
│   │   │   ├── db/         # migrate.js, rollback.js
│   │   │   ├── middleware/ # auth, error, audit middleware
│   │   │   ├── models/     # auditlog.model.js, staff.model.js
│   │   │   ├── routes/     # dashboard, member, staff, audit, health routes
│   │   │   ├── services/   # userService.client.js, membershipService.client.js
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── __tests__/
│   │   ├── Dockerfile
│   │   └── README.md
│   └── api-gateway/        # ✅ Central routing, auth pre-validation, rate limiting
│       ├── src/
│       │   ├── config/     # routes.js (routing table), logger.js
│       │   ├── middleware/ # auth, correlation ID, error handlers
│       │   ├── routes/     # health.routes.js (aggregated)
│       │   ├── app.js      # Dynamic proxy registration
│       │   └── server.js
│       ├── __tests__/
│       ├── Dockerfile
│       └── README.md
│
├── UIUX/                   # Static HTML/Tailwind templates for the design system
├── infrastructure/         # Terraform IaC
│   ├── modules/
│   │   ├── networking/     # VPC, subnets, security groups
│   │   ├── eks_cluster/    # EKS cluster + node groups
│   │   └── rds/            # PostgreSQL RDS instance
│   ├── environments/
│   │   ├── dev/
│   │   └── prod/
│   └── README.md
│
├── k8s/                    # Kubernetes manifests
│   ├── frontend/
│   ├── backend/
│   ├── ingress/
│   └── configmaps/
│
├── .github/
│   └── workflows/          # GitHub Actions CI/CD pipelines
│
├── docker-compose.yml      # Local development stack
├── ProjectDetails.txt      # High-level project notes
└── CLAUDE.md               # ← You are here
```

---

## 🧰 Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | React 18, Vite, Vanilla CSS         |
| Backend          | Node.js, Express.js                 |
| Database         | PostgreSQL (AWS RDS)                |
| Authentication   | JWT (Access + Refresh tokens)       |
| Containerization | Docker, Docker Compose              |
| Orchestration    | Kubernetes (AWS EKS)                |
| Infrastructure   | Terraform (AWS provider)            |
| CI/CD            | GitHub Actions                      |
| Cloud Provider   | AWS (EKS, RDS, ECR, VPC, IAM)      |

---

## 🎨 Frontend Design System

- **UIUX Reference**: Static HTML prototypes are stored in the `UIUX/` directory (e.g., `admin-[...].html`, `mobile-[...].html`). Use these files as the absolute source of truth when creating React components and applying Tailwind styles.
- **Style**: Glassmorphism — frosted glass cards, blur effects, semi-transparent panels
- **Color Palette**: Dark mode first; accent colors in vibrant indigo / cyan / purple range
- **Typography**: Google Fonts — `Inter` (body), `Outfit` (headings)
- **Animations**: Subtle micro-animations on hover, transitions on route changes
- **Responsive**: Mobile-first breakpoints at 640px, 768px, 1024px, 1280px

---

## 🔐 Authentication Flow

1. User registers / logs in → backend issues **access token** (15 min) + **refresh token** (7 days)
2. Access token stored in memory (React state); refresh token in **HttpOnly cookie**
3. Axios interceptor automatically refreshes the access token on 401 responses
4. All protected API routes require `Authorization: Bearer <token>` header

---

## 🛣️ API Conventions

- **Base URL**: `/api/v1`
- **Auth routes**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`
- **Protected routes**: require JWT middleware
- **Response format**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional message"
  }
  ```
- **Error format**:
  ```json
  {
    "success": false,
    "error": "Error description"
  }
  ```

---

## 🏗️ Infrastructure Conventions

- **Terraform state**: stored in S3 backend with DynamoDB state locking
- **Workspaces**: `dev`, `prod`
- **Naming convention**: `apexfit-<env>-<resource>` (e.g., `apexfit-dev-eks-cluster`)
- **Tagging**: all AWS resources must include tags:
  ```hcl
  tags = {
    Project     = "ApexFit"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  ```
- **Secrets**: never hardcoded; use AWS Secrets Manager or SSM Parameter Store

---

## 🐳 Docker & Local Development

### Start full local stack
```bash
docker-compose up --build
```

### Services exposed locally
| Service  | Port  |
|----------|-------|
| Frontend | 3000  |
| Backend  | 5000  |
| Postgres | 5432  |

---

## ⚙️ CI/CD Pipeline (GitHub Actions)

| Trigger          | Pipeline                                     |
|------------------|----------------------------------------------|
| PR to `main`     | Lint, unit tests, Docker build (dry-run)     |
| Push to `main`   | Build & push images to ECR, deploy to EKS   |
| Manual workflow  | Terraform plan / apply for infra changes     |

---

## 🌿 Git Branching Strategy

- `main` — production-ready, protected branch
- `dev` — active development integration branch
- `feature/<name>` — individual feature branches
- `fix/<name>` — bug fix branches
- `infra/<name>` — infrastructure / Terraform changes

**Commit convention**: `type(scope): short description`
```
feat(backend): add workout CRUD endpoints
fix(frontend): resolve auth redirect loop
infra(eks): update node group instance type
chore(ci): add Docker layer caching
```

---

## 🧪 Testing

- **Backend**: Jest + Supertest for API integration tests
- **Frontend**: Vitest + React Testing Library
- **Coverage target**: ≥ 70% for all new code

---

## 📋 Key Features (Roadmap)

- [x] Project scaffolding and repository setup
- [x] User Service — authentication (register, login, JWT, refresh, logout)
- [x] User Service — member profile (get/update)
- [ ] Membership Service (tiers, pricing, expiration)
- [ ] Exercise library (browse and search exercises)
- [ ] Progress dashboard (charts, streaks, stats)
- [ ] Nutrition tracking (basic macro logging)
- [ ] Social features (follow users, share workouts)
- [ ] Mobile-responsive PWA

---

## 🤖 Notes for Claude / AI Assistants

- **Always read this file first** before making changes to understand project conventions.
- **Infrastructure changes** (Terraform) must follow the tagging and naming conventions above.
- **Never hardcode secrets** — use environment variables or AWS Secrets Manager.
- **Frontend components** must follow the glassmorphism design system; avoid plain, boring styling.
- **API changes** must maintain the standard response format.
- **Docker images** for both frontend and backend should be multi-stage builds for minimal image size.
- When in doubt about a design decision, **ask the user** rather than assuming.

---

*Last updated: 2026-04-22*
