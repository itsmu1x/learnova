# Database design

PostgreSQL with **Drizzle ORM**. The schema lives in
`packages/database/src/schema/` split by domain (`auth`, `catalog`, `learning`,
`commerce`, `audit`) and re-exported from `schema/index.ts`.

## Conventions

- **UUID** primary keys (`uuid ... defaultRandom()`).
- **Timestamps** — every important table has `created_at`, `updated_at`,
  `deleted_at` (via the shared `timestamps` helper).
- **Soft deletes** — rows are never hard-deleted for core entities; repositories
  filter `deleted_at IS NULL`. Join tables (role/user assignments) use hard deletes.
- **Enums** are Postgres `pgEnum`s (course level/status, video status, payment
  status, subscription status, auth provider, token type).
- **Denormalised aggregates** on `courses` (`average_rating`, `rating_count`,
  `enrollment_count`, `lesson_count`, `total_duration_seconds`) are kept in sync
  by the review/enrollment/lesson services for fast catalog reads.

## Entities

### Auth & RBAC
| Table | Notes |
| --- | --- |
| `users` | account, profile, `provider` (local/google/github), verification flags |
| `roles` | `permissions` **BIGINT** bitmask + `is_system` |
| `permissions` | canonical catalog of each bit (key, label, category, kind, `bit`) |
| `role_permissions` | explicit role→permission grants (mirrors the mask, auditable) |
| `user_roles` | user↔role assignments with `assigned_by` |
| `auth_tokens` | hashed refresh / email-verify / password-reset tokens; rotation via `replaced_by_id` |

### Catalog
| Table | Notes |
| --- | --- |
| `categories` | course taxonomy |
| `courses` | title/slug, pricing, level/status, aggregates, `instructor_id`, `category_id` |
| `sections` | ordered groups within a course |
| `lessons` | video lesson: `transcript`, `ai_summary`, `is_preview`, duration, position |
| `videos` | provider (`mux`), `provider_video_id` (Mux asset id), processing `status` — **no raw files** |
| `lesson_resources` | downloadable/linked resources |
| `quizzes` | JSON questions per lesson |

### Learning
| Table | Notes |
| --- | --- |
| `enrollments` | user↔course, `progress_percent`, `completed_lesson_count`, `last_lesson_id`, `completed_at` |
| `lesson_progress` | per-lesson completion + `watched_seconds` + `last_position_seconds` |
| `notes` | timestamped personal notes |
| `reviews` | 1–5 rating, title/body, `is_hidden` (moderation), unique per user/course |
| `certificates` | unique `code`, snapshotted recipient/course/instructor names |

### Commerce
| Table | Notes |
| --- | --- |
| `purchases` | course or subscription purchase intent + status |
| `payments` | Stripe payment record (session/payment ids, refund) |
| `subscriptions` | Learnova Pro subscription (status, period end) |

### Audit
| Table | Notes |
| --- | --- |
| `audit_logs` | actor, action, entity, `previous_data`/`new_data` JSON snapshots, ip/ua |

## Relations

Drizzle `relations()` are declared in `schema/relations.ts`, enabling the
relational query API (e.g. course → sections → lessons → video). Foreign keys use
`onDelete: cascade` for owned children and `set null` for optional references.

## Migrations

```bash
npm run db:generate   # builds schema then emits SQL to packages/database/drizzle
npm run db:migrate    # applies migrations (src/migrate.ts)
npm run db:seed       # seeds permissions, roles, demo users, categories, a course
```

The initial migration (`drizzle/0000_*.sql`) is committed so the schema is
reproducible. Full-text search uses `to_tsvector`/`websearch_to_tsquery` computed
at query time (see [api.md](api.md) search section).
