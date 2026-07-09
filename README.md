<div align="center">

# Learnova

**A modern, production-quality educational SaaS platform.**

Premium video courses · AI-powered learning · Secure streaming · Certificates · Analytics

</div>

---

Learnova is a full-stack, monorepo educational platform in the spirit of Udemy and Coursera,
engineered as a portfolio-grade demonstration of clean architecture, scalable backend design,
and premium product experience.

## Highlights

- **Modular Express + TypeScript backend** with Controller → Service → Repository layering.
- **Bitwise permission system** stored as `BIGINT` — page permissions and action permissions.
- **PostgreSQL + Drizzle ORM** with a professional schema and soft deletes everywhere.
- **JWT auth** with access/refresh token rotation, email verification, password reset, and
  Google / GitHub OAuth.
- **Secure video** via Mux (no raw files stored) and **images** via ImageKit.
- **Stripe** course purchases + Learnova Pro subscriptions.
- **AI provider abstraction** (OpenAI / Gemini / Claude) powering the AI Tutor and instructor tools.
- **Certificates** with PDF generation, unique IDs, QR codes, and public verification.
- **PostgreSQL full-text search** with an abstraction ready for semantic AI search.
- **Next.js App Router** web app (student / instructor / admin) and a **Flutter** student app.

## Monorepo layout

```
learnova/
├── apps/
│   ├── web/        # Next.js App Router (student, instructor, admin)
│   ├── api/        # Express.js modular backend
│   └── mobile/     # Flutter student application
├── packages/
│   ├── ui/         # Shared React UI primitives
│   ├── database/   # Drizzle schema, client, migrations, seed
│   ├── auth/       # Password hashing, JWT, token rotation, OAuth
│   ├── shared/     # Bitwise permissions, types, DTOs, errors
│   └── config/     # Typed environment loading & app constants
└── docs/           # architecture, database, permissions, api, setup, features
```

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # fill in DATABASE_URL, secrets, provider keys

# 3. Set up the database
npm run db:generate       # generate SQL migrations from the Drizzle schema
npm run db:migrate        # apply migrations
npm run db:seed           # seed roles, permissions, demo data

# 4. Run
npm run dev:api           # backend at http://localhost:4000
npm run dev:web           # web at http://localhost:3000
```

See [`docs/setup.md`](docs/setup.md) for the full guide.

## Documentation

| Doc | Description |
| --- | --- |
| [architecture.md](docs/architecture.md) | System design & layering |
| [database.md](docs/database.md) | Schema, relations, soft deletes |
| [permissions.md](docs/permissions.md) | Bitwise permission model |
| [api.md](docs/api.md) | REST API reference (`/api/v1`) |
| [setup.md](docs/setup.md) | Local development guide |
| [features.md](docs/features.md) | Product feature overview |

## License

MIT
