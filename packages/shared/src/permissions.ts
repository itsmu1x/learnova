/**
 * Learnova permission system.
 *
 * Permissions are modelled as a **bitwise flag set** stored as a PostgreSQL
 * `BIGINT`. A role owns a single `permissions` bitmask; a user's effective
 * permissions are the OR of every role they hold. This is dramatically cheaper
 * to store and check than JSON permission arrays and scales to 63 distinct
 * permissions per bitmask.
 *
 * Two conceptual flavours of permission exist (both are just bits):
 *   - **Page permissions** gate access to an area/screen (e.g. VIEW_ADMIN_PANEL).
 *   - **Action permissions** gate a mutation (e.g. CREATE_COURSE).
 *
 * A user may VIEW a dashboard without holding any MANAGE/EDIT bits — the two are
 * checked independently by the permission middleware.
 */

const bit = (position: number): bigint => 1n << BigInt(position);

export const Permission = {
  // --- Admin area ---
  VIEW_ADMIN_PANEL: bit(0),
  VIEW_USERS: bit(1),
  MANAGE_USERS: bit(2),

  // --- Instructor area ---
  VIEW_INSTRUCTOR_PANEL: bit(3),
  CREATE_COURSE: bit(4),
  EDIT_COURSE: bit(5),
  DELETE_COURSE: bit(6),
  PUBLISH_COURSE: bit(7),

  // --- Roles & permissions ---
  VIEW_ROLES: bit(8),
  MANAGE_ROLES: bit(9),
  VIEW_PERMISSIONS: bit(10),
  MANAGE_PERMISSIONS: bit(11),

  // --- Payments ---
  VIEW_PAYMENTS: bit(12),
  MANAGE_PAYMENTS: bit(13),

  // --- Audit ---
  VIEW_AUDIT_LOGS: bit(14),

  // --- Course content ---
  MANAGE_ALL_COURSES: bit(15),
  UPLOAD_VIDEO: bit(16),
  MANAGE_LESSONS: bit(17),
  VIEW_ANALYTICS: bit(18),

  // --- Reviews & catalog ---
  MODERATE_REVIEWS: bit(19),
  MANAGE_CATEGORIES: bit(20),

  // --- Elevated management ---
  CREATE_INSTRUCTOR: bit(21),
  MANAGE_SUBSCRIPTIONS: bit(22),
  ISSUE_CERTIFICATE: bit(23),

  // --- Student capabilities ---
  VIEW_STUDENT_PANEL: bit(24),
  ENROLL_COURSE: bit(25),
  USE_AI_TUTOR: bit(26),
  WRITE_REVIEW: bit(27),
} as const;

export type PermissionKey = keyof typeof Permission;

/** Human-readable metadata used by the admin permission-management UI. */
export interface PermissionMeta {
  key: PermissionKey;
  bit: bigint;
  label: string;
  description: string;
  category: 'admin' | 'instructor' | 'student' | 'system';
  kind: 'page' | 'action';
}

