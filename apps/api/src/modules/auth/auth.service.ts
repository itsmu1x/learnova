import { schema, and, desc, eq, isNull } from '@learnova/database';
import {
  createOpaqueToken,
  createRefreshToken,
  hashPassword,
  hashToken,
  isStrongPassword,
  parseDuration,
  signAccessToken,
  verifyPassword,
  type OAuthProfile,
} from '@learnova/auth';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  SystemRole,
  UnauthorizedError,
  ValidationError,
  type AuthenticatedUser,
} from '@learnova/shared';
import { getEnv, TOKENS } from '@learnova/config';
import { db } from '../../core/database.js';
import { usersRepository, type UserRow } from '../users/users.repository.js';
import { authRepository } from './auth.repository.js';
import {
  instructorPendingEmail,
  passwordResetEmail,
  sendEmail,
  verificationEmail,
} from '../../services/email.service.js';
import { recordAudit } from '../audit/audit.service.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: AuthenticatedUser;
}

interface RequestMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

async function assignDefaultRole(userId: string, slug: string): Promise<void> {
  const [role] = await db()
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.slug, slug))
    .limit(1);
  if (role) await usersRepository.assignRole(userId, role.id);
}

async function issueSession(user: UserRow, meta: RequestMeta): Promise<AuthResult> {
  const { roles, mask } = await usersRepository.getEffectivePermissions(user.id);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles,
    perms: mask.toString(),
  });

  const { token: refreshToken, tokenHash } = createRefreshToken();
  const env = getEnv();
  await authRepository.createToken({
    userId: user.id,
    type: 'refresh',
    tokenHash,
    expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_TTL)),
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  return {
    accessToken,
    refreshToken,
    user: toAuthenticatedUser(user, roles, mask),
  };
}

function toAuthenticatedUser(user: UserRow, roles: string[], mask: bigint): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles,
    permissions: mask.toString(),
    emailVerified: user.emailVerified,
  };
}

