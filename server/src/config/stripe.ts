import Stripe from 'stripe';
import { env } from './env';

let stripeClient: Stripe | null = null;

export const isStripeConfigured = (): boolean =>
  Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith('sk_'));

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY as string, {
      typescript: true,
    });
  }
  return stripeClient;
}
