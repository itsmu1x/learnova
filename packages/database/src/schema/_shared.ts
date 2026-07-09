import { pgEnum, timestamp } from 'drizzle-orm/pg-core';

/**
 * Standard audit columns applied to every important table. Soft deletes are
 * implemented via `deletedAt`; repositories filter `deletedAt IS NULL` by default.
 */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

export const courseLevelEnum = pgEnum('course_level', [
  'beginner',
  'intermediate',
  'advanced',
]);

export const courseStatusEnum = pgEnum('course_status', [
  'draft',
  'pending_review',
  'published',
  'archived',
]);

export const videoStatusEnum = pgEnum('video_status', [
  'pending',
  'uploading',
  'processing',
  'ready',
  'failed',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);

export const purchaseTypeEnum = pgEnum('purchase_type', ['course', 'subscription']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'past_due',
  'canceled',
  'incomplete',
]);

export const authProviderEnum = pgEnum('auth_provider', ['local', 'google', 'github']);

export const tokenTypeEnum = pgEnum('token_type', [
  'refresh',
  'email_verification',
  'password_reset',
]);