export const authService = {
  async register(
    input: { name: string; email: string; password: string },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    if (!isStrongPassword(input.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters and include upper, lower and a number',
      );
    }
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      provider: 'local',
    });
    await assignDefaultRole(user.id, SystemRole.STUDENT);
    await this.sendVerificationEmail(user);
    await recordAudit({
      actorId: user.id,
      action: 'user.register',
      entityType: 'user',
      entityId: user.id,
    });

    return issueSession(user, meta);
  },

  /**
   * Instructor signup: account is created inactive until an admin approves.
   * No session cookies — the applicant must wait for the approval email.
   */
  async registerInstructor(
    input: {
      name: string;
      email: string;
      password: string;
      headline?: string;
      bio?: string;
      expertise: string;
      motivation: string;
      experienceYears?: number;
      portfolioUrl?: string;
      linkedinUrl?: string;
      certificateUrl?: string;
      certificateFileName?: string;
    },
  ): Promise<{ pending: true; email: string }> {
    if (!isStrongPassword(input.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters and include upper, lower and a number',
      );
    }
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      provider: 'local',
      headline: input.headline ?? null,
      bio: input.bio ?? null,
      isActive: false,
      emailVerified: true,
    });

    const [app] = await db()
      .insert(schema.instructorApplications)
      .values({
        userId: user.id,
        fullName: input.name,
        headline: input.headline ?? null,
        bio: input.bio ?? null,
        expertise: input.expertise,
        motivation: input.motivation,
        experienceYears: input.experienceYears ?? null,
        portfolioUrl: input.portfolioUrl ?? null,
        linkedinUrl: input.linkedinUrl ?? null,
        certificateUrl: input.certificateUrl ?? null,
        certificateFileName: input.certificateFileName ?? null,
        status: 'pending',
      })
      .returning();

    await recordAudit({
      actorId: user.id,
      action: 'instructor_application.submit',
      entityType: 'instructor_application',
      entityId: app!.id,
    });

    await sendEmail({
      to: user.email,
      subject: 'Learnova — we received your instructor application',
      html: instructorPendingEmail(user.name),
    });

    return { pending: true, email: user.email };
  },

  async login(
    input: { email: string; password: string },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const user = await usersRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (user.isBanned) throw new UnauthorizedError('This account has been suspended');
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    if (!user.isActive) {
      throw new UnauthorizedError(await this.inactiveAccountMessage(user.id));
    }

    await usersRepository.update(user.id, { lastLoginAt: new Date() });
    return issueSession(user, meta);
  },

  async oauthLogin(profile: OAuthProfile, meta: RequestMeta): Promise<AuthResult> {
    let user = await usersRepository.findByProvider(profile.provider, profile.providerId);
    if (!user) {
      const byEmail = await usersRepository.findByEmail(profile.email);
      if (byEmail) {
        // Link the OAuth identity to the existing local account.
        user = await usersRepository.update(byEmail.id, {
          provider: profile.provider,
          providerId: profile.providerId,
          emailVerified: true,
          avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
        });
      } else {
        user = await usersRepository.create({
          name: profile.name,
          email: profile.email,
          provider: profile.provider,
          providerId: profile.providerId,
          avatarUrl: profile.avatarUrl,
          emailVerified: true,
        });
        await assignDefaultRole(user.id, SystemRole.STUDENT);
      }
    }
    if (user.isBanned) throw new UnauthorizedError('This account has been suspended');
    if (!user.isActive) {
      throw new UnauthorizedError(await this.inactiveAccountMessage(user.id));
    }
    return issueSession(user, meta);
  },

  /**
   * Refresh-token rotation with a short grace window so concurrent tabs that
   * present the same refresh token don't invalidate each other.
   */
  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    let stored = await authRepository.findActiveToken(tokenHash, 'refresh');
    if (!stored || stored.expiresAt < new Date()) {
      const raced = await authRepository.findRecentlyRevokedRefresh(tokenHash, 30_000);
      if (!raced || raced.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      stored = raced;
    }

    const user = await usersRepository.findById(stored.userId);
    if (!user) throw new UnauthorizedError('User no longer exists');
    if (user.isBanned || !user.isActive) {
      throw new UnauthorizedError(
        !user.isActive
          ? await this.inactiveAccountMessage(user.id)
          : 'Account is not allowed to sign in',
      );
    }

    const { roles, mask } = await usersRepository.getEffectivePermissions(user.id);
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      perms: mask.toString(),
    });

    const { token: newRefresh, tokenHash: newHash } = createRefreshToken();
    const env = getEnv();
    const created = await authRepository.createToken({
      userId: user.id,
      type: 'refresh',
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_TTL)),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    });
    // Only revoke when the presented token is still active (avoid double-revoke).
    if (!stored.revokedAt) {
      await authRepository.revokeToken(stored.id, created.id);
    }

    return { accessToken, refreshToken: newRefresh };
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const stored = await authRepository.findActiveToken(hashToken(refreshToken), 'refresh');
    if (stored) await authRepository.revokeToken(stored.id);
  },

  async sendVerificationEmail(user: UserRow): Promise<void> {
    const { token, tokenHash } = createOpaqueToken();
    await authRepository.createToken({
      userId: user.id,
      type: 'email_verification',
      tokenHash,
      expiresAt: new Date(Date.now() + TOKENS.EMAIL_VERIFY_TTL_HOURS * 3_600_000),
    });
    const link = `${getEnv().WEB_URL}/verify-email?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Learnova email',
      html: verificationEmail(user.name, link),
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const stored = await authRepository.findActiveToken(hashToken(token), 'email_verification');
    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired verification token');
    }
    await usersRepository.update(stored.userId, { emailVerified: true });
    await authRepository.consumeToken(stored.id);
  },

  async requestPasswordReset(email: string): Promise<void> {
    const user = await usersRepository.findByEmail(email);
    // Always succeed to avoid leaking which emails are registered.
    if (!user) return;
    await authRepository.revokeAllForUser(user.id, 'password_reset');
    const { token, tokenHash } = createOpaqueToken();
    await authRepository.createToken({
      userId: user.id,
      type: 'password_reset',
      tokenHash,
      expiresAt: new Date(Date.now() + TOKENS.PASSWORD_RESET_TTL_HOURS * 3_600_000),
    });
    const link = `${getEnv().WEB_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Learnova password',
      html: passwordResetEmail(user.name, link),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!isStrongPassword(newPassword)) {
      throw new ValidationError('Password does not meet strength requirements');
    }
    const stored = await authRepository.findActiveToken(hashToken(token), 'password_reset');
    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset token');
    }
    const passwordHash = await hashPassword(newPassword);
    await usersRepository.update(stored.userId, { passwordHash });
    await authRepository.consumeToken(stored.id);
    // Invalidate all sessions after a password change.
    await authRepository.revokeAllForUser(stored.userId, 'refresh');
    await recordAudit({
      actorId: stored.userId,
      action: 'user.password_reset',
      entityType: 'user',
      entityId: stored.userId,
    });
  },

  async me(userId: string): Promise<AuthenticatedUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (!user.isActive || user.isBanned) {
      throw new UnauthorizedError(
        !user.isActive
          ? await this.inactiveAccountMessage(user.id)
          : 'This account has been suspended',
      );
    }
    const { roles, mask } = await usersRepository.getEffectivePermissions(user.id);
    return toAuthenticatedUser(user, roles, mask);
  },

  async inactiveAccountMessage(userId: string): Promise<string> {
    const [app] = await db()
      .select({ status: schema.instructorApplications.status })
      .from(schema.instructorApplications)
      .where(
        and(
          eq(schema.instructorApplications.userId, userId),
          isNull(schema.instructorApplications.deletedAt),
        ),
      )
      .orderBy(desc(schema.instructorApplications.createdAt))
      .limit(1);

    if (app?.status === 'pending') {
      return 'Your instructor application is still under review. Please wait for our approval email before signing in.';
    }
    if (app?.status === 'rejected') {
      return 'Your instructor application was not approved, so this account cannot sign in. Check your email for details.';
    }
    return 'This account is not active yet. Please contact support if you need help.';
  },
};
