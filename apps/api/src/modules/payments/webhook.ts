import type { Request, Response } from 'express';
import { constructWebhookEvent, isStripeConfigured } from '../../services/stripe.service.js';
import { paymentsService } from './payments.service.js';
import { logger } from '../../core/logger.js';

/**
 * Stripe webhook handler. Mounted with a raw-body parser so the signature can
 * be verified. Must be registered before the global JSON body parser.
 */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Stripe not configured' } });
    return;
  }
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).send('Missing stripe-signature header');
    return;
  }
  try {
    const event = constructWebhookEvent(req.body as Buffer, signature);
    await paymentsService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', error);
    res.status(400).send(`Webhook error: ${(error as Error).message}`);
  }
}
