import { eq } from 'drizzle-orm';
import { hashPassword } from '@learnova/auth';
import {
  DEFAULT_ROLES,
  PERMISSION_CATALOG,
  slugify,
  type PermissionKey,
} from '@learnova/shared';
import { getDb, closeDb } from './client.js';
import * as schema from './schema/index.js';

/**
 * Idempotent seed: default permissions, roles, role→permission links, demo
 * users (admin/instructor/student), categories and a fully-structured course.
 */
async function seed(): Promise<void> {
  const db = getDb();
  console.log('Seeding Learnova database...');

  // --- Permissions catalog ---
  for (const perm of PERMISSION_CATALOG) {
    await db
      .insert(schema.permissions)
      .values({
        key: perm.key,
        label: perm.label,
        description: perm.description,
        category: perm.category,
        kind: perm.kind,
        bit: perm.bit,
      })
      .onConflictDoUpdate({
        target: schema.permissions.key,
        set: {
          label: perm.label,
          description: perm.description,
          category: perm.category,
          kind: perm.kind,
          bit: perm.bit,
        },
      });
  }
  const allPermissions = await db.select().from(schema.permissions);

  // --- Roles ---
  for (const role of DEFAULT_ROLES) {
    await db
      .insert(schema.roles)
      .values({
        slug: role.slug,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        power: role.power,
        permissions: role.permissions,
      })
      .onConflictDoUpdate({
        target: schema.roles.slug,
        set: {
          permissions: role.permissions,
          name: role.name,
          description: role.description,
          power: role.power,
        },
      });
  }
  const roleRows = await db.select().from(schema.roles);
  const roleBySlug = new Map(roleRows.map((r) => [r.slug, r]));

  // --- Role → permission links (mirror of the bitmask, for auditability) ---
  for (const role of DEFAULT_ROLES) {
    const roleRow = roleBySlug.get(role.slug)!;
    for (const perm of allPermissions) {
      if ((role.permissions & perm.bit) === perm.bit) {
        await db
          .insert(schema.rolePermissions)
          .values({ roleId: roleRow.id, permissionId: perm.id })
          .onConflictDoNothing();
      }
    }
  }

  // --- Demo users ---
  const demoUsers = [
    { email: 'admin@learnova.dev', name: 'Ada Admin', role: 'admin' },
    { email: 'instructor@learnova.dev', name: 'Ian Instructor', role: 'instructor' },
    { email: 'student@learnova.dev', name: 'Sam Student', role: 'student' },
  ] as const;

  const passwordHash = await hashPassword('Password123');
  const userIds: Record<string, string> = {};

  for (const u of demoUsers) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, u.email))
      .limit(1);
    let userId: string;
    if (existing.length > 0) {
      userId = existing[0]!.id;
    } else {
      const [inserted] = await db
        .insert(schema.users)
        .values({
          email: u.email,
          name: u.name,
          passwordHash,
          emailVerified: true,
          provider: 'local',
        })
        .returning({ id: schema.users.id });
      userId = inserted!.id;
    }
    userIds[u.role] = userId;

    const roleRow = roleBySlug.get(u.role)!;
    await db
      .insert(schema.userRoles)
      .values({ userId, roleId: roleRow.id })
      .onConflictDoNothing();
  }

  // --- Categories ---
  const categoryNames = ['Web Development', 'Data Science', 'Design', 'Business'];
  const categoryIds: Record<string, string> = {};
  for (const name of categoryNames) {
    const slug = slugify(name);
    const [row] = await db
      .insert(schema.categories)
      .values({ slug, name, description: `${name} courses` })
      .onConflictDoUpdate({ target: schema.categories.slug, set: { name } })
      .returning({ id: schema.categories.id });
    categoryIds[name] = row!.id;
  }

  // --- Demo course with sections and lessons ---
  const courseSlug = 'mastering-typescript';
  const existingCourse = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.slug, courseSlug))
    .limit(1);

  if (existingCourse.length === 0) {
    const [course] = await db
      .insert(schema.courses)
      .values({
        slug: courseSlug,
        title: 'Mastering TypeScript',
        subtitle: 'From fundamentals to advanced type-level programming',
        description:
          'A comprehensive, project-based course that takes you from TypeScript basics to advanced generics, conditional types, and real-world architecture.',
        level: 'intermediate',
        status: 'published',
        priceCents: 4900,
        isPro: false,
        instructorId: userIds.instructor!,
        categoryId: categoryIds['Web Development']!,
        requirements: ['Basic JavaScript knowledge'],
        outcomes: [
          'Write type-safe applications',
          'Master generics and utility types',
          'Design scalable TypeScript architectures',
        ],
        publishedAt: new Date().toISOString(),
      })
      .returning();

    const sectionsData = [
      {
        title: 'Getting Started',
        lessons: ['Why TypeScript', 'Setup & Tooling', 'Your first typed program'],
      },
      {
        title: 'The Type System',
        lessons: ['Primitives & unions', 'Interfaces vs types', 'Generics deep dive'],
      },
      {
        title: 'Advanced Patterns',
        lessons: ['Conditional types', 'Mapped types', 'Building a type-safe API client'],
      },
    ];

    let lessonTotal = 0;
    let durationTotal = 0;
    for (let s = 0; s < sectionsData.length; s++) {
      const sec = sectionsData[s]!;
      const [section] = await db
        .insert(schema.sections)
        .values({ courseId: course!.id, title: sec.title, position: s })
        .returning();
      for (let l = 0; l < sec.lessons.length; l++) {
        const duration = 480 + l * 120;
        const [lesson] = await db
          .insert(schema.lessons)
          .values({
            sectionId: section!.id,
            courseId: course!.id,
            title: sec.lessons[l]!,
            position: l,
            durationSeconds: duration,
            isPreview: s === 0 && l === 0,
            transcript: 'Auto-generated transcript placeholder for demo purposes.',
          })
          .returning();
        await db.insert(schema.videos).values({
          lessonId: lesson!.id,
          provider: 'mux',
          status: 'ready',
          durationSeconds: duration,
        });
        lessonTotal++;
        durationTotal += duration;
      }
    }

    await db
      .update(schema.courses)
      .set({ lessonCount: lessonTotal, totalDurationSeconds: durationTotal })
      .where(eq(schema.courses.id, course!.id));

    console.log(`Created demo course with ${lessonTotal} lessons.`);
  }

  console.log('Seed complete.');
  console.log('Demo logins (password: Password123):');
  console.log('  admin@learnova.dev / instructor@learnova.dev / student@learnova.dev');

  await closeDb();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await closeDb();
  process.exit(1);
});
