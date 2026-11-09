'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  CheckCheck,
  MessageCircleQuestion,
  ShoppingBag,
  Star,
  UserPlus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/services/notificationApi';
import { isNotificationSoundEnabled, setNotificationSoundEnabled } from '@/utils/sound';
import { timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { AppNotification, NotificationType } from '@/types';

const typeIcons: Record<NotificationType, typeof Bell> = {
  order: ShoppingBag,
  user: UserPlus,
  question: MessageCircleQuestion,
  review: Star,
  system: Bell,
};

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(true);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const router = useRouter();

  const { data } = useGetNotificationsQuery(
    { limit: 6 },
    { skip: !isAuthenticated, refetchOnFocus: true }
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  React.useEffect(() => {
    setSoundOn(isNotificationSoundEnabled());
  }, []);

  if (!isAuthenticated) return null;

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setNotificationSoundEnabled(next);
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      markRead(notification._id).catch(() => undefined);
    }
    setOpen(false);
    router.push(notification.link || '/notifications');
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        {unread ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
        {unread ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card shadow-xl animate-fade-up">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unread ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unread} new
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={soundOn ? 'Mute notification sound' : 'Enable notification sound'}
                aria-label={soundOn ? 'Mute notification sound' : 'Enable notification sound'}
              >
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => markAll()}
                disabled={!unread || markingAll}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                title="Mark all as read"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-7 w-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">You are all caught up</p>
                <p className="text-xs text-muted-foreground">New activity will appear here in real time.</p>
              </div>
            ) : (
              items.map((notification) => {
                const Icon = typeIcons[notification.type] ?? Bell;
                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50',
                      !notification.isRead && 'bg-primary/[0.04]'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        notification.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold">{notification.title}</span>
                        {!notification.isRead ? (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t bg-muted/30 px-4 py-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
