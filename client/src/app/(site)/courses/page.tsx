import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CoursesCatalog } from './courses-catalog';
import { CourseCardSkeleton, Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Course catalog',
  description: 'Browse every published course, filter by topic and difficulty, and start learning.',
};

function CatalogFallback() {
  return (
    <div className="container-page py-10 sm:py-14">
      <Skeleton className="h-5 w-32 rounded-full" />
      <Skeleton className="mt-3 h-10 w-80" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <Skeleton className="mt-7 h-28 w-full rounded-2xl" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CoursesCatalog />
    </Suspense>
  );
}
