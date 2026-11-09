import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { toCsv } from '../utils/csv';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const pagination = parsePagination(req, 10);
  const [items, total] = await Promise.all([
    Order.find({ user: user._id })
      .populate('course', 'title thumbnail slug level')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Order.countDocuments({ user: user._id }),
  ]);
  sendSuccess(res, { items, meta: paginationMeta(total, pagination.page, pagination.limit) });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const order = await Order.findById(req.params.orderId)
    .populate('course', 'title thumbnail slug level instructor')
    .populate('user', 'name email')
    .lean();
  if (!order) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  if (user.role !== 'admin' && String(order.user?._id ?? order.user) !== String(user._id)) {
    throw ApiError.forbidden('You do not have access to this order');
  }
  sendSuccess(res, { order });
});

export const listAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, provider, search } = req.query as Record<string, string | undefined>;
  const pagination = parsePagination(req, 20);
  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (provider && provider !== 'all') filter.provider = provider;

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const [users, courses] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id').limit(100).lean(),
      Course.find({ title: regex }).select('_id').limit(100).lean(),
    ]);
    filter.$or = [
      { invoiceNumber: regex },
      { user: { $in: users.map((user) => user._id) } },
      { course: { $in: courses.map((course) => course._id) } },
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail slug')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  sendSuccess(res, { items, meta: paginationMeta(total, pagination.page, pagination.limit) });
});

export const exportOrdersCsv = asyncHandler(async (req: Request, res: Response) => {
  const { status, provider } = req.query as Record<string, string | undefined>;
  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (provider && provider !== 'all') filter.provider = provider;

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const rows = orders.map((order) => {
    const user = order.user as unknown as { name?: string; email?: string };
    const course = order.course as unknown as { title?: string };
    return [
      order.invoiceNumber ?? '',
      String(order._id),
      user?.name ?? '',
      user?.email ?? '',
      course?.title ?? '',
      order.amount.toFixed(2),
      order.currency.toUpperCase(),
      order.status,
      order.provider,
      order.createdAt ? new Date(order.createdAt).toISOString() : '',
      order.paidAt ? new Date(order.paidAt).toISOString() : '',
    ];
  });

  const csv = toCsv(
    [
      'Invoice',
      'Order ID',
      'Student',
      'Email',
      'Course',
      'Amount',
      'Currency',
      'Status',
      'Provider',
      'Created At',
      'Paid At',
    ],
    rows
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.status(200).send(csv);
});

export const getOrderTotals = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const [totals] = await Order.aggregate<{ totalSpent: number; paidOrders: number }>([
    { $match: { user: new Types.ObjectId(String(user._id)), status: 'paid' } },
    { $group: { _id: null, totalSpent: { $sum: '$amount' }, paidOrders: { $sum: 1 } } },
  ]);
  sendSuccess(res, { totalSpent: totals?.totalSpent ?? 0, paidOrders: totals?.paidOrders ?? 0 });
});
