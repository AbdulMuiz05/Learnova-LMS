import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { emitToUser } from '../sockets/socket';
import { logger } from '../utils/logger';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
}

async function unreadCount(recipientId: string): Promise<number> {
  return Notification.countDocuments({ recipient: recipientId, isRead: false });
}

export async function notifyUser(
  recipientId: string | Types.ObjectId,
  payload: NotificationPayload
): Promise<void> {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link ?? '/dashboard',
      meta: payload.meta ?? {},
    });
    const count = await unreadCount(String(recipientId));
    emitToUser(String(recipientId), 'notification:new', { notification, unreadCount: count });
  } catch (error) {
    logger.error('Failed to create user notification', error);
  }
}

export async function notifyAdmins(payload: NotificationPayload): Promise<void> {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
    if (!admins.length) return;

    const notifications = await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link ?? '/admin',
        meta: payload.meta ?? {},
        isRead: false,
      }))
    );

    for (const notification of notifications) {
      const recipientId = String(notification.recipient);
      const count = await unreadCount(recipientId);
      emitToUser(recipientId, 'notification:new', { notification, unreadCount: count });
    }
  } catch (error) {
    logger.error('Failed to create admin notifications', error);
  }
}
