import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { parsePagination, paginationMeta } from '../utils/pagination';

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const pagination = parsePagination(req, 12);
  const unreadOnly = req.query.unread === 'true';
  const filter: Record<string, unknown> = { recipient: user._id };
  if (unreadOnly) filter.isRead = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  sendSuccess(res, { items, unread, meta: paginationMeta(total, pagination.page, pagination.limit) });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({ recipient: req.user!._id, isRead: false });
  sendSuccess(res, { unread: count });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOne({
    _id: req.params.notificationId,
    recipient: req.user!._id,
  });
  if (!notification) throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }
  const unread = await Notification.countDocuments({ recipient: req.user!._id, isRead: false });
  sendSuccess(res, { notification, unread }, 'Notification marked as read');
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ recipient: req.user!._id, isRead: false }, { $set: { isRead: true } });
  sendSuccess(res, { unread: 0 }, 'All notifications marked as read');
});

export const clearNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await Notification.deleteMany({ recipient: req.user!._id });
  sendSuccess(res, { deleted: result.deletedCount }, 'Notifications cleared');
});
