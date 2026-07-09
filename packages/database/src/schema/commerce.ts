import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { courses } from './catalog.js';
import {
  paymentStatusEnum,
  purchaseTypeEnum,
  subscriptionStatusEnum,
  timestamps,
} from './_shared.js';

export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: purchaseTypeEnum('type').notNull(),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 8 }).default('usd').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    ...timestamps,
  },
  (t) => ({
    userIdx: index('purchases_user_idx').on(t.userId),
    courseIdx: index('purchases_course_idx').on(t.courseId),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseId: uuid('purchase_id').references(() => purchases.id, {
      onDelete: 'set null',
    }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).default('stripe').notNull(),
    providerPaymentId: varchar('provider_payment_id', { length: 191 }),
    providerSessionId: varchar('provider_session_id', { length: 191 }),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 8 }).default('usd').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    userIdx: index('payments_user_idx').on(t.userId),
    providerIdx: index('payments_provider_idx').on(t.provider, t.providerPaymentId),
  }),
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).default('stripe').notNull(),
    providerSubscriptionId: varchar('provider_subscription_id', { length: 191 }),
    providerCustomerId: varchar('provider_customer_id', { length: 191 }),
    status: subscriptionStatusEnum('status').default('incomplete').notNull(),
    plan: varchar('plan', { length: 32 }).default('pro').notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: timestamp('cancel_at_period_end', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    userUnique: uniqueIndex('subscriptions_user_unique').on(t.userId),
    providerIdx: index('subscriptions_provider_idx').on(t.providerSubscriptionId),
  }),
);
