'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  BookOpen,
  DollarSign,
  Download,
  RefreshCcw,
  Star,
  Users,
} from 'lucide-react';
import { AdminStatCard } from '@/components/admin/stat-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAdminAnalyticsQuery } from '@/services/adminApi';
import { formatCurrency, formatNumber } from '@/utils/format';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#0ea5e9', '#f43f5e', '#8b5cf6', '#14b8a6', '#94a3b8'];

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  fontSize: 12,
  boxShadow: '0 12px 32px -12px rgb(15 23 42 / 0.25)',
};

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminAnalyticsQuery();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            Business intelligence
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, enrollment and engagement trends computed from live data over the last 12 months.
          </p>
        </div>
        <Link href="/admin/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Download className="h-4 w-4" />
          Export orders
        </Link>
      </div>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : isError || !data ? (
        <EmptyState
          icon={RefreshCcw}
          title="Analytics could not load"
          description="The analytics service did not respond. Confirm the API and database are available."
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
              label="Paid revenue"
              value={formatCurrency(
                data.monthly.reduce((total, point) => total + point.revenue, 0)
              )}
              tone="success"
              hint={`${formatNumber(data.totals.paidOrders)} paid orders`}
            />
            <AdminStatCard
              icon={BookOpen}
              label="Enrollments"
              value={formatNumber(data.totals.enrollments)}
              tone="primary"
              hint={`${formatNumber(data.totals.publishedCourses)} published courses`}
            />
            <AdminStatCard
              icon={Users}
              label="Students"
              value={formatNumber(data.totals.students)}
              tone="sky"
              hint="Registered accounts"
            />
            <AdminStatCard
              icon={Star}
              label="Reviews this month"
              value={formatNumber(
                data.monthlyReviews[data.monthlyReviews.length - 1]?.count ?? 0
              )}
              tone="amber"
              hint="New ratings submitted"
            />
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Monthly revenue</h2>
                <p className="text-xs text-muted-foreground">Paid order value per month</p>
              </div>
              <span className="text-sm font-black text-success">
                {formatCurrency(data.monthly.reduce((total, point) => total + point.revenue, 0))}
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => `$${formatNumber(value)}`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="text-base font-bold">Enrollments & new students</h2>
              <p className="text-xs text-muted-foreground">Monthly acquisition and course access</p>
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="enrollments" name="Enrollments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="students" name="New students" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="text-base font-bold">Catalog by category</h2>
              <p className="text-xs text-muted-foreground">Published courses grouped by category</p>
              {data.categoryDistribution.length ? (
                <div className="mt-2 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryDistribution}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={86}
                        paddingAngle={3}
                      >
                        {data.categoryDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No published courses to chart yet.
                </p>
              )}
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="text-base font-bold">Revenue by course</h2>
              <p className="text-xs text-muted-foreground">Top earning courses across all orders</p>
              {data.revenueByCourse.length ? (
                <div className="mt-5 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.revenueByCourse}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${formatNumber(value)}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="title"
                        width={116}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, _name, payload) => [
                          formatCurrency(value),
                          payload?.payload?.orders ? `${payload.payload.orders} orders` : 'Revenue',
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Revenue will appear once paid orders exist.
                </p>
              )}
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="text-base font-bold">Reviews per month</h2>
              <p className="text-xs text-muted-foreground">Volume of course ratings submitted</p>
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyReviews} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Reviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
