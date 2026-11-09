'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  PlayCircle,
  RefreshCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CourseCard } from '@/components/course/course-card';
import { CourseProgressCard, resumeHref } from '@/components/enrollment/course-progress-card';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetCoursesQuery } from '@/services/courseApi';
import { useGetMyEnrollmentsQuery } from '@/services/enrollmentApi';
import { useGetMyOrdersQuery, useGetOrderTotalsQuery } from '@/services/orderApi';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDurationLong, formatNumber } from '@/utils/format';

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { data: enrollments, isLoading, isError, refetch, isFetching } = useGetMyEnrollmentsQuery();
  const { data: totals } = useGetOrderTotalsQuery();
  const { data: orders } = useGetMyOrdersQuery({ limit: 4 });
  const { data: catalog } = useGetCoursesQuery({ limit: 6, sort: 'popular' });
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);

  const items = enrollments?.items ?? [];
  const inProgress = items
    .filter((item) => item.progress < 100)
    .sort((a, b) => {
      const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return bTime - aTime;
    });
  const focus = inProgress[0] ?? items[0] ?? null;
  const enrolledIds = new Set(items.map((item) => item.course?._id));
  const recommended = (catalog?.items ?? []).filter((course) => !enrolledIds.has(course._id)).slice(0, 3);

  const stats = enrollments?.stats;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Student workspace
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome back, {user?.name?.split(' ')[0] ?? 'learner'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{today} · keep the momentum going.</p>
        </div>
        <Link href="/courses" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <BookOpen className="h-4 w-4" />
          Browse catalog
        </Link>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Your dashboard could not load"
          description="We could not reach the enrollment service. Confirm the API is running and retry."
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
            <StatCard
              icon={GraduationCap}
              label="Enrolled courses"
              value={formatNumber(stats?.total ?? 0)}
              hint={`${stats?.inProgress ?? 0} in progress`}
              tone="primary"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={formatNumber(stats?.completed ?? 0)}
              hint="Courses finished 100%"
              tone="success"
            />
            <StatCard
              icon={Clock3}
              label="Learning time"
              value={formatDurationLong(stats?.totalMinutes ?? 0)}
              hint="Across your curriculum"
              tone="amber"
            />
            <StatCard
              icon={CreditCard}
              label="Total invested"
              value={formatCurrency(totals?.totalSpent ?? 0)}
              hint={`${totals?.paidOrders ?? 0} paid order${(totals?.paidOrders ?? 0) === 1 ? '' : 's'}`}
              tone="sky"
            />
          </section>

          {focus ? (
            <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.09] via-card to-amber-500/[0.05] p-5 shadow-soft sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 max-w-xl">
                  <Badge variant="primary">Continue learning</Badge>
                  <h2 className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{focus.course.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {focus.progress > 0
                      ? `You are ${Math.round(focus.progress)}% through this course. Pick up right where you stopped.`
                      : 'Your course is ready. Watch the first lesson and start building.'}
                  </p>
                  <div className="mt-4 max-w-md">
                    <Progress value={focus.progress} showLabel />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={resumeHref(focus)} className={buttonVariants()}>
                      <PlayCircle className="h-4 w-4" />
                      {focus.progress > 0 ? 'Resume course' : 'Start course'}
                    </Link>
                    <Link
                      href={`/courses/${focus.course.slug}`}
                      className={buttonVariants({ variant: 'outline' })}
                    >
                      Course details
                    </Link>
                  </div>
                </div>
                <div className="hidden shrink-0 rounded-xl border bg-card/80 p-4 text-center shadow-soft sm:block">
                  <p className="text-3xl font-black">{Math.round(focus.progress)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">course progress</p>
                  <p className="mt-3 text-xs font-semibold text-foreground">
                    {focus.completedLessons.length}/{focus.course.totalLessons} lessons
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="Start your first course"
              description="Enroll in a course and your progress, lessons and certificates will appear here."
              action={
                <Link href="/courses" className={buttonVariants()}>
                  Explore courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">My courses</h2>
                <Link
                  href="/dashboard/courses"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {items.length ? (
                <div className="mt-4 space-y-4">
                  {items.slice(0, 3).map((enrollment) => (
                    <CourseProgressCard key={enrollment._id} enrollment={enrollment} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed bg-card/50 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    You have not enrolled yet. Choose a course below to get started.
                  </p>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Recent payments</h2>
                  <Link href="/dashboard/payments" className="text-xs font-semibold text-primary hover:underline">
                    All
                  </Link>
                </div>
                {orders?.items.length ? (
                  <ul className="mt-4 space-y-3">
                    {orders.items.map((order) => (
                      <li key={order._id} className="rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium">{order.course?.title}</p>
                          <Badge variant={order.status === 'paid' ? 'success' : 'warning'}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {formatCurrency(order.amount, order.currency)}
                          </span>
                          {order.status === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => setInvoiceId(order._id)}
                              className="font-semibold text-primary hover:underline"
                            >
                              Invoice
                            </button>
                          ) : (
                            <span>Awaiting payment</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No payments yet. Free courses do not require checkout.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border bg-card p-5 shadow-soft">
                <h2 className="text-base font-bold">Learning snapshot</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Not started</dt>
                    <dd className="font-semibold">{stats?.notStarted ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">In progress</dt>
                    <dd className="font-semibold">{stats?.inProgress ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="font-semibold text-success">{stats?.completed ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <dt className="text-muted-foreground">Certificates earned</dt>
                    <dd className="font-semibold">{stats?.completed ?? 0}</dd>
                  </div>
                </dl>
                <Link
                  href="/dashboard/settings"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}
                >
                  Account settings
                </Link>
              </section>
            </aside>
          </div>

          {recommended.length ? (
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recommended next
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Popular courses you are not enrolled in yet.
                  </p>
                </div>
                <Link href="/courses" className="text-sm font-semibold text-primary hover:underline">
                  See all
                </Link>
              </div>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {recommended.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <InvoiceDialog open={Boolean(invoiceId)} orderId={invoiceId} onClose={() => setInvoiceId(null)} />
    </div>
  );
}

const tones = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
  hint?: string;
  tone: keyof typeof tones;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

