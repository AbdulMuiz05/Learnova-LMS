'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, RefreshCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { CourseCard } from '@/components/course/course-card';
import { CourseCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetCoursesQuery } from '@/services/courseApi';
import { useGetCategoriesQuery } from '@/services/categoryApi';
import { formatNumber, levelLabel } from '@/utils/format';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 9;

export function CoursesCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [search, setSearch] = React.useState(initialSearch);
  const [showFilters, setShowFilters] = React.useState(false);

  const category = searchParams.get('category') ?? 'all';
  const level = searchParams.get('level') ?? 'all';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data, isLoading, isFetching, isError, refetch } = useGetCoursesQuery({
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    level: level !== 'all' ? level : undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const updateParams = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all') params.delete(key);
        else params.set(key, value);
      });
      if (!Object.prototype.hasOwnProperty.call(updates, 'page')) params.delete('page');
      const query = params.toString();
      router.replace(query ? `/courses?${query}` : '/courses', { scroll: false });
    },
    [router, searchParams]
  );

  const hasFilters = Boolean(search || category !== 'all' || level !== 'all' || sort !== 'newest');
  const activeCategory = categoriesData?.categories.find((item) => item.slug === category);
  const results = data?.items ?? [];

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    router.replace('/courses', { scroll: false });
  };

  const handlePage = (nextPage: number) => {
    updateParams({ page: String(nextPage) });
    document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            Course catalog
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {activeCategory ? activeCategory.name : 'Find your next skill'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {activeCategory?.description ||
              'Search the full catalog, filter by topic and difficulty, and start learning in minutes.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden sm:inline-flex')}>
            My learning
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters((value) => !value)}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className={cn(!showFilters && 'hidden lg:block')}>
            <label htmlFor="course-search" className="field-label">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="course-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Course title…"
                className="pl-9"
              />
            </div>
          </div>
          <div className={cn(!showFilters && 'hidden lg:block')}>
            <label htmlFor="category-filter" className="field-label">
              Category
            </label>
            <Select
              id="category-filter"
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
            >
              <option value="all">All categories</option>
              {categoriesData?.categories.map((item) => (
                <option key={item._id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div className={cn(!showFilters && 'hidden lg:block')}>
            <label htmlFor="level-filter" className="field-label">
              Level
            </label>
            <Select id="level-filter" value={level} onChange={(event) => updateParams({ level: event.target.value })}>
              <option value="all">All levels</option>
              <option value="beginner">{levelLabel('beginner')}</option>
              <option value="intermediate">{levelLabel('intermediate')}</option>
              <option value="advanced">{levelLabel('advanced')}</option>
            </Select>
          </div>
          <div className={cn(!showFilters && 'hidden lg:block')}>
            <label htmlFor="sort-filter" className="field-label">
              Sort by
            </label>
            <Select id="sort-filter" value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </Select>
          </div>
        </div>
        {hasFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
            {search ? (
              <FilterChip label={`“${search}”`} onClear={() => { setSearchInput(''); setSearch(''); }} />
            ) : null}
            {category !== 'all' ? (
              <FilterChip label={activeCategory?.name ?? 'Category'} onClear={() => updateParams({ category: undefined })} />
            ) : null}
            {level !== 'all' ? (
              <FilterChip label={levelLabel(level)} onClear={() => updateParams({ level: undefined })} />
            ) : null}
            {sort !== 'newest' ? <FilterChip label={`Sorted: ${sort}`} onClear={() => updateParams({ sort: undefined })} /> : null}
            <button type="button" onClick={resetFilters} className="ml-auto text-xs font-semibold text-primary hover:underline">
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      <div id="catalog-results" className="mt-8 scroll-mt-24">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Finding courses…'
              : `${formatNumber(data?.meta.total ?? 0)} course${(data?.meta.total ?? 0) === 1 ? '' : 's'} found`}
            {isFetching && !isLoading ? <span className="ml-2 text-xs">Updating…</span> : null}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={RefreshCcw}
            title="Could not load courses"
            description="The catalog API did not respond. Confirm the backend is running and try again."
            action={
              <Button onClick={() => refetch()} loading={isFetching}>
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No courses match those filters"
            description="Try a different keyword, remove a filter, or browse everything in the catalog."
            action={
              <Button variant="outline" onClick={resetFilters}>
                <X className="h-4 w-4" />
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
            <Pagination
              className="mt-10"
              page={data?.meta.page ?? 1}
              totalPages={data?.meta.totalPages ?? 1}
              onPageChange={handlePage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pl-2.5 pr-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        aria-label={`Remove filter ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
