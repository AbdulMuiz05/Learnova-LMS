import { Router } from 'express';
import * as notifications from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, notifications.getMyNotifications);
router.get('/unread-count', authenticate, notifications.getUnreadCount);
router.patch('/read-all', authenticate, notifications.markAllNotificationsRead);
router.patch('/:notificationId/read', authenticate, notifications.markNotificationRead);
router.delete('/', authenticate, notifications.clearNotifications);

export default router;
