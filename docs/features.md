# Feature overview

## Students
- **Discover** — homepage, full catalog with search + filters (level, price, sort).
- **Course detail** — curriculum, outcomes, requirements, ratings, preview lessons.
- **Purchase / enroll** — free enrollment, Stripe checkout for paid courses, or
  Learnova Pro subscription for Pro courses.
- **Learn** — lesson player area (secure Mux signed playback), progress tracking,
  mark-complete, continue-learning.
- **AI Tutor** — ask context-aware questions grounded in the current lesson.
- **Certificates** — auto-issued at 100% completion, with public QR verification
  and PDF download.
- **Reviews** — 5-star ratings + written reviews (enrolled learners only).
- **Profile** — edit name/bio/headline/avatar.

## Instructors
- **Dashboard** — students, revenue, average rating, completion rate, watch time,
  top courses.
- **Course management** — create/edit/delete, publish/unpublish.
- **Curriculum** — sections & lessons with ordering, previews.
- **Video** — direct upload to Mux (no raw files on our servers).
- **AI content assist** — generate course descriptions, lesson summaries, quizzes.

## Admins
- **Overview** — platform totals (users, courses, revenue, Pro subs, enrollments).
- **Users** — list/search, ban/unban, promote to instructor (admin-only).
- **Roles & permissions** — view roles, assign bitwise permissions.
- **Payments** — list all payments, refunds.
- **Courses** — manage any course (`MANAGE_ALL_COURSES`).
- **Reviews** — moderate (hide) reviews.
- **Audit logs** — full before/after trail of sensitive actions.

## Platform capabilities

| Capability | Implementation |
| --- | --- |
| Auth | Email/password, Google & GitHub OAuth, email verification, password reset |
| Sessions | JWT access + rotating refresh tokens (hashed at rest) |
| Authorization | Bitwise permissions (`BIGINT`), page + action, ownership checks |
| Video | Mux secure streaming, signed playback tokens, no direct URLs |
| Images | ImageKit signed direct uploads |
| Payments | Stripe course purchases + Pro subscriptions, webhooks |
| Certificates | PDFKit generation, unique code, QR, public verify page |
| Search | PostgreSQL full-text search behind a provider interface (semantic-ready) |
| AI | Provider abstraction over OpenAI / Gemini / Claude (+ offline mock) |
| Auditing | Immutable `audit_logs` with JSON snapshots |
| Resilience | Every paid/external integration has a local dev fallback |

## AI provider abstraction

`AIService.chat(messages, options)` is implemented by `OpenAIProvider`,
`GeminiProvider`, `ClaudeProvider` and `MockProvider`. `getAIService()` selects
one from `AI_PROVIDER`, falling back to the mock when no key is set. Feature
helpers (`askTutor`, `summarizeLesson`, `generateCourseDescription`,
`generateQuiz`) compose prompts on top — so switching providers touches no
feature code.

## Search abstraction

`SearchProvider.search(query, limit)` is implemented today by
`PostgresSearchProvider` (`to_tsvector` / `websearch_to_tsquery` with `ts_rank`).
A future `SemanticSearchProvider` (pgvector / embeddings) can be swapped via
`setSearchProvider()` without changing the search routes.
