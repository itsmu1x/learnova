# API reference

Base URL: `/api/v1` · JSON everywhere · auth via httpOnly cookies **or**
`Authorization: Bearer <access token>`.

## Response envelope

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 12, "total": 40, "totalPages": 4 } }
// error
{ "success": false, "error": { "code": "FORBIDDEN", "message": "…", "details": {} } }
```

Error codes: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `PAYMENT_REQUIRED`, `RATE_LIMITED`, `INTERNAL_ERROR`,
`SERVICE_UNAVAILABLE`.

## Auth — `/auth`
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | – | Create account (assigns Student role), returns tokens + user |
| POST | `/auth/login` | – | Email/password login |
| POST | `/auth/refresh` | cookie/body | Rotate refresh token, issue new pair |
| POST | `/auth/logout` | – | Revoke refresh token |
| GET | `/auth/me` | ✔ | Current user |
| POST | `/auth/verify-email` | – | Verify with token |
| POST | `/auth/forgot-password` | – | Request reset link |
| POST | `/auth/reset-password` | – | Reset with token |
| GET | `/auth/oauth/google` · `/github` | – | Begin OAuth |
| GET | `/auth/oauth/{provider}/callback` | – | OAuth callback → sets cookies |

## Users — `/users`
| Method | Path | Permission |
| --- | --- | --- |
| GET | `/users/me` · PATCH `/users/me` | authenticated |
| GET | `/users` · `/users/:id` | `VIEW_USERS` |
| PATCH | `/users/:id` | `MANAGE_USERS` |
| POST | `/users/:id/promote-instructor` | `CREATE_INSTRUCTOR` |
| DELETE | `/users/:id` | `MANAGE_USERS` |

## Roles & permissions
| Method | Path | Permission |
| --- | --- | --- |
| GET | `/roles` · `/roles/:id` | `VIEW_ROLES` |
| POST | `/roles` · DELETE `/roles/:id` | `MANAGE_ROLES` |
| PATCH | `/roles/:id` | `MANAGE_ROLES` or `MANAGE_PERMISSIONS` |
| GET | `/permissions` | `VIEW_PERMISSIONS` |

## Catalog
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/categories` | public; includes course counts |
| POST/PATCH/DELETE | `/categories/:id?` | `MANAGE_CATEGORIES` |
| GET | `/courses` | public browse: `search, category, level, minPrice, maxPrice, isPro, sort, page, limit` |
| GET | `/courses/slug/:slug` | public course detail + curriculum |
| GET | `/courses/id/:id` | authed detail (used by learning pages) |
| GET | `/courses/mine` | `VIEW_INSTRUCTOR_PANEL` |
| POST | `/courses` | `CREATE_COURSE` |
| PATCH | `/courses/:id` | `EDIT_COURSE` (+ ownership) |
| POST | `/courses/:id/publish` · `/unpublish` | `PUBLISH_COURSE` |
| DELETE | `/courses/:id` | `DELETE_COURSE` or `MANAGE_ALL_COURSES` |
| POST/PATCH/DELETE | `/sections/...` | `MANAGE_LESSONS` (+ ownership) |
| GET/POST/PATCH/DELETE | `/lessons/...` | `MANAGE_LESSONS` (+ ownership) |
| POST | `/lessons/:id/ai/summary` · `/ai/quiz` | `MANAGE_LESSONS` (AI content assist) |

## Video — `/videos`
| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| POST | `/videos/:lessonId/upload-init` | `UPLOAD_VIDEO` | Get Mux direct-upload URL |
| POST | `/videos/:lessonId/complete` | `UPLOAD_VIDEO` | Mark processing + duration |
| GET | `/videos/:lessonId/status` | `UPLOAD_VIDEO` | Sync provider status |
| GET | `/videos/:lessonId/playback` | authenticated | Short-lived OTP (preview/enrolled/owner only) |

## Learning — `/enrollments`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/enrollments` | My enrollments |
| GET | `/enrollments/continue` | In-progress courses |
| POST | `/enrollments/:courseId` | Enroll (free / purchased / Pro) — `ENROLL_COURSE` |
| GET | `/enrollments/:courseId/progress` | Per-lesson progress |
| POST | `/enrollments/lessons/:lessonId/progress` | Update/complete a lesson (issues certificate at 100%) |

## Reviews · Certificates · Search · AI
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/reviews/course/:courseId` | public list |
| POST | `/reviews/course/:courseId` | `WRITE_REVIEW` (enrolled only) |
| POST | `/reviews/:id/moderate` | `MODERATE_REVIEWS` |
| GET | `/certificates/verify/:code` | **public** verification |
| GET | `/certificates/:code/download` | PDF (with QR) |
| GET | `/certificates` | my certificates |
| GET | `/search?q=` | Postgres FTS across courses, lessons, instructors |
| POST | `/ai/tutor` | `USE_AI_TUTOR` (context-aware answers) |
| POST | `/ai/course-description` | `CREATE_COURSE` |

## Payments — `/payments`
| Method | Path | Permission |
| --- | --- | --- |
| POST | `/payments/checkout/course/:courseId` | authenticated |
| POST | `/payments/checkout/subscription` | authenticated |
| GET | `/payments/subscription` · POST `/subscription/cancel` | authenticated |
| GET | `/payments/history` | authenticated |
| GET | `/payments` | `VIEW_PAYMENTS` |
| POST | `/payments/:id/refund` | `MANAGE_PAYMENTS` |
| POST | `/payments/webhook` | Stripe (raw body, signature-verified) |

## Analytics · Audit · Uploads
| Method | Path | Permission |
| --- | --- | --- |
| GET | `/analytics/instructor` | `VIEW_ANALYTICS` |
| GET | `/analytics/admin` | `VIEW_ADMIN_PANEL` |
| GET | `/audit` | `VIEW_AUDIT_LOGS` |
| GET | `/uploads/imagekit/auth` | authenticated (signed ImageKit params) |

> When Stripe / Mux / ImageKit / AI keys are absent, those endpoints run in
> a **dev fallback** mode so the whole flow stays testable locally.
