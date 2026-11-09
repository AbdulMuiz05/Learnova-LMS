'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Plus, RefreshCcw, Search } from 'lucide-react';
import { CourseProgressCard } from '@/components/enrollment/course-progress-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMyEnrollmentsQuery } from '@/services/enrollmentApi';
import { cn } from '@/utils/cn';

type Filter = 'all' | 'in-progress' | 'completed' | 'not-started';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All courses' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'not-started', label: 'Not started' },
];

export default function MyCoursesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetMyEnrollmentsQuery();
  const [filter, setFilter] = React.useState<Filter>('all');
  const [search, setSearch] = React.useState('');

  const items = React.useMemo(() => data?.items ?? [], [data]);
  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((enrollment) => {
      const matchesSearch = !query || enrollment.course.title.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filter === 'completed') return enrollment.progress >= 100;
      if (filter === 'in-progress') return enrollment.progress > 0 && enrollment.progress < 100;
      if (filter === 'not-started') return enrollment.progress === 0;
      return true;
    });
  }, [items, filter, search]);

  const counts = React.useMemo(
    () => ({
      all: items.length,
      'in-progress': items.filter((item) => item.progress > 0 && item.progress < 100).length,
      completed: items.filter((item) => item.progress >= 100).length,
      'not-started': items.filter((item) => item.progress === 0).length,
    }),
    [items]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            My learning
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every course you are enrolled in, with live progress and lesson counts.
          </p>
        </div>
        <Link href="/courses" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Plus className="h-4 w-4" />
          Browse more courses
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Could not load your courses"
          description="The enrollment service did not respond. Check the API and try again."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrollments yet"
          description="Once you enroll in a course it will appear here with progress tracking and resume links."
          action={
            <Link href="/courses" className={buttonVariants()}>
              Explore the catalog
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    filter === item.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.label}
                  <span className="ml-1.5 opacity-70">{counts[item.value]}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your courses…"
                className="pl-9"
                aria-label="Search your courses"
              />
            </div>
          </div>

          {filtered.length ? (
            <div className="space-y-4">
              {filtered.map((enrollment) => (
                <CourseProgressCard key={enrollment._id} enrollment={enrollment} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No courses in this view"
              description="Try a different filter or search term."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </>
      )}
    </div>
  );
}

