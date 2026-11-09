'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  DollarSign,
  ExternalLink,
  GraduationCap,
  MessagesSquare,
  Plus,
  ReceiptText,
  RefreshCcw,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AdminStatCard } from '@/components/admin/stat-card';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAdminStatsQuery } from '@/services/adminApi';
import type { OrderStatus } from '@/types';
import { cn } from '@/utils/cn';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  percentChangeLabel,
  timeAgo,
} from '@/utils/format';

const statusVariant: Record<OrderStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
};

export default function AdminOverviewPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminStatsQuery();
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            Admin console
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Platform overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live figures from your database — revenue, enrollment and engagement at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/courses/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4" />
            New course
          </Link>
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ExternalLink className="h-4 w-4" />
            View site
          </Link>
        </div>
      </div>

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError || !data ? (
        <EmptyState
          icon={RefreshCcw}
          title="Admin metrics could not load"
          description="The API did not return platform statistics. Confirm the server is running and retry."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              icon={DollarSign}
              label="Total revenue"
              value={formatCurrency(data.totals.revenue)}
              tone="success"
              hint={
                <span className="inline-flex items-center gap-1">
                  {data.sales.changePercent >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  )}
                  {percentChangeLabel(data.sales.changePercent)} vs last month
                </span>
              }
            />
            <AdminStatCard
              icon={Users}
              label="Students"
              value={formatNumber(data.totals.students)}
              tone="sky"
              hint={`${formatNumber(data.totals.enrollments)} total enrollments`}
            />
            <AdminStatCard
              icon={BookOpen}
              label="Courses"
              value={formatNumber(data.totals.courses)}
              tone="primary"
              hint={`${formatNumber(data.totals.publishedCourses)} published`}
            />
            <AdminStatCard
              icon={Star}
              label="Average rating"
              value={data.totals.averageRating ? data.totals.averageRating.toFixed(1) : '—'}
              tone="amber"
              hint={`${formatNumber(data.totals.orders)} orders · ${formatNumber(data.sales.ordersThisMonth)} this month`}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.08] via-card to-amber-500/[0.05] p-5 shadow-soft sm:p-6 lg:col-span-2">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Sales this month
                  </p>
                  <p className="mt-2 text-3xl font-black">{formatCurrency(data.sales.thisMonth)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.sales.ordersThisMonth} order{data.sales.ordersThisMonth === 1 ? '' : 's'} · last
                    month {formatCurrency(data.sales.lastMonth)}
                  </p>
                </div>
                <Badge variant={data.sales.changePercent >= 0 ? 'success' : 'destructive'}>
                  {data.sales.changePercent >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {percentChangeLabel(data.sales.changePercent)}
                </Badge>
              </div>
              <div className="relative mt-5 flex flex-wrap gap-2">
                <Link href="/admin/analytics" className={buttonVariants({ size: 'sm' })}>
                  Open analytics
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/orders"
                  className={buttonVariants({ size: 'sm', variant: 'outline' })}
                >
                  Manage orders
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Needs attention</p>
                <MessagesSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-3xl font-black tabular-nums">
                {formatNumber(data.totals.unansweredQuestions)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                unanswered student question
                {data.totals.unansweredQuestions === 1 ? '' : 's'} waiting for a reply.
              </p>
              <Link
                href="/admin/questions"
                className={buttonVariants({ size: 'sm', variant: 'outline', className: 'mt-4' })}
              >
                Review questions
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold">Recent orders</h2>
                  <p className="text-xs text-muted-foreground">Latest payment activity</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              {data.recentOrders.length ? (
                <div className="divide-y">
                  {data.recentOrders.slice(0, 6).map((order) => (
                    <div key={order._id} className="flex items-center gap-3 px-5 py-3.5">
                      <Avatar name={order.user?.name} src={order.user?.avatar?.url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{order.user?.name ?? 'Student'}</p>
                        <p className="truncate text-xs text-muted-foreground">{order.course?.title}</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(order.amount, order.currency)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{timeAgo(order.createdAt)}</p>
                      </div>
                      <Badge variant={statusVariant[order.status]} className="capitalize">
                        {order.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setInvoiceId(order._id)}
                        aria-label="View invoice"
                        title="View invoice"
                      >
                        <ReceiptText className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ReceiptText}
                  title="No orders yet"
                  description="Paid enrollments will appear here as students purchase courses."
                  compact
                  className="border-0"
                />
              )}
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl border bg-card shadow-soft">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <h2 className="text-sm font-bold">New students</h2>
                  <Link
                    href="/admin/students"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {data.recentStudents.length ? (
                  <div className="divide-y">
                    {data.recentStudents.slice(0, 4).map((student) => (
                      <Link
                        key={student._id}
                        href={`/admin/students/${student._id}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                      >
                        <Avatar name={student.name} src={student.avatar?.url} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{student.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(student.createdAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No students registered yet.</p>
                )}
              </section>

              <section className="rounded-2xl border bg-card shadow-soft">
                <div className="border-b px-5 py-4">
                  <h2 className="text-sm font-bold">Top courses</h2>
                </div>
                {data.topCourses.length ? (
                  <div className="divide-y">
                    {data.topCourses.slice(0, 4).map((course, index) => (
                      <div key={course._id} className="flex items-center gap-3 px-5 py-3">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                            index === 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {index + 1}
                        </span>
                        {course.thumbnail?.url ? (
                          <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded bg-muted">
                            <Image
                              src={course.thumbnail.url}
                              alt={course.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/courses/${course._id}`}
                            className="line-clamp-1 text-sm font-medium hover:text-primary"
                          >
                            {course.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {formatNumber(course.enrollmentCount)} students · {course.totalLessons} lessons
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No courses created yet.</p>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      <InvoiceDialog open={Boolean(invoiceId)} orderId={invoiceId ?? ''} onClose={() => setInvoiceId(null)} />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
