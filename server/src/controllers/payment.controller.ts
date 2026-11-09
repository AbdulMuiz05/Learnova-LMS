import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Course } from '../models/Course';
import { Order } from '../models/Order';
import { Enrollment } from '../models/Enrollment';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { effectivePrice } from '../services/course.service';
import { finalizePaidOrder } from '../services/payment.service';
import { getStripe, isStripeConfigured } from '../config/stripe';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const getPaymentConfig = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    provider: isStripeConfigured() ? 'stripe' : env.ALLOW_DEMO_PAYMENTS ? 'demo' : 'unavailable',
    stripeConfigured: isStripeConfigured(),
    demoPaymentsEnabled: env.ALLOW_DEMO_PAYMENTS && !isStripeConfigured(),
    currency: env.STRIPE_CURRENCY,
  });
});

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { courseId } = req.body as { courseId: string };

  const course = await Course.findOne({ _id: courseId, status: 'published' });
  if (!course) throw ApiError.notFound('Course not found or not published', 'COURSE_NOT_FOUND');

  const enrolled = await Enrollment.exists({ user: user._id, course: course._id });
  if (enrolled) throw ApiError.conflict('You are already enrolled in this course', 'ALREADY_ENROLLED');

  const amount = effectivePrice(course);
  const provider = isStripeConfigured() ? 'stripe' : env.ALLOW_DEMO_PAYMENTS ? 'demo' : null;
  if (!provider) {
    throw ApiError.serviceUnavailable(
      'Payments are not configured. Add STRIPE_SECRET_KEY to the server environment to enable secure checkout.',
      'PAYMENTS_NOT_CONFIGURED'
    );
  }

  const order = await Order.create({
    user: user._id,
    course: course._id,
    amount,
    originalAmount: course.price,
    currency: env.STRIPE_CURRENCY,
    provider,
    status: 'pending',
  });

  if (amount <= 0) {
    const paid = await finalizePaidOrder({ orderId: String(order._id), provider: 'free' });
    sendSuccess(
      res,
      { provider: 'free', orderId: paid._id, url: `/checkout/success?orderId=${paid._id}` },
      'Free course enrollment confirmed',
      201
    );
    return;
  }

  if (provider === 'demo') {
    sendSuccess(
      res,
      {
        provider: 'demo',
        orderId: order._id,
        url: `/checkout/demo?orderId=${order._id}`,
        message: 'Stripe is not configured, so this environment uses an explicitly labelled demo checkout.',
      },
      'Demo checkout created',
      201
    );
    return;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: String(order._id),
      metadata: {
        orderId: String(order._id),
        userId: String(user._id),
        courseId: String(course._id),
      },
      payment_intent_data: {
        metadata: {
          orderId: String(order._id),
          userId: String(user._id),
          courseId: String(course._id),
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: env.STRIPE_CURRENCY,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: course.title.slice(0, 120),
              description: course.shortDescription.slice(0, 300),
              ...(course.thumbnail.url.startsWith('https://') ? { images: [course.thumbnail.url] } : {}),
            },
          },
        },
      ],
      success_url: `${env.CLIENT_URL}/checkout/success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/checkout/cancel?orderId=${order._id}`,
    });
  } catch (error) {
    logger.error('Stripe checkout session creation failed', error);
    order.status = 'failed';
    await order.save();
    throw ApiError.serviceUnavailable(
      'We could not start the secure checkout. Please try again in a moment.',
      'STRIPE_ERROR'
    );
  }

  order.stripeSessionId = session.id;
  await order.save();

  sendSuccess(
    res,
    { provider: 'stripe', orderId: order._id, url: session.url, sessionId: session.id },
    'Checkout session created',
    201
  );
});

export const confirmDemoPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!env.ALLOW_DEMO_PAYMENTS || isStripeConfigured()) {
    throw ApiError.forbidden('Demo payments are not enabled in this environment', 'DEMO_DISABLED');
  }
  const user = req.user!;
  const { orderId } = req.body as { orderId: string };
  const order = await Order.findOne({ _id: orderId, user: user._id });
  if (!order) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  if (order.status === 'paid') {
    sendSuccess(res, { order }, 'This demo order is already paid');
    return;
  }
  if (order.provider !== 'demo') {
    throw ApiError.badRequest('This order is not a demo order', 'INVALID_PROVIDER');
  }

  const paid = await finalizePaidOrder({ orderId: String(order._id), provider: 'demo' });
  sendSuccess(
    res,
    { order: paid, url: `/checkout/success?orderId=${paid._id}&demo=1` },
    'Demo payment confirmed — no real money was charged'
  );
});

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ received: false, message: 'Stripe is not configured on this server.' });
    return;
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    logger.warn('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set. Rejecting event.');
    res.status(503).json({ received: false, message: 'Webhook secret is not configured.' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ received: false, message: 'Missing Stripe signature.' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.warn(`Stripe webhook signature verification failed: ${(error as Error).message}`);
    res.status(400).json({ received: false, message: 'Invalid webhook signature.' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId && (session.payment_status === 'paid' || session.status === 'complete')) {
          const paymentIntent =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? null;
          await finalizePaidOrder({ orderId, provider: 'stripe', paymentIntentId: paymentIntent });
          logger.info(`Stripe checkout completed for order ${orderId}`);
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) {
          await Order.updateOne(
            { _id: orderId, status: 'pending' },
            { $set: { status: 'failed' } }
          );
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await Order.updateOne(
            { _id: orderId, status: 'pending' },
            { $set: { status: 'failed' } }
          );
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    logger.error(`Error processing Stripe webhook ${event.type}`, error);
    // Returning 500 lets Stripe retry delivery.
    res.status(500).json({ received: false });
  }
});
