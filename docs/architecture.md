# Architecture

Learnova is a TypeScript **monorepo** (npm workspaces) composed of three apps
and five shared packages. The design goal is a clean, layered, testable system
where domain logic lives in services, data access is isolated in repositories,
and cross-cutting concerns (auth, permissions, errors, validation) are handled by
composable middleware.

## High-level diagram

```
                    ┌────────────────────────────────────────────┐
                    │                 Clients                     │
                    │   Web (Next.js)        Mobile (Flutter)     │
                    └───────────────┬────────────────┬───────────┘
                                    │  REST /api/v1  │
                    ┌───────────────▼────────────────▼───────────┐
                    │           Express API (apps/api)            │
                    │                                             │
                    │  Router → Middleware → Controller           │
                    │              → Service → Repository         │
                    │                                             │
                    │  Integrations: Stripe · Mux ·         │
                    │  ImageKit · AI (OpenAI/Gemini/Claude) · Resend│
                    └───────────────┬─────────────────────────────┘
                                    │ Drizzle ORM
                    ┌───────────────▼─────────────────────────────┐
                    │              PostgreSQL                      │
                    └─────────────────────────────────────────────┘
```

## Workspace layout

| Package | Responsibility |
| --- | --- |
| `packages/config` | Typed, validated environment loading (zod) + app constants |
| `packages/shared` | Bitwise permissions, roles, domain enums, error hierarchy, DTOs, pure utils |
| `packages/database` | Drizzle schema, client (singleton pool), migrations, seed |
| `packages/auth` | Password hashing (scrypt), JWT sign/verify, refresh-token creation, OAuth helpers |
| `packages/ui` | Shared React primitives consumed by the web app |
| `apps/api` | Modular Express backend |
| `apps/web` | Next.js App Router (student / instructor / admin) |
| `apps/mobile` | Flutter student app |

## Backend layering (Clean Architecture)

Every backend feature is a **module** under `apps/api/src/modules/<name>` with a
consistent shape:

```
modules/courses/
├── courses.routes.ts       # HTTP wiring: paths, middleware, validation
├── courses.controller.ts   # thin: reads req, calls service, sends response
├── courses.service.ts      # business rules, authorization, orchestration
└── courses.repository.ts   # all Drizzle queries (data access only)
```

- **Controllers** never contain business logic — they translate HTTP ⇆ service calls.
- **Services** own the rules (ownership checks, aggregate updates, audit writes)
  and are the only layer that composes multiple repositories/integrations.
- **Repositories** are the sole place raw queries live, making the persistence
  layer swappable and mockable.
- **Integrations** (`services/*.service.ts`) wrap external providers behind small
  interfaces and degrade gracefully when unconfigured (dev mode).

### Request lifecycle

```
request
  → helmet / cors / compression / cookie-parser
  → requestId + logging
  → (Stripe webhook: raw body, before JSON parser)
  → json body parser + rate limiter
  → route: validate(zod) → authenticate → authorize(bits) → controller
  → service → repository → Drizzle → Postgres
  → sendOk(envelope)   |   errorHandler(AppError → JSON)
```

## Cross-cutting concerns

- **Error handling** — a typed `AppError` hierarchy in `@learnova/shared` maps to
  HTTP status + stable `code`. A single global error middleware serialises every
  error (including Zod validation errors) into `{ success:false, error }`.
- **Validation** — `validate({ body, query, params })` middleware parses with Zod
  and replaces the request parts with typed, coerced values.
- **Response envelope** — all endpoints return `{ success, data, meta? }`;
  `bigint` values are serialised to strings so permission masks survive JSON.
- **Auditing** — sensitive mutations call `recordAudit()` (never throws) writing a
  before/after snapshot to `audit_logs`.

## Design principles applied

- **SOLID** — single-responsibility layers; services depend on repository
  abstractions; the AI/search providers are open for extension (new provider)
  without modifying callers (interface segregation + Liskov).
- **DRY** — shared permission/role definitions, error types and DTOs live once in
  `@learnova/shared` and are reused by API, web and (mirrored) mobile.
- **Security by default** — httpOnly cookies, token rotation, scrypt hashing,
  rate limiting, DRM video, signed direct uploads.
