'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, RefreshCcw } from 'lucide-react';
import { Hero } from '@/components/home/hero';
import {
  BenefitsSection,
  CategorySection,
  CtaSection,
  FaqSection,
  StatsStrip,
  TestimonialsSection,
} from '@/components/home/sections';
import { CourseCard } from '@/components/course/course-card';
import { CourseCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useGetHomepageQuery } from '@/services/siteApi';

export default function HomePage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetHomepageQuery();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <BookOpen className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">We could not load the homepage</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The course API is not responding. Check that the backend server is running, then try
          again.
        </p>
        <Button className="mt-6" onClick={() => refetch()} loading={isFetching}>
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <Hero data={data} />
      <StatsStrip data={data} />

      <section className="section-space">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Featured programs</span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Hand-picked courses to level up</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Deep, practical programs taught by engineers who build the same systems they teach.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Explore the catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {data.featuredCourses.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.featuredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-8"
              icon={BookOpen}
              title="Courses are on the way"
              description="Published courses will appear here automatically as soon as the academy is seeded or an administrator publishes one."
              action={
                <Link href="/courses" className="text-sm font-semibold text-primary hover:underline">
                  Visit the catalog
                </Link>
              }
            />
          )}
        </div>
      </section>

      <CategorySection data={data} />
      <BenefitsSection data={data} />
      <TestimonialsSection data={data} />
      <FaqSection data={data} />
      <CtaSection />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div>
      <div className="container-page grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-5">
          <Skeleton className="h-7 w-52 rounded-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <div className="flex gap-3 pt-3">
            <Skeleton className="h-12 w-40 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3.2] w-full rounded-3xl" />
      </div>
      <div className="border-y py-10">
        <div className="container-page grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="container-page py-16">
        <Skeleton className="h-8 w-72" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
