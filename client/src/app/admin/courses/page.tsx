'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCategoriesQuery } from '@/services/categoryApi';
import {
  useDeleteCourseMutation,
  useGetAdminCoursesQuery,
  useSetCourseStatusMutation,
} from '@/services/courseApi';
import type { Course } from '@/types';
import { categoryName, formatCurrency, formatNumber, levelLabel } from '@/utils/format';
import { cn } from '@/utils/cn';

const statusTabs = [
  { value: '', label: 'All courses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

export default function AdminCoursesPage() {
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const [status, setStatus] = React.useState('');
  const [level, setLevel] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [toDelete, setToDelete] = React.useState<Course | null>(null);

  const { data: categories } = useGetCategoriesQuery();
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminCoursesQuery({
    page,
    limit: 10,
    search: deferredSearch || undefined,
    status: status || undefined,
    level: level || undefined,
    category: category || undefined,
  });
  const [setStatusMutation] = useSetCourseStatusMutation();
  const [deleteCourse, { isLoading: deleting }] = useDeleteCourseMutation();

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, status, level, category]);

  const toggleStatus = async (course: Course) => {
    try {
      await setStatusMutation({
        id: course._id,
        status: course.status === 'published' ? 'draft' : 'published',
      }).unwrap();
      toast.success(course.status === 'published' ? 'Course moved to drafts' : 'Course published');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not update course status'
      );
    }
  };

  const courses = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Catalog management
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create courses, build curricula and control what students can see.
          </p>
        </div>
        <Link href="/admin/courses/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New course
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border bg-muted/50 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                status === tab.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or description…"
            icon={<Search className="h-4 w-4" />}
            className="sm:max-w-xs"
            aria-label="Search courses"
          />
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            className="sm:w-44"
          >
            <option value="">All categories</option>
            {categories?.categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            aria-label="Filter by level"
            className="sm:w-40"
          >
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Courses could not load"
          description="The course service did not respond. Check the API and try again."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses match these filters"
          description="Adjust the search or create a new course to get started."
          action={
            <Link href="/admin/courses/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Create course
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Students</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.map((course) => (
                  <tr key={course._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {course.thumbnail?.url ? (
                          <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={course.thumbnail.url}
                              alt={course.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <BookOpen className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/courses/${course._id}`}
                            className="line-clamp-1 font-semibold hover:text-primary"
                          >
                            {course.title}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{levelLabel(course.level)}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {course.rating?.average ? course.rating.average.toFixed(1) : 'New'}
                              {course.rating?.count ? ` (${course.rating.count})` : ''}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{categoryName(course)}</td>
                    <td className="px-4 py-3">
                      {course.effectivePrice > 0 ? (
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatCurrency(course.effectivePrice)}
                          </p>
                          {course.discountPrice ? (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatCurrency(course.price)}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <Badge variant="success">Free</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {formatNumber(course.enrollmentCount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
                        {course.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(course)}
                          title={course.status === 'published' ? 'Unpublish course' : 'Publish course'}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          {course.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        {course.status === 'published' ? (
                          <Link
                            href={`/courses/${course.slug}`}
                            target="_blank"
                            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                            aria-label="View course on site"
                            title="View on site"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        ) : null}
                        <Link
                          href={`/admin/courses/${course._id}`}
                          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                          aria-label="Edit course"
                          title="Edit course"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setToDelete(course)}
                          aria-label="Delete course"
                          title="Delete course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
              <span>
                Showing {courses.length} of {formatNumber(meta.total)} courses
              </span>
              <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteCourse(toDelete._id).unwrap();
            toast.success('Course deleted');
            setToDelete(null);
          } catch (error) {
            toast.error(
              (error as { data?: { message?: string } })?.data?.message ?? 'Could not delete course'
            );
          }
        }}
        title="Delete this course?"
        description={`“${toDelete?.title ?? ''}” and its sections, lessons and curriculum will be removed. Enrollments and order history are preserved.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete course'}
        destructive
      />
    </div>
  );
}
