'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';
import { baseApi, SOCKET_URL } from '@/services/baseApi';
import { playNotificationSound } from '@/utils/sound';
import type { AppNotification } from '@/types';

interface NotificationEvent {
  notification: AppNotification;
  unreadCount: number;
}

// Socket.IO needs a long-lived server. Set this to "false" when the API runs on
// Vercel Functions; persisted notifications remain available through the API.
const REALTIME_ENABLED = process.env.NEXT_PUBLIC_REALTIME_ENABLED !== 'false';

export function RealtimeNotifications() {
  const { isAuthenticated, user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated || !user || !REALTIME_ENABLED) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    const handleNotification = (event: NotificationEvent) => {
      if (!event?.notification) return;
      dispatch(baseApi.util.invalidateTags(['Notification']));
      if (user.role === 'admin') {
        dispatch(baseApi.util.invalidateTags(['AdminStats', 'AdminAnalytics', 'Order']));
      }
      playNotificationSound();
      toast(event.notification.title, {
        description: event.notification.message,
        action: {
          label: 'Open',
          onClick: () => router.push(event.notification.link || '/dashboard'),
        },
      });
    };

    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
      socket.disconnect();
    };
  }, [isAuthenticated, user, dispatch, router]);

  return null;
}
