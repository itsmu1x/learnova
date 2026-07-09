import { schema, and, eq, isNull } from '@learnova/database';
import { db } from '../../core/database.js';

type TokenType = 'refresh' | 'email_verification' | 'password_reset';

export const authRepository = {
  async createToken(values: {
    userId: string;
    type: TokenType;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }) {
    const [row] = await db().insert(schema.authTokens).values(values).returning();
    return row!;
  },

  async findActiveToken(tokenHash: string, type: TokenType) {
    const [row] = await db()
      .select()
      .from(schema.authTokens)
      .where(
        and(
          eq(schema.authTokens.tokenHash, tokenHash),
          eq(schema.authTokens.type, type),
          isNull(schema.authTokens.revokedAt),
        ),
      )
      .limit(1);
    return row;
  },

  async revokeToken(id: string, replacedById?: string): Promise<void> {
    await db()
      .update(schema.authTokens)
      .set({ revokedAt: new Date(), replacedById: replacedById ?? null })
      .where(eq(schema.authTokens.id, id));
  },

  async revokeAllForUser(userId: string, type: TokenType): Promise<void> {
    await db()
      .update(schema.authTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.authTokens.userId, userId),
          eq(schema.authTokens.type, type),
          isNull(schema.authTokens.revokedAt),
        ),
      );
  },

  async consumeToken(id: string): Promise<void> {
    await db()
      .update(schema.authTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.authTokens.id, id));
  },
};
