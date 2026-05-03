# Prompts Used During Development

This document contains all 6 prompts used to build the IMS project, as required by the submission guidelines.

---

## Prompt 1 — Architecture & Project Scaffold

You are a senior distributed systems engineer. Build a production-grade **Incident Management System (IMS)** from scratch as a monorepo. Follow this spec exactly.

### PROJECT STRUCTURE
```
/ims
  /backend          → Node.js (TypeScript) with Fastify
  /frontend         → React 18 + Vite + TypeScript
  /infra            → docker-compose.yml + .env.example
  /scripts          → seed.ts, simulate-failure.ts
  README.md
```

### TECH STACK (mandatory)
- **Runtime**: Node.js 20 + TypeScript (strict mode)
- **HTTP Framework**: Fastify v4 (not Express)
- **Message Queue / In-Memory Buffer**: BullMQ (backed by Redis)
- **NoSQL (Signal Audit Log)**: MongoDB (Mongoose ODM)
- **RDBMS (Source of Truth)**: PostgreSQL (via Prisma ORM)
- **Cache (Hot-Path Dashboard)**: Redis (ioredis)
- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, React Query, Recharts
- **Design Patterns**: Strategy (alerting), State Machine (incident lifecycle)
- **Observability**: Fastify's built-in request logging + custom throughput logger

### DOCKER COMPOSE
Create docker-compose.yml with services:
- postgres (port 5432, init schema via Prisma migrate)
- mongodb (port 27017)
- redis (port 6379)
- backend (port 3001, depends_on all three)
- frontend (port 5173)

### PRISMA SCHEMA
Create these models:
```prisma
model WorkItem {
  id          String   @id @default(uuid())
  componentId String
  status      Status   @default(OPEN)
  priority    Priority
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  rca         RCA?
  signals     Signal[]
}
model RCA {
  id              String   @id @default(uuid())
  workItemId      String   @unique
  workItem        WorkItem @relation(fields: [workItemId], references: [id])
  startTime       DateTime
  endTime         DateTime
  rootCauseCategory String
  fixApplied      String
  preventionSteps String
  mttr            Int       // seconds
  createdAt       DateTime @default(now())
}
model Signal {
  id          String   @id @default(uuid())
  workItemId  String
  workItem    WorkItem @relation(fields: [workItemId], references: [id])
  mongoSignalId String
  createdAt   DateTime @default(now())
}
enum Status { OPEN INVESTIGATING RESOLVED CLOSED }
enum Priority { P0 P1 P2 P3 }
```

### MONGODB SCHEMA
Raw signal payloads:
```typescript
interface RawSignal {
  _id: ObjectId;
  componentId: string;
  componentType: 'API' | 'RDBMS' | 'CACHE' | 'QUEUE' | 'NOSQL' | 'MCP';
  errorCode: string;
  latencyMs: number;
  payload: Record<string, unknown>;
  receivedAt: Date;
  workItemId?: string;
}
```

Start by generating the full folder structure, package.json files for both /backend and /frontend, docker-compose.yml, .env.example, and the Prisma schema. Do NOT write application logic yet — just the scaffold. Run `npm install` in both folders.

---

## Prompt 2 — Backend Core (Ingestion, BullMQ, Debounce)

Now implement the backend ingestion engine. All code goes in /backend/src.

### A. SIGNAL INGESTION API
Create POST /api/signals with:
- Rate limiter: max 500 req/sec per IP using @fastify/rate-limit
- Validates payload with Zod schema
- Immediately pushes signal to BullMQ queue named "signals" (non-blocking)
- Returns 202 Accepted instantly

### B. BULLMQ WORKER (The Consumer)
Create /backend/src/workers/signalWorker.ts:
- Concurrency: 20 workers processing in parallel
- For each job, write raw payload to MongoDB (fire-and-forget with retry: 3)
- Implement DEBOUNCE LOGIC using Redis key `debounce:{componentId}` with 10-second TTL
- Use Prisma transactions for WorkItem creation
- BullMQ retry with exponential backoff

### C. ALERTING STRATEGY PATTERN
Create /backend/src/strategies/AlertStrategy.ts with AlertStrategyFactory

### D. STATE MACHINE PATTERN
Create /backend/src/state/WorkItemStateMachine.ts:
- Valid transitions: OPEN→INVESTIGATING, INVESTIGATING→RESOLVED, RESOLVED→CLOSED
- CLOSED transition throws IncompleteRCAError if RCA is missing

### E. OBSERVABILITY
- GET /health endpoint
- Throughput logger every 5 seconds
- Redis sliding window counter for signals/sec

### F. REST API ROUTES
All CRUD endpoints for workitems, dashboard stats, and health.

---

## Prompt 3 — Frontend Dashboard (UI/UX Focus)

Build the frontend dashboard in /frontend/src with:
- Design system with Inter + JetBrains Mono fonts
- CSS variable-based color palette with dark/light mode
- Collapsible sidebar, metric cards, live charts (Recharts), incident table
- Incident detail page with RCA form
- Framer Motion animations throughout
- Skeleton loaders and toast notifications

---

## Prompt 4 — Simulation Script & Sample Data

Create /scripts/simulate-failure.ts — cascading failure simulation:
- Phase 1: RDBMS errors (150 signals over 8s)
- Phase 2: Cache failures (80 signals over 5s)
- Phase 3: API timeouts (200 signals over 12s)
- Phase 4: Summary

Create /scripts/seed.ts with 10 WorkItems, 3 RCAs, 500 signals.

---

## Prompt 5 — Testing & Resilience

Unit tests (Vitest):
- rca.validation.test.ts
- stateMachine.test.ts
- debounce.test.ts
- alertStrategy.test.ts

Resilience patterns:
- Retry with exponential backoff
- Circuit breaker for Postgres (opossum)
- Backpressure monitoring with pause/resume

---

## Prompt 6 — README & Final Polish

Comprehensive README.md with:
- Architecture diagram (Mermaid)
- Setup instructions
- Backpressure explanation
- Design patterns table
- API reference with curl examples
- Tech stack rationale
