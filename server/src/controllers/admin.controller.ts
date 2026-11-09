import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { getAdminAnalytics, getAdminStats } from '../services/analytics.service';
import { cache, cacheKeys } from '../config/redis';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get<unknown>('lms:admin:stats');
  if (cached) {
    sendSuccess(res, cached);
    return;
  }
  const stats = await getAdminStats();
  await cache.set('lms:admin:stats', stats, 30);
  sendSuccess(res, stats);
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get<unknown>(cacheKeys.adminAnalytics);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }
  const analytics = await getAdminAnalytics();
  await cache.set(cacheKeys.adminAnalytics, analytics, 60);
  sendSuccess(res, analytics);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, role, active } = req.query as Record<string, string | undefined>;
  const pagination = parsePagination(req, 20);
  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (role && role !== 'all') filter.role = role;
  if (active === 'true') filter.isActive = true;
  if (active === 'false') filter.isActive = false;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role avatar isVerified isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const counts = await Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { user: { $in: users.map((user) => user._id) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

  sendSuccess(res, {
    items: users.map((user) => ({ ...user, enrollmentCount: countMap.get(String(user._id)) ?? 0 })),
    meta: paginationMeta(total, pagination.page, pagination.limit),
  });
});

export const getUserDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.userId)) {
    throw ApiError.badRequest('Invalid user id', 'INVALID_ID');
  }
  const user = await User.findById(req.params.userId)
    .select('name email role avatar bio isVerified isActive createdAt lastLoginAt')
    .lean();
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');

  const [enrollments, orders, spent] = await Promise.all([
    Enrollment.find({ user: user._id })
      .populate('course', 'title thumbnail slug level totalLessons')
      .sort({ enrolledAt: -1 })
      .limit(50)
      .lean(),
    Order.find({ user: user._id })
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Order.aggregate<{ total: number }>([
      { $match: { user: user._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  sendSuccess(res, {
    user,
    enrollments,
    orders,
    stats: {
      enrolledCourses: enrollments.length,
      orders: orders.length,
      totalSpent: spent[0]?.total ?? 0,
    },
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!Types.ObjectId.isValid(userId)) throw ApiError.badRequest('Invalid user id', 'INVALID_ID');

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');

  const isSelf = String(user._id) === String(req.user!._id);
  const wantsRoleChange = req.body.role !== undefined && req.body.role !== user.role;
  const wantsDeactivate = req.body.isActive === false;

  if (isSelf && (wantsRoleChange || wantsDeactivate)) {
    throw ApiError.badRequest('You cannot change your own role or deactivate your own account', 'SELF_UPDATE_BLOCKED');
  }

  if (wantsRoleChange && user.role === 'admin' && req.body.role === 'student') {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      throw ApiError.badRequest('At least one active administrator is required', 'LAST_ADMIN');
    }
  }

  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

  if (wantsRoleChange) {
    // Force a fresh sign-in so the new role takes effect everywhere.
    await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
  }
  await user.save();

  await cache.del('lms:admin:stats');
  await cache.del(cacheKeys.adminAnalytics);

  sendSuccess(res, { user }, 'User updated');
});
