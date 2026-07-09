# Permission system

Learnova uses a **bitwise permission model** — not JSON permission arrays. Each
permission is a single bit; a role stores one `BIGINT` bitmask; a user's
**effective permissions** are the bitwise OR of every role they hold.

## Why bitwise

- **Compact** — one `BIGINT` column instead of a join-heavy JSON structure.
- **Fast** — permission checks are constant-time bitwise ops (`mask & bit`).
- **Composable** — combine, add and remove permissions with `|`, `&`, `~`.

Definitions live in `packages/shared/src/permissions.ts`.

```ts
const bit = (position: number): bigint => 1n << BigInt(position);

export const Permission = {
  VIEW_ADMIN_PANEL:      bit(0),
  VIEW_USERS:            bit(1),
  MANAGE_USERS:          bit(2),
  VIEW_INSTRUCTOR_PANEL: bit(3),
  CREATE_COURSE:         bit(4),
  EDIT_COURSE:           bit(5),
  DELETE_COURSE:         bit(6),
  PUBLISH_COURSE:        bit(7),
  // ... roles, permissions, payments, audit, content, student caps ...
};
```

> Bits are computed with `BigInt` (`1n << 27n`), so we are **not** limited to the
> 31-bit range of JavaScript's `<<` operator and can grow to 63 permissions.

## Page vs action permissions

Both are just bits, checked independently:

- **Page permission** gates access to an area — e.g. `VIEW_ADMIN_PANEL`,
  `VIEW_INSTRUCTOR_PANEL`, `VIEW_ANALYTICS`.
- **Action permission** gates a mutation — e.g. `CREATE_COURSE`, `MANAGE_USERS`,
  `MANAGE_PERMISSIONS`.

This lets a user **view a dashboard without being able to modify anything** — a
role can hold `VIEW_USERS` without `MANAGE_USERS`.

## Default roles

Seeded in `packages/shared/src/roles.ts`:

| Role | Permissions |
| --- | --- |
| **Student** | `VIEW_STUDENT_PANEL`, `ENROLL_COURSE`, `USE_AI_TUTOR`, `WRITE_REVIEW` |
| **Instructor** | all Student + `VIEW_INSTRUCTOR_PANEL`, `CREATE/EDIT/DELETE/PUBLISH_COURSE`, `UPLOAD_VIDEO`, `MANAGE_LESSONS`, `VIEW_ANALYTICS` |
| **Admin** | every defined bit |

Only Admins hold `CREATE_INSTRUCTOR`, so **only an Admin can create instructors**.

## Enforcement

### Backend middleware

```ts
// single page permission
authorize(Permission.VIEW_ADMIN_PANEL)

// action permission (all required)
authorize([Permission.CREATE_COURSE], 'all')

// either of several (e.g. owner OR platform manager)
authorize([Permission.DELETE_COURSE, Permission.MANAGE_ALL_COURSES], 'any')
```

`authenticate` decodes the JWT and attaches `req.user.permissions` as a `bigint`.
`authorize` then does `(userMask & required) === required` (mode `all`) or
`!== 0n` (mode `any`).

**Resource ownership** is enforced in services: an instructor can only edit their
own courses, unless they hold `MANAGE_ALL_COURSES` (admin override).

### Token payload

The access token carries `perms` as a **string** (bigint is not JSON-safe). The
middleware rehydrates it with `BigInt(payload.perms)`.

### Web & mobile

The web `AuthProvider` exposes `can(permissionKey)` and the `<Protected permission>`
guard blocks pages the user cannot view. These are UX conveniences — the API is
always the source of truth and re-checks every request.

## Helpers

`combine`, `hasPermission`, `hasAllPermissions`, `hasAnyPermission`,
`addPermission`, `removePermission`, `encodePermissions(keys)`,
`decodePermissions(mask)` — all pure functions in `@learnova/shared`.

The `permissions` table stores a human-readable catalog (label, description,
category, kind) so the admin UI can render and manage grants, and
`role_permissions` mirrors each role's mask as explicit rows for auditability.
