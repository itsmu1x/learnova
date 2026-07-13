# Setup guide

## Prerequisites

- **Node.js** ≥ 20 and **npm** ≥ 10
- **PostgreSQL** ≥ 14 (local or Docker)
- **Flutter** ≥ 3.4 (only for the mobile app)

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learnova
JWT_ACCESS_SECRET=<32+ random chars>
JWT_REFRESH_SECRET=<32+ random chars>
```

Optional provider keys (Stripe, Mux, ImageKit, Resend, OpenAI/Gemini/Claude)
enable those features. **Without them the app still runs** using dev fallbacks
(e.g. free enrollment on checkout, mock AI answers, emails logged to console).

For transactional email, set `RESEND_API_KEY` from [resend.com](https://resend.com) and
use a verified `EMAIL_FROM` address (e.g. `Learnova <onboarding@resend.dev>` for testing).

For video, set `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` from [mux.com](https://mux.com).
Add `MUX_SIGNING_KEY_ID` and `MUX_SIGNING_KEY_PRIVATE_KEY` for signed playback
(recommended in production).

### Spin up Postgres with Docker (optional)

```bash
docker run --name learnova-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=learnova -p 5432:5432 -d postgres:16
```

## 3. Prepare the database

```bash
npm run db:generate   # generate SQL migrations (build + drizzle-kit)
npm run db:migrate    # apply migrations
npm run db:seed       # seed roles, permissions, demo users, a demo course
```

**Demo logins** (password `Password123`):

| Email | Role |
| --- | --- |
| `admin@learnova.dev` | Admin |
| `instructor@learnova.dev` | Instructor |
| `student@learnova.dev` | Student |

## 4. Run the apps

```bash
npm run dev:api    # http://localhost:4000  (health: /health, API: /api/v1)
npm run dev:web    # http://localhost:3000
```

Set the web API URL if different from the default:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## 5. Mobile app (optional)

```bash
cd apps/mobile
flutter pub get
# Android emulator reaches the host at 10.0.2.2
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run build` | Build all packages then apps |
| `npm run typecheck` | Type-check every workspace project |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run build -w @learnova/api` | Build just the API |

## Production build

```bash
npm run build
npm run start -w @learnova/api   # node dist/index.js
npm run start -w @learnova/web   # next start
```

## Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:4000/api/v1/payments/webhook
# Copy the printed whsec_… into STRIPE_WEBHOOK_SECRET, then restart the API.
# Do not use the Dashboard endpoint signing secret with `stripe listen` —
# they are different keys and will return 400 signature errors.
```
