import type Stripe from 'stripe';
import { schema, and, eq, desc, sql } from '@learnova/database';
import { BadRequestError, NotFoundError } from '@learnova/shared';
import { getEnv } from '@learnova/config';
import { db } from '../../core/database.js';
import { coursesRepository } from '../courses/courses.repository.js';
import { enrollmentsService } from '../enrollments/enrollments.service.js';
import {
  createCourseCheckout,
  createSubscriptionCheckout,
  isStripeConfigured,
} from '../../services/stripe.service.js';
import { recordAudit } from '../audit/audit.service.js';
import { logger } from '../../core/logger.js';

export const paymentsService = {
  async checkoutCourse(
    user: { id: string; email: string },
    courseId: string,
    options: { client?: 'web' | 'mobile' } = {},
  ) {
    const course = await coursesRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');
    if (course.priceCents === 0) throw new BadRequestError('This course is free — just enroll');

    const [existing] = await db()
      .select()
      .from(schema.purchases)
      .where(
        and(
          eq(schema.purchases.userId, user.id),
          eq(schema.purchases.courseId, courseId),
          eq(schema.purchases.status, 'succeeded'),
        ),
      )
      .limit(1);
    if (existing) throw new BadRequestError('You already own this course');

    const [purchase] = await db()
      .insert(schema.purchases)
      .values({
        userId: user.id,
        type: 'course',
        courseId,
        amountCents: course.priceCents,
        status: 'pending',
      })
      .returning();

    const client = options.client === 'mobile' ? 'mobile' : 'web';

    // Dev fallback: no Stripe → immediately succeed and enroll.
    if (!isStripeConfigured()) {
      await this.fulfillCoursePurchase(user.id, courseId, purchase!.id, null);
      const url =
        client === 'mobile'
          ? `learnova://learn/${courseId}?purchase=success`
          : `${getEnv().WEB_URL}/learn/${courseId}?purchase=success`;
      return { devMode: true, url };
    }

    const { url, sessionId } = await createCourseCheckout({
      userId: user.id,
      userEmail: user.email,
      courseId,
      courseTitle: course.title,
      priceCents: course.priceCents,
      client,
    });
    await db()
      .insert(schema.payments)
      .values({
        purchaseId: purchase!.id,
        userId: user.id,
        provider: 'stripe',
        providerSessionId: sessionId,
        amountCents: course.priceCents,
        status: 'pending',
      });
    return { url };
  },

  async checkoutSubscription(user: { id: string; email: string }) {
    if (!isStripeConfigured()) {
      await this.activateSubscription(user.id, null, null);
      return { devMode: true, url: `${getEnv().WEB_URL}/dashboard?subscription=success` };
    }
    const { url } = await createSubscriptionCheckout({ userId: user.id, userEmail: user.email });
    return { url };
  },

  async fulfillCoursePurchase(
    userId: string,
    courseId: string,
    purchaseId: string,
    providerPaymentId: string | null,
  ) {
    await db()
      .update(schema.purchases)
      .set({ status: 'succeeded', updatedAt: new Date() })
      .where(eq(schema.purchases.id, purchaseId));
    await db()
      .update(schema.payments)
      .set({ status: 'succeeded', providerPaymentId, updatedAt: new Date() })
      .where(eq(schema.payments.purchaseId, purchaseId));

    // Auto-enroll after successful payment (ignore duplicate enrollment).
    try {
      await enrollmentsService.enroll(userId, courseId);
    } catch {
      /* already enrolled */
    }
    await recordAudit({
      actorId: userId,
      action: 'payment.course_purchase',
      entityType: 'course',
      entityId: courseId,
    });
  },

  async activateSubscription(
    userId: string,
    providerSubscriptionId: string | null,
    providerCustomerId: string | null,
  ) {
    await db()
      .insert(schema.subscriptions)
      .values({
        userId,
        provider: 'stripe',
        providerSubscriptionId,
        providerCustomerId,
        status: 'active',
        plan: 'pro',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.userId,
        set: {
          status: 'active',
          providerSubscriptionId,
          providerCustomerId,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          updatedAt: new Date(),
        },
      });
    await recordAudit({
      actorId: userId,
      action: 'subscription.activate',
      entityType: 'subscription',
      entityId: userId,
    });
  },

  async cancelSubscription(userId: string) {
    await db()
      .update(schema.subscriptions)
      .set({ status: 'canceled', cancelAtPeriodEnd: new Date(), updatedAt: new Date() })
      .where(eq(schema.subscriptions.userId, userId));
    return { canceled: true };
  },

  async mySubscription(userId: string) {
    const [sub] = await db()
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);
    return sub ?? null;
  },

  async history(userId: string) {
    const purchases = await db()
      .select({ purchase: schema.purchases, course: schema.courses })
      .from(schema.purchases)
      .leftJoin(schema.courses, eq(schema.purchases.courseId, schema.courses.id))
      .where(eq(schema.purchases.userId, userId))
      .orderBy(desc(schema.purchases.createdAt));
    return purchases;
  },

  // --- Admin ---
  async listAll(params: { limit: number; offset: number }) {
    const [items, [{ total } = { total: 0 }]] = await Promise.all([
      db()
        .select({
          payment: schema.payments,
          user: { id: schema.users.id, name: schema.users.name, email: schema.users.email },
        })
        .from(schema.payments)
        .innerJoin(schema.users, eq(schema.payments.userId, schema.users.id))
        .orderBy(desc(schema.payments.createdAt))
        .limit(params.limit)
        .offset(params.offset),
      db().select({ total: sql<number>`count(*)::int` }).from(schema.payments),
    ]);
    return { items, total };
  },

  async refund(actorId: string, paymentId: string) {
    const [payment] = await db().select().from(schema.payments).where(eq(schema.payments.id, paymentId)).limit(1);
    if (!payment) throw new NotFoundError('Payment not found');
    await db()
      .update(schema.payments)
      .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.payments.id, paymentId));
    if (payment.purchaseId) {
      await db()
        .update(schema.purchases)
        .set({ status: 'refunded' })
        .where(eq(schema.purchases.id, payment.purchaseId));
    }
    await recordAudit({
      actorId,
      action: 'payment.refund',
      entityType: 'payment',
      entityId: paymentId,
    });
    return { refunded: true };
  },

  /** Handle verified Stripe webhook events. */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        if (meta.type === 'course' && meta.userId && meta.courseId) {
          const [purchase] = await db()
            .select()
            .from(schema.purchases)
            .where(
              and(
                eq(schema.purchases.userId, meta.userId),
                eq(schema.purchases.courseId, meta.courseId),
                eq(schema.purchases.status, 'pending'),
              ),
            )
            .limit(1);
          if (purchase) {
            await this.fulfillCoursePurchase(
              meta.userId,
              meta.courseId,
              purchase.id,
              (session.payment_intent as string) ?? null,
            );
          }
        } else if (meta.type === 'subscription' && meta.userId) {
          await this.activateSubscription(
            meta.userId,
            (session.subscription as string) ?? null,
            (session.customer as string) ?? null,
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await db()
          .update(schema.subscriptions)
          .set({ status: 'canceled', updatedAt: new Date() })
          .where(eq(schema.subscriptions.providerSubscriptionId, sub.id));
        break;
      }
      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  },
};
