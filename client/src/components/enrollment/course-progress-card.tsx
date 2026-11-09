'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Enrollment } from '@/types';
import { cn } from '@/utils/cn';
import { formatDuration, formatNumber, levelLabel } from '@/utils/format';

export function resumeHref(enrollment: Enrollment): string {
  const last = enrollment.lastLesson;
  const lessonId = typeof last === 'string' ? last : last?._id;
  return `/learn/${enrollment.course._id}${lessonId ? `?lesson=${lessonId}` : ''}`;
}

export function CourseProgressCard({
  enrollment,
  className,
}: {
  enrollment: Enrollment;
  className?: string;
}) {
  const course = enrollment.course;
  const completed = enrollment.progress >= 100;
  const started = enrollment.progress > 0;

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:border-primary/30 hover:shadow-lift sm:flex-row',
        className
      )}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="relative block aspect-video shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:w-56"
      >
        {course.thumbnail?.url ? (
          <Image
            src={course.thumbnail.url}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, 224px"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-32 w-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-500/10">
            <PlayCircle className="h-10 w-10 text-primary/50" />
          </div>
        )}
        <span className="absolute left-3 top-3">
          {completed ? (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          ) : started ? (
            <Badge variant="primary">{Math.round(enrollment.progress)}% complete</Badge>
          ) : (
            <Badge variant="secondary">Not started</Badge>
          )}
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {typeof course.category === 'string' ? 'Course' : course.category?.name}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">
          <Link href={`/courses/${course.slug}`} className="transition-colors hover:text-primary">
            {course.title}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDuration(course.totalDuration)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {formatNumber(course.totalLessons)} lessons
          </span>
          <span className="inline-flex items-center gap-1">{levelLabel(course.level)}</span>
        </div>

        <div className="mt-3">
          <Progress value={enrollment.progress} showLabel />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {enrollment.completedLessons.length} of {course.totalLessons} lessons completed
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Link href={resumeHref(enrollment)} className={cn(buttonVariants({ size: 'sm' }))}>
            {completed ? 'Review course' : started ? 'Continue learning' : 'Start learning'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/courses/${course.slug}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Course details
          </Link>
        </div>
      </div>
    </article>
  );
}