export const PERMISSION_CATALOG: PermissionMeta[] = [
  { key: 'VIEW_ADMIN_PANEL', bit: Permission.VIEW_ADMIN_PANEL, label: 'View admin panel', description: 'Access the admin dashboard.', category: 'admin', kind: 'page' },
  { key: 'VIEW_USERS', bit: Permission.VIEW_USERS, label: 'View users', description: 'List and inspect user accounts.', category: 'admin', kind: 'page' },
  { key: 'MANAGE_USERS', bit: Permission.MANAGE_USERS, label: 'Manage users', description: 'Create, update, ban or delete users.', category: 'admin', kind: 'action' },
  { key: 'VIEW_INSTRUCTOR_PANEL', bit: Permission.VIEW_INSTRUCTOR_PANEL, label: 'View instructor panel', description: 'Access the instructor dashboard.', category: 'instructor', kind: 'page' },
  { key: 'CREATE_COURSE', bit: Permission.CREATE_COURSE, label: 'Create course', description: 'Create new courses.', category: 'instructor', kind: 'action' },
  { key: 'EDIT_COURSE', bit: Permission.EDIT_COURSE, label: 'Edit course', description: 'Edit owned course details.', category: 'instructor', kind: 'action' },
  { key: 'DELETE_COURSE', bit: Permission.DELETE_COURSE, label: 'Delete course', description: 'Soft-delete owned courses.', category: 'instructor', kind: 'action' },
  { key: 'PUBLISH_COURSE', bit: Permission.PUBLISH_COURSE, label: 'Publish course', description: 'Publish or unpublish courses.', category: 'instructor', kind: 'action' },
  { key: 'VIEW_ROLES', bit: Permission.VIEW_ROLES, label: 'View roles', description: 'View roles and assignments.', category: 'admin', kind: 'page' },
  { key: 'MANAGE_ROLES', bit: Permission.MANAGE_ROLES, label: 'Manage roles', description: 'Create and edit roles.', category: 'admin', kind: 'action' },
  { key: 'VIEW_PERMISSIONS', bit: Permission.VIEW_PERMISSIONS, label: 'View permissions', description: 'View the permission catalog.', category: 'admin', kind: 'page' },
  { key: 'MANAGE_PERMISSIONS', bit: Permission.MANAGE_PERMISSIONS, label: 'Manage permissions', description: 'Assign permissions to roles.', category: 'admin', kind: 'action' },
  { key: 'VIEW_PAYMENTS', bit: Permission.VIEW_PAYMENTS, label: 'View payments', description: 'View payment and purchase records.', category: 'admin', kind: 'page' },
  { key: 'MANAGE_PAYMENTS', bit: Permission.MANAGE_PAYMENTS, label: 'Manage payments', description: 'Refund and manage payments.', category: 'admin', kind: 'action' },
  { key: 'VIEW_AUDIT_LOGS', bit: Permission.VIEW_AUDIT_LOGS, label: 'View audit logs', description: 'Read the audit trail.', category: 'admin', kind: 'page' },
  { key: 'MANAGE_ALL_COURSES', bit: Permission.MANAGE_ALL_COURSES, label: 'Manage all courses', description: 'Manage any course regardless of ownership.', category: 'admin', kind: 'action' },
  { key: 'UPLOAD_VIDEO', bit: Permission.UPLOAD_VIDEO, label: 'Upload video', description: 'Upload lesson videos.', category: 'instructor', kind: 'action' },
  { key: 'MANAGE_LESSONS', bit: Permission.MANAGE_LESSONS, label: 'Manage lessons', description: 'Create and organise lessons.', category: 'instructor', kind: 'action' },
  { key: 'VIEW_ANALYTICS', bit: Permission.VIEW_ANALYTICS, label: 'View analytics', description: 'View revenue and engagement analytics.', category: 'instructor', kind: 'page' },
  { key: 'MODERATE_REVIEWS', bit: Permission.MODERATE_REVIEWS, label: 'Moderate reviews', description: 'Hide or remove reviews.', category: 'admin', kind: 'action' },
  { key: 'MANAGE_CATEGORIES', bit: Permission.MANAGE_CATEGORIES, label: 'Manage categories', description: 'Create and edit course categories.', category: 'admin', kind: 'action' },
  { key: 'CREATE_INSTRUCTOR', bit: Permission.CREATE_INSTRUCTOR, label: 'Create instructor', description: 'Promote a user to instructor.', category: 'admin', kind: 'action' },
  { key: 'MANAGE_SUBSCRIPTIONS', bit: Permission.MANAGE_SUBSCRIPTIONS, label: 'Manage subscriptions', description: 'Manage Learnova Pro subscriptions.', category: 'admin', kind: 'action' },
  { key: 'ISSUE_CERTIFICATE', bit: Permission.ISSUE_CERTIFICATE, label: 'Issue certificate', description: 'Manually issue certificates.', category: 'admin', kind: 'action' },
  { key: 'VIEW_STUDENT_PANEL', bit: Permission.VIEW_STUDENT_PANEL, label: 'View student panel', description: 'Access the student learning area.', category: 'student', kind: 'page' },
  { key: 'ENROLL_COURSE', bit: Permission.ENROLL_COURSE, label: 'Enroll in course', description: 'Enroll in and access courses.', category: 'student', kind: 'action' },
  { key: 'USE_AI_TUTOR', bit: Permission.USE_AI_TUTOR, label: 'Use AI tutor', description: 'Use the AI tutor features.', category: 'student', kind: 'action' },
  { key: 'WRITE_REVIEW', bit: Permission.WRITE_REVIEW, label: 'Write review', description: 'Write course reviews.', category: 'student', kind: 'action' },
];

/** Combine any number of permission bits into a single mask. */
export function combine(...bits: bigint[]): bigint {
  return bits.reduce((acc, b) => acc | b, 0n);
}

/** True when `mask` includes every bit in `required`. */
export function hasAllPermissions(mask: bigint, required: bigint): boolean {
  return (mask & required) === required;
}

/** True when `mask` includes at least one bit in `required`. */
export function hasAnyPermission(mask: bigint, required: bigint): boolean {
  return (mask & required) !== 0n;
}

/** True when `mask` includes the single `permission` bit. */
export function hasPermission(mask: bigint, permission: bigint): boolean {
  return (mask & permission) === permission;
}

export function addPermission(mask: bigint, permission: bigint): bigint {
  return mask | permission;
}

export function removePermission(mask: bigint, permission: bigint): bigint {
  return mask & ~permission;
}

/** Expand a bitmask into the list of permission keys it contains. */
export function decodePermissions(mask: bigint): PermissionKey[] {
  return PERMISSION_CATALOG.filter((p) => (mask & p.bit) === p.bit).map((p) => p.key);
}

/** Build a bitmask from a list of permission keys. */
export function encodePermissions(keys: PermissionKey[]): bigint {
  return keys.reduce((acc, key) => acc | Permission[key], 0n);
}
