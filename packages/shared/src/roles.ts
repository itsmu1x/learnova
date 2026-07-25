import { Permission, combine, type PermissionKey } from './permissions.js';

export const SystemRole = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export type SystemRoleSlug = (typeof SystemRole)[keyof typeof SystemRole];

export interface RoleDefinition {
  slug: SystemRoleSlug;
  name: string;
  description: string;
  isSystem: boolean;
  /** 1–100 authority rank. Higher outranks lower. */
  power: number;
  permissions: bigint;
}

const STUDENT_PERMISSIONS = combine(
  Permission.VIEW_STUDENT_PANEL,
  Permission.ENROLL_COURSE,
  Permission.USE_AI_TUTOR,
  Permission.WRITE_REVIEW,
);

const INSTRUCTOR_PERMISSIONS = combine(
  STUDENT_PERMISSIONS,
  Permission.VIEW_INSTRUCTOR_PANEL,
  Permission.CREATE_COURSE,
  Permission.EDIT_COURSE,
  Permission.DELETE_COURSE,
  Permission.PUBLISH_COURSE,
  Permission.UPLOAD_VIDEO,
  Permission.MANAGE_LESSONS,
  Permission.VIEW_ANALYTICS,
  Permission.VIEW_CATEGORIES,
  Permission.MANAGE_CATEGORIES,
);

// Admin holds every defined permission bit.
const ADMIN_PERMISSIONS = Object.values(Permission).reduce((acc, b) => acc | b, 0n);

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    slug: SystemRole.STUDENT,
    name: 'Student',
    description: 'Default role for learners.',
    isSystem: true,
    power: 10,
    permissions: STUDENT_PERMISSIONS,
  },
  {
    slug: SystemRole.INSTRUCTOR,
    name: 'Instructor',
    description: 'Can create and manage their own courses.',
    isSystem: true,
    power: 40,
    permissions: INSTRUCTOR_PERMISSIONS,
  },
  {
    slug: SystemRole.ADMIN,
    name: 'Admin',
    description: 'Full platform administration access.',
    isSystem: true,
    power: 100,
    permissions: ADMIN_PERMISSIONS,
  },
];

export const DEFAULT_ROLE_PERMISSION_KEYS: Record<SystemRoleSlug, PermissionKey[]> = {
  student: ['VIEW_STUDENT_PANEL', 'ENROLL_COURSE', 'USE_AI_TUTOR', 'WRITE_REVIEW'],
  instructor: [
    'VIEW_STUDENT_PANEL',
    'ENROLL_COURSE',
    'USE_AI_TUTOR',
    'WRITE_REVIEW',
    'VIEW_INSTRUCTOR_PANEL',
    'CREATE_COURSE',
    'EDIT_COURSE',
    'DELETE_COURSE',
    'PUBLISH_COURSE',
    'UPLOAD_VIDEO',
    'MANAGE_LESSONS',
    'VIEW_ANALYTICS',
    'VIEW_CATEGORIES',
    'MANAGE_CATEGORIES',
  ],
  admin: [],
};

/** Max power among a list of role powers (0 if empty). */
export function maxRolePower(powers: number[]): number {
  if (powers.length === 0) return 0;
  return Math.max(...powers);
}

/** True when the actor may mutate a user whose max role power is `targetPower`. */
export function canManageByPower(actorPower: number, targetPower: number): boolean {
  return actorPower > targetPower;
}

/** True when the actor may assign a role of the given power. */
export function canAssignRolePower(actorPower: number, rolePower: number): boolean {
  return actorPower > rolePower;
}
