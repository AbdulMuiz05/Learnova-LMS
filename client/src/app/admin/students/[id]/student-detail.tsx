'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CreditCard,
  Mail,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminStatCard } from '@/components/admin/stat-card';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { useGetAdminUserDetailQuery, useUpdateAdminUserMutation } from '@/services/adminApi';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format';

export function StudentDetail({ userId }: { userId: string }) {
  const { user: currentAdmin } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminUserDetailQuery(userId);
  const [updateUser, { isLoading: updating }] = useUpdateAdminUserMutation();
  const [confirm, setConfirm] = React.useState<'role' | 'active' | null>(null);
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);

  const person = data?.user;
  const isSelf = Boolean(currentAdmin && person && currentAdmin._id === person._id);

  const applyUpdate = async (body: { role?: 'student' | 'admin'; isActive?: boolean }) => {
    try {
      await updateUser({ userId, body }).unwrap();
      toast.success('Account updated');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not update account'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError || !data || !person) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Account could not load"
        description="This profile may not exist, or the API is unavailable."
        action={
          <div className="flex gap-2">
            <Button onClick={() => refetch()} loading={isFetching}>
              Retry
            </Button>
            <Link
              href="/admin/students"
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold"
            >
              Back to accounts
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All accounts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={person.name} src={person.avatar?.url} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold">{person.name}</h1>
              <Badge variant={person.role === 'admin' ? 'default' : 'secondary'}>
                {person.role === 'admin' ? (
                  <>
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </>
                ) : (
                  'Student'
                )}
              </Badge>
              <Badge variant={person.isActive ? 'success' : 'destructive'}>
                {person.isActive ? 'Active' : 'Deactivated'}
              </Badge>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {person.email}
              {person.isVerified ? (
                <Badge variant="success" className="ml-1">
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning" className="ml-1">
                  Unverified
                </Badge>
              )}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {formatDate(person.createdAt)} · last login {formatDateTime(person.lastLoginAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSelf || updating}
            onClick={() => setConfirm('role')}
          >
            <ShieldCheck className="h-4 w-4" />
            {person.role === 'admin' ? 'Make student' : 'Make admin'}
          </Button>
          <Button
            variant={person.isActive ? 'outline' : 'success'}
            size="sm"
            disabled={isSelf || updating}
            onClick={() => setConfirm('active')}
          >
            {person.isActive ? (
              <>
                <UserX className="h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {isSelf ? (
        <p className="rounded-xl border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          You are viewing your own account. Role and activation changes are disabled here to protect
          your session; the API also blocks self-demotion.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          icon={BookOpen}
          label="Enrolled courses"
          value={formatNumber(data.stats.enrolledCourses)}
          tone="primary"
        />
        <AdminStatCard
          icon={ReceiptText}
          label="Orders"
          value={formatNumber(data.stats.orders)}
          tone="sky"
        />
        <AdminStatCard
          icon={CreditCard}
          label="Total spent"
          value={formatCurrency(data.stats.totalSpent)}
          tone="success"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card shadow-soft">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-bold">Enrollments</h2>
            <p className="text-xs text-muted-foreground">Course progress for this account</p>
          </div>
          {data.enrollments.length ? (
            <ul className="divide-y">
              {data.enrollments.map((enrollment) => (
                <li key={enrollment._id} className="flex items-center gap-3 px-5 py-3.5">
                  {enrollment.course?.thumbnail?.url ? (
                    <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={enrollment.course.thumbnail.url}
                        alt={enrollment.course.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{enrollment.course?.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={enrollment.progress} className="max-w-[160px]" />
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {Math.round(enrollment.progress)}%
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/learn/${enrollment.course?._id ?? ''}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              This account has not enrolled in any course.
            </p>
          )}
        </section>

        <section className="rounded-2xl border bg-card shadow-soft">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-bold">Orders</h2>
            <p className="text-xs text-muted-foreground">Payment history for this account</p>
          </div>
          {data.orders.length ? (
            <ul className="divide-y">
              {data.orders.map((order) => (
                <li key={order._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{order.course?.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(order.createdAt)} · {order.provider} · {order.invoiceNumber || 'No invoice'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                    <Badge
                      variant={
                        order.status === 'paid'
                          ? 'success'
                          : order.status === 'pending'
                            ? 'warning'
                            : order.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                      }
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setInvoiceId(order._id)}
                    aria-label="View invoice"
                    title="View invoice"
                  >
                    <ReceiptText className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              This account has no orders yet.
            </p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirm === 'role'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await applyUpdate({ role: person.role === 'admin' ? 'student' : 'admin' });
          setConfirm(null);
        }}
        title={person.role === 'admin' ? 'Demote this administrator?' : 'Grant administrator access?'}
        description={
          person.role === 'admin'
            ? 'This account will lose access to the admin console. At least one active admin must remain.'
            : 'This account will be able to manage courses, orders, students and site content.'
        }
        confirmLabel={person.role === 'admin' ? 'Make student' : 'Make admin'}
      />

      <ConfirmDialog
        open={confirm === 'active'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await applyUpdate({ isActive: !person.isActive });
          setConfirm(null);
        }}
        title={person.isActive ? 'Deactivate this account?' : 'Activate this account?'}
        description={
          person.isActive
            ? 'The account cannot sign in until it is reactivated. Existing enrollments and orders are preserved.'
            : 'The account will be able to sign in again with its existing credentials.'
        }
        confirmLabel={person.isActive ? 'Deactivate' : 'Activate'}
        destructive={person.isActive}
      />

      <InvoiceDialog
        open={Boolean(invoiceId)}
        orderId={invoiceId ?? ''}
        onClose={() => setInvoiceId(null)}
      />
    </div>
  );
}
