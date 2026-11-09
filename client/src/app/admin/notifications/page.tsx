'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  CheckCheck,
  MessageSquare,
  ShoppingBag,
  Star,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useClearNotificationsMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/services/notificationApi';
import type { AppNotification, NotificationType } from '@/types';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/format';

const icons: Record<NotificationType, typeof Bell> = {
  order: ShoppingBag,
  user: UserPlus,
  question: MessageSquare,
  review: Star,
  system: Bell,
};

const tones: Record<NotificationType, string> = {
  order: 'bg-success/10 text-success',
  user: 'bg-primary/10 text-primary',
  question: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  review: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  system: 'bg-muted text-muted-foreground',
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [confirmClear, setConfirmClear] = React.useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useGetNotificationsQuery({
    page,
    limit: 20,
    unread: filter === 'unread',
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const [clearAll, { isLoading: clearing }] = useClearNotificationsMutation();

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markRead(notification._id).unwrap();
      } catch {
        // A failed read receipt should not block navigation.
      }
    }
    router.push(notification.link || '/admin');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Bell className="h-3.5 w-3.5 text-primary" />
            Live inbox
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Orders, new students, questions and reviews arrive here over Socket.IO in real time.
            {data?.unread ? ` ${data.unread} unread.` : ' You are all caught up.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await markAll().unwrap();
                toast.success('All notifications marked as read');
              } catch {
                toast.error('Could not mark notifications as read');
              }
            }}
            loading={markingAll}
            disabled={!data?.unread}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmClear(true)}
            disabled={!data?.items.length}
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { value: 'all' as const, label: 'All activity' },
          { value: 'unread' as const, label: 'Unread' },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setFilter(item.value);
              setPage(1);
            }}
            className={cn(
              'rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
              filter === item.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={BellOff}
          title="Notifications could not load"
          description="The notifications API did not respond."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              Retry
            </Button>
          }
        />
      ) : data?.items.length ? (
        <>
          <div className="space-y-3">
            {data.items.map((notification) => {
              const Icon = icons[notification.type] ?? Bell;
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    'flex w-full items-start gap-3.5 rounded-2xl border bg-card p-4 text-left shadow-soft transition-all hover:border-primary/30 hover:shadow-lift',
                    !notification.isRead && 'border-primary/25 bg-primary/[0.03]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      tones[notification.type] ?? tones.system
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn('text-sm', notification.isRead ? 'font-medium' : 'font-bold')}>
                        {notification.title}
                      </span>
                      {!notification.isRead ? <Badge variant="primary">New</Badge> : null}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{timeAgo(notification.createdAt)}</span>
                      <span className="capitalize">{notification.type}</span>
                      {notification.link ? <span className="text-primary">Open →</span> : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={BellOff}
          title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
          description={
            filter === 'unread'
              ? 'You have read every notification. Switch to All to review older activity.'
              : 'New orders, questions and account activity will appear here in real time.'
          }
          action={
            filter === 'unread' ? (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View all activity
              </Button>
            ) : undefined
          }
        />
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          try {
            await clearAll().unwrap();
            toast.success('Notifications cleared');
            setPage(1);
          } catch {
            toast.error('Could not clear notifications');
          }
        }}
        title="Clear all notifications?"
        description="This permanently removes every notification from the admin inbox. New activity will still arrive."
        confirmLabel={clearing ? 'Clearing…' : 'Clear notifications'}
        destructive
      />
    </div>
  );
}
