import Stripe from 'stripe';
import { getEnv, PRICING } from '@learnova/config';
import { InternalError } from '@learnova/shared';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new InternalError('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  }
  if (!stripe) {
    // Pin to the SDK's default pinned API version to stay type-safe across upgrades.
    stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(getEnv().STRIPE_SECRET_KEY);
}

interface CourseCheckoutArgs {
  userId: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  priceCents: number;
  /** Web keeps https URLs; mobile returns via custom scheme into the app. */
  client?: 'web' | 'mobile';
}

export async function createCourseCheckout(args: CourseCheckoutArgs): Promise<{ url: string; sessionId: string }> {
  const env = getEnv();
  const isMobile = args.client === 'mobile';
  const successUrl = isMobile
    ? `learnova://learn/${args.courseId}?purchase=success`
    : `${env.WEB_URL}/learn/${args.courseId}?purchase=success`;
  const cancelUrl = isMobile
    ? `learnova://purchase/cancelled`
    : `${env.WEB_URL}/courses?purchase=cancelled`;

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: args.userEmail,
    line_items: [
      {
        price_data: {
          currency: PRICING.CURRENCY,
          product_data: { name: args.courseTitle },
          unit_amount: args.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { type: 'course', userId: args.userId, courseId: args.courseId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  if (!session.url) throw new InternalError('Failed to create Stripe checkout session');
  return { url: session.url, sessionId: session.id };
}

interface SubscriptionCheckoutArgs {
  userId: string;
  userEmail: string;
}

export async function createSubscriptionCheckout(
  args: SubscriptionCheckoutArgs,
): Promise<{ url: string; sessionId: string }> {
  const env = getEnv();
  if (!env.STRIPE_PRO_PRICE_ID) throw new InternalError('STRIPE_PRO_PRICE_ID missing');
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: args.userEmail,
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    metadata: { type: 'subscription', userId: args.userId },
    success_url: `${env.WEB_URL}/dashboard?subscription=success`,
    cancel_url: `${env.WEB_URL}/pricing?subscription=cancelled`,
  });
  if (!session.url) throw new InternalError('Failed to create Stripe subscription session');
  return { url: session.url, sessionId: session.id };
}

export function constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
  const env = getEnv();
  const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new InternalError(
      'STRIPE_WEBHOOK_SECRET is missing. For local dev, run `stripe listen --forward-to localhost:4000/api/v1/payments/webhook` and copy the printed whsec_… into .env (then restart the API).',
    );
  }

  // Stripe signs the exact bytes on the wire — never a re-serialized object.
  const raw = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');

  try {
    return getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      throw new Error(
        `${error.message} If you use \`stripe listen\`, put the printed whsec_ into STRIPE_WEBHOOK_SECRET (not the Dashboard endpoint secret), then restart the API.`,
      );
    }
    throw error;
  }
}
