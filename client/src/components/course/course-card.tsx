import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock3, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Stars } from '@/components/ui/rating';
import { formatCurrency, formatDuration, formatNumber, levelLabel } from '@/utils/format';
import type { Course } from '@/types';

export function CourseCard({ course }: { course: Course }) {
  const price = course.effectivePrice ?? course.discountPrice ?? course.price;
  const hasDiscount =
    course.discountPrice !== null &&
    course.price > 0 &&
    course.discountPrice < course.price;
  const discountPercent = hasDiscount
    ? Math.round(((course.price - (course.discountPrice ?? 0)) / course.price) * 100)
    : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
      <Link href={`/courses/${course.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-muted">
        {course.thumbnail?.url ? (
          <Image
            src={course.thumbnail.url}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-500/10">
            <PlayCircle className="h-12 w-12 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <Badge className="bg-slate-950/70 text-white backdrop-blur" variant="secondary">
            {levelLabel(course.level)}
          </Badge>
          {hasDiscount ? (
            <Badge variant="warning" className="bg-amber-400 text-amber-950">
              -{discountPercent}%
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {typeof course.category === 'string' ? 'Course' : course.category?.name}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug">
          <Link href={`/courses/${course.slug}`} className="transition-colors hover:text-primary">
            {course.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
          {course.shortDescription}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDuration(course.totalDuration)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.totalLessons} lessons
          </span>
          <span className="inline-flex items-center gap-1">
            <Stars value={course.rating?.average ?? 0} size="xs" />
            <span className="font-medium text-foreground">
              {(course.rating?.average ?? 0).toFixed(1)}
            </span>
            <span>({formatNumber(course.rating?.count ?? 0)})</span>
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(course.discountPrice ?? 0)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(course.price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-foreground">
                {price <= 0 ? 'Free' : formatCurrency(price)}
              </span>
            )}
          </div>
          <Link
            href={`/courses/${course.slug}`}
            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            View course
          </Link>
        </div>
      </div>
    </article>
  );
}
