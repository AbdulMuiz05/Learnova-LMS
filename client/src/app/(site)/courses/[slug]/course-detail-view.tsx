'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Globe2,
  GraduationCap,
  Layers,
  Link2,
  Lock,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { CourseReviews } from '@/components/course/course-reviews';
import { Accordion } from '@/components/ui/accordion';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { Stars } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourseQuery, useGetLessonContentQuery } from '@/services/courseApi';
import { useCreateCheckoutMutation, useGetPaymentConfigQuery } from '@/services/paymentApi';
import type { Enrollment, Lesson } from '@/types';
import { getApiErrorMessage } from '@/utils/api-error';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, formatDuration, formatNumber, levelLabel } from '@/utils/format';

function lastLessonId(enrollment: Enrollment | null): string | null {
  if (!enrollment?.lastLesson) return null;
  return typeof enrollment.lastLesson === 'string' ? enrollment.lastLesson : enrollment.lastLesson._id;
}

export function CourseDetailView({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useGetCourseQuery(slug);
  const { user, isAdmin } = useAuth();
  const { data: paymentConfig } = useGetPaymentConfigQuery();
  const [createCheckout, { isLoading: startingCheckout }] = useCreateCheckoutMutation();
  const [previewLesson, setPreviewLesson] = React.useState<Lesson | null>(null);
  const [checkoutError, setCheckoutError] = React.useState('');
  const router = useRouter();
  const pathname = usePathname();

  const course = data?.course;
  const enrolled = Boolean(data?.isEnrolled);
  const canLearn = enrolled || isAdmin;
  const currency = paymentConfig?.currency ?? 'usd';

  const handleEnroll = async () => {
    if (!course) return;
    setCheckoutError('');
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    try {
      const result = await createCheckout({ courseId: course._id }).unwrap();
      if (result.url?.startsWith('http')) {
        window.location.assign(result.url);
        return;
      }
      if (result.url) {
        router.push(result.url);
        return;
      }
      toast.success(result.message ?? 'You are enrolled. Happy learning!');
    } catch (error) {
      const message = getApiErrorMessage(error, 'We could not start enrollment.');
      setCheckoutError(message);
      toast.error(message);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!course) return;
    if (canLearn) {
      router.push(`/learn/${course._id}?lesson=${lesson._id}`);
      return;
    }
    if (lesson.isPreview) {
      if (!user) {
        toast.info('Sign in to watch the free preview.');
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setPreviewLesson(lesson);
      return;
    }
    toast.info('Enroll in this course to unlock this lesson.');
    document.getElementById('enroll-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Course link copied to your clipboard.');
    } catch {
      toast.error('Your browser blocked clipboard access.');
    }
  };

  if (isLoading) return <CourseDetailSkeleton />;

  if (isError || !course || !data) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={RefreshCcw}
          title="This course could not be loaded"
          description="The course may be unpublished, or the API is not responding. Go back to the catalog or retry."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>
                <ArrowLeft className="h-4 w-4" />
                Back to catalog
              </Link>
              <Button onClick={() => refetch()} loading={isFetching}>
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const hasDiscount =
    course.discountPrice !== null && course.price > 0 && course.discountPrice < course.price;
  const discountPercent = hasDiscount
    ? Math.round(((course.price - (course.discountPrice ?? 0)) / course.price) * 100)
    : 0;
  const isFree = course.effectivePrice <= 0;
  const paymentsUnavailable = !isFree && paymentConfig?.provider === 'unavailable';
  const totalSections = data.curriculum.length;
  const curriculumDuration = data.curriculum.reduce(
    (sum, section) => sum + section.lessons.reduce((inner, lesson) => inner + (lesson.duration ?? 0), 0),
    0
  );
  const resumeId = lastLessonId(data.enrollment);
  const learnHref = `/learn/${course._id}${resumeId ? `?lesson=${resumeId}` : ''}`;

  const enrollLabel = enrolled
    ? 'Continue learning'
    : !user
      ? 'Sign in to enroll'
      : paymentsUnavailable
        ? 'Payments unavailable'
        : isFree
          ? 'Enroll for free'
          : paymentConfig?.provider === 'demo'
            ? 'Enroll with demo checkout'
            : 'Enroll now';

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/[0.08] via-background to-amber-500/[0.06]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="container-page relative py-8 sm:py-12">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/courses" className="transition-colors hover:text-foreground">
              Courses
            </Link>
            <span>/</span>
            <Link
              href={`/courses?category=${course.category?.slug ?? ''}`}
              className="transition-colors hover:text-foreground"
            >
              {course.category?.name ?? 'General'}
            </Link>
            <span>/</span>
            <span className="max-w-[220px] truncate text-foreground sm:max-w-none">{course.title}</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{course.category?.name ?? 'General'}</Badge>
              <Badge variant="secondary">{levelLabel(course.level)}</Badge>
              {course.featured ? (
                <Badge variant="warning">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </Badge>
              ) : null}
              {isFree ? <Badge variant="success">Free course</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {course.shortDescription}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {course.rating?.count ? (
                <span className="inline-flex items-center gap-1.5">
                  <Stars value={course.rating.average} size="sm" />
                  <strong className="text-foreground">{course.rating.average.toFixed(1)}</strong>
                  <span>({formatNumber(course.rating.count)} reviews)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  New course
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {formatNumber(course.enrollmentCount)} students
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {formatNumber(course.totalLessons)} lessons
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                {formatDuration(course.totalDuration)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-4 w-4" />
                {course.language || 'English'}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={course.instructor?.name || 'Learnova Faculty'}
                  src={course.instructor?.avatar || undefined}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-semibold">{course.instructor?.name || 'Learnova Faculty'}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.instructor?.title || 'Senior software engineer'}
                  </p>
                </div>
              </div>
              <span className="h-8 w-px bg-border" />
              <p className="text-xs text-muted-foreground">
                Last updated {formatDate(course.updatedAt ?? course.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <aside id="enroll-card" className="order-first scroll-mt-24 lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-lift lg:sticky lg:top-24">
            <div className="relative aspect-video bg-muted">
              {course.thumbnail?.url ? (
                <Image
                  src={course.thumbnail.url}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-500/10">
                  <PlayCircle className="h-14 w-14 text-primary/50" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const firstPreview = data.curriculum
                    .flatMap((section) => section.lessons)
                    .find((lesson) => lesson.isPreview);
                  if (firstPreview) handleLessonClick(firstPreview);
                  else toast.info('This course has no free preview lesson.');
                }}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/25 transition-colors hover:bg-slate-950/40"
                aria-label="Watch a free preview"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg">
                  <PlayCircle className="h-8 w-8" />
                </span>
              </button>
            </div>

            <div className="p-5">
              {enrolled && data.enrollment ? (
                <div className="mb-4 rounded-xl border bg-success/5 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                    <BadgeCheck className="h-4 w-4" />
                    You are enrolled
                  </p>
                  <Progress className="mt-2" value={data.enrollment.progress} showLabel />
                </div>
              ) : null}

              <div className="flex items-end justify-between gap-3">
                <div>
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">{formatCurrency(course.discountPrice ?? 0, currency)}</span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(course.price, currency)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-black">
                      {isFree ? 'Free' : formatCurrency(course.price, currency)}
                    </span>
                  )}
                  {hasDiscount ? (
                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Save {discountPercent}% for a limited time
                    </p>
                  ) : null}
                </div>
                {hasDiscount ? (
                  <Badge variant="warning" className="mb-1">
                    {discountPercent}% off
                  </Badge>
                ) : null}
              </div>

              {enrolled ? (
                <Link href={learnHref} className={cn(buttonVariants({ size: 'lg' }), 'mt-5 w-full')}>
                  {enrollLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="mt-5 w-full"
                  onClick={handleEnroll}
                  loading={startingCheckout}
                  disabled={paymentsUnavailable}
                >
                  {paymentsUnavailable ? <Lock className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                  {startingCheckout ? 'Starting checkout…' : enrollLabel}
                </Button>
              )}

              {checkoutError ? (
                <Alert variant="error" className="mt-3">
                  {checkoutError}
                </Alert>
              ) : null}

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                {isFree ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    Instant access — no payment required
                  </>
                ) : paymentConfig?.provider === 'demo' ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                    Demo checkout — no real card is charged
                  </>
                ) : paymentsUnavailable ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Add Stripe keys on the server to accept payments
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    Secure checkout powered by Stripe
                  </>
                )}
              </p>
              {!user && !enrolled ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  You will sign in before checkout. New here?{' '}
                  <Link href="/register" className="font-semibold text-primary hover:underline">
                    Create an account
                  </Link>
                  .
                </p>
              ) : null}

              <div className="mt-5 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  This course includes
                </p>
                <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                  {[
                    `${formatDuration(curriculumDuration || course.totalDuration)} of video`,
                    `${formatNumber(course.totalLessons)} lessons across ${totalSections} modules`,
                    'Downloadable resources and exercises',
                    'Q&A support from instructors',
                    'Certificate of completion',
                    'Lifetime access, including updates',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={copyLink}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Link2 className="h-3.5 w-3.5" />
                Share this course
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          {course.benefits.length ? (
            <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-7">
              <h2 className="text-xl font-bold">What you&apos;ll learn</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2.5 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-xl font-bold">About this course</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {course.description}
            </div>
          </section>

          {course.requirements.length ? (
            <section>
              <h2 className="text-xl font-bold">Requirements</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {course.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section id="curriculum" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Course curriculum</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalSections} modules · {formatNumber(course.totalLessons)} lessons ·{' '}
                  {formatDuration(curriculumDuration || course.totalDuration)}
                </p>
              </div>
              {!enrolled ? (
                <p className="text-xs text-muted-foreground">
                  <PlayCircle className="mr-1 inline h-3.5 w-3.5 text-primary" />
                  Preview lessons are marked free
                </p>
              ) : (
                <p className="text-xs font-semibold text-success">
                  <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                  Full access unlocked
                </p>
              )}
            </div>

            {data.curriculum.length ? (
              <Accordion
                className="mt-4"
                defaultOpen={[data.curriculum[0]._id]}
                items={data.curriculum.map((section) => {
                  const sectionDuration = section.lessons.reduce(
                    (sum, lesson) => sum + (lesson.duration ?? 0),
                    0
                  );
                  return {
                    id: section._id,
                    title: section.title,
                    subtitle: `${section.lessons.length} lesson${section.lessons.length === 1 ? '' : 's'}${
                      sectionDuration ? ` · ${formatDuration(sectionDuration)}` : ''
                    }`,
                    content: (
                      <ul className="-mx-1 space-y-1">
                        {section.lessons.map((lesson, index) => {
                          const completed = Boolean(
                            data.enrollment?.completedLessons?.includes(lesson._id)
                          );
                          const unlocked = canLearn || lesson.isPreview;
                          return (
                            <li key={lesson._id}>
                              <button
                                type="button"
                                onClick={() => handleLessonClick(lesson)}
                                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-muted/70"
                              >
                                <span className="w-6 shrink-0 text-xs font-semibold text-muted-foreground">
                                  {index + 1}.
                                </span>
                                <span
                                  className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                                    completed
                                      ? 'bg-success/10 text-success'
                                      : unlocked
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {completed ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : unlocked ? (
                                    <PlayCircle className="h-4 w-4" />
                                  ) : (
                                    <Lock className="h-3.5 w-3.5" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        'text-sm font-medium',
                                        unlocked ? 'text-foreground' : 'text-muted-foreground'
                                      )}
                                    >
                                      {lesson.title}
                                    </span>
                                    {lesson.isPreview && !enrolled ? (
                                      <Badge variant="success" className="px-2 py-0 text-[10px]">
                                        Free preview
                                      </Badge>
                                    ) : null}
                                  </span>
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {formatDuration(lesson.duration)}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ),
                  };
                })}
              />
            ) : (
              <EmptyState
                className="mt-4"
                compact
                icon={Layers}
                title="Curriculum coming soon"
                description="The instructor is still preparing lessons for this course."
              />
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold">Your instructor</h2>
            <div className="mt-4 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  name={course.instructor?.name || 'Learnova Faculty'}
                  src={course.instructor?.avatar || undefined}
                  size="xl"
                />
                <div>
                  <p className="text-base font-semibold">{course.instructor?.name || 'Learnova Faculty'}</p>
                  <p className="text-sm text-primary">{course.instructor?.title || 'Senior software engineer'}</p>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {formatNumber(course.enrollmentCount)} students
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Stars value={course.rating?.average ?? 0} size="xs" />
                      {(course.rating?.average ?? 0).toFixed(1)} instructor rating
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {course.instructor?.bio ||
                  'A practicing engineer who teaches the exact patterns, tools and trade-offs used on real production teams.'}
              </p>
            </div>
          </section>

          <CourseReviews courseId={course._id} isEnrolled={enrolled} />
        </div>
      </div>

      <PreviewModal
        open={Boolean(previewLesson)}
        lesson={previewLesson}
        onClose={() => setPreviewLesson(null)}
        onEnroll={() => {
          setPreviewLesson(null);
          document.getElementById('enroll-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />
    </div>
  );
}

function PreviewModal({
  open,
  lesson,
  onClose,
  onEnroll,
}: {
  open: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onEnroll: () => void;
}) {
  const { data, isLoading, isError } = useGetLessonContentQuery(lesson?._id ?? '', {
    skip: !open || !lesson,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lesson?.title ?? 'Free preview'}
      description="Free preview lesson"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEnroll}>
            <GraduationCap className="h-4 w-4" />
            Unlock the full course
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : isError || !data ? (
        <Alert variant="error" title="Preview unavailable">
          This preview could not be loaded. Please try again in a moment.
        </Alert>
      ) : (
        <div className="space-y-4">
          {data.lesson.video.url ? (
            <video
              key={data.lesson._id}
              src={data.lesson.video.url}
              poster={data.lesson.video.poster || undefined}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              className="aspect-video w-full rounded-xl bg-slate-950"
            >
              Your browser does not support embedded video playback.
            </video>
          ) : (
            <Alert variant="warning" title="Video not attached">
              This free preview does not have a video file yet.
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              {formatDuration(data.lesson.duration)} preview
            </p>
            <Badge variant="success">
              <BadgeCheck className="h-3 w-3" />
              Free preview
            </Badge>
          </div>
          {data.lesson.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{data.lesson.description}</p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

function CourseDetailSkeleton() {
  return (
    <div>
      <div className="border-b bg-muted/20">
        <div className="container-page py-10">
          <Skeleton className="h-4 w-64" />
          <div className="mt-6 max-w-3xl space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-first space-y-4 lg:order-none">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
