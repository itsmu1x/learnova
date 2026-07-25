import { schema, and, desc, eq, inArray, isNull } from '@learnova/database';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  SystemRole,
  canAssignRolePower,
  canManageByPower,
} from '@learnova/shared';
import { db } from '../../core/database.js';
import { usersRepository } from '../users/users.repository.js';
import { recordAudit } from '../audit/audit.service.js';
import {
  instructorApprovedEmail,
  instructorDeclinedEmail,
  sendEmail,
} from '../../services/email.service.js';
import { getEnv } from '@learnova/config';

function mapApplication(
  row: typeof schema.instructorApplications.$inferSelect,
  user?: { id: string; name: string; email: string; avatarUrl: string | null } | null,
  reviewer?: { id: string; name: string } | null,
) {
  return {
    id: row.id,
    status: row.status,
    fullName: row.fullName,
    headline: row.headline,
    bio: row.bio,
    expertise: row.expertise,
    motivation: row.motivation,
    experienceYears: row.experienceYears,
    portfolioUrl: row.portfolioUrl,
    linkedinUrl: row.linkedinUrl,
    certificateUrl: row.certificateUrl,
    certificateFileName: row.certificateFileName,
    adminNote: row.adminNote,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: user
      ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
      : undefined,
    reviewer: reviewer ? { id: reviewer.id, name: reviewer.name } : null,
  };
}

export const instructorApplicationsService = {
  async list(status?: 'pending' | 'approved' | 'rejected' | 'withdrawn') {
    const conditions = [isNull(schema.instructorApplications.deletedAt)];
    if (status) conditions.push(eq(schema.instructorApplications.status, status));

    const rows = await db()
      .select({
        application: schema.instructorApplications,
        userId: schema.users.id,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userAvatar: schema.users.avatarUrl,
      })
      .from(schema.instructorApplications)
      .innerJoin(schema.users, eq(schema.instructorApplications.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.instructorApplications.createdAt));

    const reviewerIds = [
      ...new Set(rows.map((r) => r.application.reviewedBy).filter(Boolean) as string[]),
    ];
    const reviewerMap = new Map<string, { id: string; name: string }>();
    if (reviewerIds.length > 0) {
      const list = await db()
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(inArray(schema.users.id, reviewerIds));
      for (const r of list) reviewerMap.set(r.id, r);
    }

    return rows.map((r) =>
      mapApplication(
        r.application,
        {
          id: r.userId,
          name: r.userName,
          email: r.userEmail,
          avatarUrl: r.userAvatar,
        },
        r.application.reviewedBy ? reviewerMap.get(r.application.reviewedBy) ?? null : null,
      ),
    );
  },

  async approve(actorId: string, applicationId: string, adminNote?: string) {
    const [app] = await db()
      .select()
      .from(schema.instructorApplications)
      .where(
        and(
          eq(schema.instructorApplications.id, applicationId),
          isNull(schema.instructorApplications.deletedAt),
        ),
      )
      .limit(1);
    if (!app) throw new NotFoundError('Application not found');
    if (app.status !== 'pending') throw new BadRequestError('Only pending applications can be approved');

    const [actorPower, targetPower] = await Promise.all([
      usersRepository.getUserPower(actorId),
      usersRepository.getUserPower(app.userId),
    ]);
    if (actorId === app.userId) {
      throw new ForbiddenError('You cannot approve your own application');
    }
    if (!canManageByPower(actorPower, targetPower)) {
      throw new ForbiddenError('This applicant outranks you — you cannot approve them');
    }

    const [role] = await db()
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, SystemRole.INSTRUCTOR))
      .limit(1);
    if (!role) throw new NotFoundError('Instructor role not found');
    if (!canAssignRolePower(actorPower, role.power)) {
      throw new ForbiddenError('You cannot assign the instructor role');
    }

    const currentRoles = await usersRepository.getRoleSlugs(app.userId);
    if (!currentRoles.includes(SystemRole.INSTRUCTOR)) {
      await usersRepository.assignRole(app.userId, role.id, actorId);
    }

    await usersRepository.update(app.userId, { isActive: true });

    const [updated] = await db()
      .update(schema.instructorApplications)
      .set({
        status: 'approved',
        adminNote: adminNote ?? null,
        reviewedBy: actorId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.instructorApplications.id, applicationId))
      .returning();

    const user = await usersRepository.findById(app.userId);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: 'Learnova — your instructor account is approved',
        html: instructorApprovedEmail(user.name, `${getEnv().WEB_URL}/login`),
      });
    }

    await recordAudit({
      actorId,
      action: 'instructor_application.approve',
      entityType: 'instructor_application',
      entityId: applicationId,
      newData: { userId: app.userId, adminNote },
    });
    await recordAudit({
      actorId,
      action: 'admin.create_instructor',
      entityType: 'user',
      entityId: app.userId,
    });

    return mapApplication(updated!);
  },

  async reject(actorId: string, applicationId: string, adminNote?: string) {
    const [app] = await db()
      .select()
      .from(schema.instructorApplications)
      .where(
        and(
          eq(schema.instructorApplications.id, applicationId),
          isNull(schema.instructorApplications.deletedAt),
        ),
      )
      .limit(1);
    if (!app) throw new NotFoundError('Application not found');
    if (app.status !== 'pending') throw new BadRequestError('Only pending applications can be declined');

    if (actorId === app.userId) {
      throw new ForbiddenError('You cannot decline your own application');
    }

    await usersRepository.update(app.userId, { isActive: false });

    const [updated] = await db()
      .update(schema.instructorApplications)
      .set({
        status: 'rejected',
        adminNote: adminNote ?? null,
        reviewedBy: actorId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.instructorApplications.id, applicationId))
      .returning();

    const user = await usersRepository.findById(app.userId);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: 'Learnova — update on your instructor application',
        html: instructorDeclinedEmail(user.name, adminNote),
      });
    }

    await recordAudit({
      actorId,
      action: 'instructor_application.reject',
      entityType: 'instructor_application',
      entityId: applicationId,
      newData: { userId: app.userId, adminNote },
    });

    return mapApplication(updated!);
  },
};
