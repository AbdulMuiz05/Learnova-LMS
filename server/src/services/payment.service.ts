import { Order, OrderProvider } from '../models/Order';
import { Enrollment } from '../models/Enrollment';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { randomInvoiceNumber } from '../utils/otp';
import { ApiError } from '../utils/ApiError';
import { invalidateCourseCaches, cache, cacheKeys } from '../config/redis';
import { notifyAdmins } from './notification.service';
import { sendOrderReceiptEmail } from './email.service';
import { logger } from '../utils/logger';

interface FinalizeOptions {
  orderId: string;
  provider: OrderProvider;
  paymentIntentId?: string | null;
}

/**
 * Marks a pending order as paid exactly once (conditional update), then creates the
 * enrollment idempotently. Called only from verified Stripe webhooks or the
 * explicitly enabled demo checkout, never from a redirect query string.
 */
export async function finalizePaidOrder(options: FinalizeOptions) {
  const order = await Order.findById(options.orderId);
  if (!order) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  if (order.status === 'paid') return order;

  const invoiceNumber = order.invoiceNumber ?? randomInvoiceNumber();
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: { $ne: 'paid' } },
    {
      $set: {
        status: 'paid',
        paidAt: new Date(),
        invoiceNumber,
        provider: options.provider,
        ...(options.paymentIntentId ? { stripePaymentIntentId: options.paymentIntentId } : {}),
      },
    },
    { new: true }
  );

  if (!updated) {
    const current = await Order.findById(order._id);
    if (!current) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    return current;
  }

  const existing = await Enrollment.exists({ user: updated.user, course: updated.course });
  if (!existing) {
    try {
      await Enrollment.create({ user: updated.user, course: updated.course });
      await Course.updateOne({ _id: updated.course }, { $inc: { enrollmentCount: 1 } });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) {
        logger.error('Failed to create enrollment after payment', error);
      }
    }
  }

  const [user, course] = await Promise.all([
    User.findById(updated.user).select('name email').lean(),
    Course.findById(updated.course).select('title slug').lean(),
  ]);

  if (user && course) {
    try {
      await notifyAdmins({
        type: 'order',
        title: 'New course purchase',
        message: `${user.name} purchased "${course.title}" for $${updated.amount.toFixed(2)}.`,
        link: '/admin/orders',
        meta: { orderId: String(updated._id), courseId: String(course._id) },
      });
      await sendOrderReceiptEmail(user.email, {
        studentName: user.name,
        courseTitle: course.title,
        amount: updated.amount,
        currency: updated.currency,
        orderId: String(updated._id),
        invoiceNumber: updated.invoiceNumber as string,
      });
    } catch (error) {
      logger.error('Post-payment notification failed', error);
    }
  }

  await invalidateCourseCaches(course?.slug);
  await cache.del(cacheKeys.adminAnalytics);
  return updated;
}
