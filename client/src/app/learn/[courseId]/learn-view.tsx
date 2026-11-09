'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock3,
  Download,
  FileText,
  ListVideo,
  LockKeyhole,
  MessageSquare,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { LessonQuestions } from '@/components/learn/lesson-questions';
import { Logo } from '@/components/layout/logo';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageLoader } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useCompleteLessonMutation, useGetLearnCourseQuery, useGetLessonContentQuery } from '@/services/courseApi';
import { getApiErrorCode, getApiErrorMessage } from '@/utils/api-error';
import { cn } from '@/utils/cn';
import { formatDuration, formatNumber } from '@/utils/format';

export function LearnView({ courseId }: { courseId: string }) {
  const { user, ready, status } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, isError, error, refetch, isFetching } = useGetLearnCourseQuery(courseId, {
    skip: !ready,
  });
  const [completeLesson, { isLoading: completing }] = useCompleteLessonMutation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [completedIds, setCompletedIds] = React.useState<string[]>([]);

  const lessons = React.useMemo(
    () => (data?.curriculum ?? []).flatMap((section) => section.lessons),
    [data]
  );
  const requestedId = searchParams.get('lesson');
  const requestedValid = requestedId && lessons.some((lesson) => lesson._id === requestedId);
  const resumeValid =
    data?.resumeLesson && lessons.some((lesson) => lesson._id === data.resumeLesson);
  const selectedId = requestedValid
    ? requestedId
    : resumeValid
      ? data?.resumeLesson ?? null
      : lessons[0]?._id ?? null;

  const contentQuery = useGetLessonContentQuery(selectedId ?? '', { skip: !selectedId });
  const content = contentQuery.data;
  const isLoadingLesson = contentQuery.isLoading;

  React.useEffect(() => {
    if (data?.enrollment) {
      setCompletedIds(data.enrollment.completedLessons.map(String));
    }
  }, [data?.enrollment?._id, data?.enrollment?.completedLessons]);

  React.useEffect(() => {
    setDrawerOpen(false);
    if (selectedId) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedId]);

  const progress = lessons.length ? Math.round((completedIds.length / lessons.length) * 100) : 0;
  const completed = selectedId ? completedIds.includes(selectedId) : false;
  const canAsk = Boolean(data?.enrollment);
  const isAdminPreview = Boolean(data?.isAdminPreview) || (Boolean(data) && !data?.enrollment);

  const goToLesson = (lessonId: string) => {
    router.push(`/learn/${courseId}?lesson=${lessonId}`, { scroll: false });
  };

  const markComplete = async () => {
    if (!selectedId) return;
    try {
      const result = await completeLesson(selectedId).unwrap();
      setCompletedIds(result.enrollment.completedLessons.map(String));
      const total = lessons.length;
      const done = result.enrollment.completedLessons.length;
      toast.success(
        total > 0 && done >= total
          ? 'You completed every lesson in this course. Excellent work!'
          : 'Lesson marked as complete.'
      );
    } catch (markError) {
      toast.error(getApiErrorMessage(markError, 'Could not update your progress.'));
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader label={status === 'guest' ? 'Redirecting to sign in' : 'Opening your course'} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <LearnTopbar />
        <div className="flex">
          <div className="hidden w-[340px] border-r p-5 lg:block">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-10 w-full" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 sm:p-6">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="mt-6 h-8 w-2/3" />
            <Skeleton className="mt-3 h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const notEnrolled = getApiErrorCode(error) === 'NOT_ENROLLED';
    return (
      <div className="min-h-screen">
        <LearnTopbar />
        <div className="container-page py-20">
          <EmptyState
            icon={LockKeyhole}
            title={notEnrolled ? 'Enrollment required' : 'This course could not be opened'}
            description={
              notEnrolled
                ? 'This learning workspace is available only to enrolled students. Enroll in the course to unlock every lesson, resource and the Q&A discussion.'
                : 'The course may be unavailable, or the API is not responding. Go back to your dashboard or retry.'
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/courses" className={buttonVariants()}>
                  Browse courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard/courses" className={buttonVariants({ variant: 'outline' })}>
                  My courses
                </Link>
                {!notEnrolled ? (
                  <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                  </Button>
                ) : null}
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const course = data.course;
  const activeIndex = lessons.findIndex((lesson) => lesson._id === selectedId);
  const activeLesson = lessons[activeIndex];

  return (
    <div className="min-h-screen bg-background">
      <LearnTopbar course={course.title} courseSlug={course.slug} />

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[340px] shrink-0 overflow-y-auto border-r bg-card/40 scrollbar-thin lg:block">
          <SidebarContent
            courseTitle={course.title}
            courseSlug={course.slug}
            curriculum={data.curriculum}
            selectedId={selectedId}
            completedIds={completedIds}
            progress={progress}
            totalLessons={lessons.length}
            onSelect={goToLesson}
          />
        </aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-bold">Course content</p>
                <Button variant="ghost" size="icon-sm" onClick={() => setDrawerOpen(false)} aria-label="Close course content">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent
                  courseTitle={course.title}
                  courseSlug={course.slug}
                  curriculum={data.curriculum}
                  selectedId={selectedId}
                  completedIds={completedIds}
                  progress={progress}
                  totalLessons={lessons.length}
                  onSelect={goToLesson}
                />
              </div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          {isAdminPreview ? (
            <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              Administrator preview — progress is not tracked and questions cannot be posted.
            </div>
          ) : null}

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'lg:hidden')}
              >
                <ListVideo className="h-4 w-4" />
                Course content
              </button>
              <Link
                href={`/courses/${course.slug}`}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Course details
              </Link>
            </div>

            {activeLesson ? (
              <>
                <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-lift">
                  {isLoadingLesson ? (
                    <Skeleton className="aspect-video w-full rounded-2xl" />
                  ) : contentQuery.isError ? (
                    <div className="flex aspect-video w-full items-center justify-center p-6">
                      <Alert variant="error" title="Lesson unavailable">
                        {getApiErrorMessage(contentQuery.error, 'This lesson could not be loaded.')}
                      </Alert>
                    </div>
                  ) : content?.lesson.video.url ? (
                    <>
                      <video
                        key={content.lesson._id}
                        src={content.lesson.video.url}
                        poster={content.lesson.video.poster || undefined}
                        controls
                        autoPlay
                        playsInline
                        controlsList="nodownload"
                        onContextMenu={(event) => event.preventDefault()}
                        className="aspect-video w-full"
                      >
                        Your browser does not support embedded video playback.
                      </video>
                      <div className="pointer-events-none absolute right-4 top-4 text-[10px] font-medium tracking-wide text-white/25">
                        {user?.email}
                      </div>
                    </>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-center text-white/60">
                      <PlayCircle className="h-12 w-12" />
                      <p className="text-sm">No video has been attached to this lesson yet.</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        Lesson {content ? content.navigation.index + 1 : activeIndex + 1} of{' '}
                        {content?.navigation.total ?? lessons.length}
                      </Badge>
                      {activeLesson.isPreview ? <Badge variant="success">Free preview</Badge> : null}
                      {completed ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : null}
                    </div>
                    <h1 className="mt-2.5 text-xl font-bold leading-snug sm:text-2xl">
                      {content?.lesson.title ?? activeLesson.title}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDuration(content?.lesson.duration ?? activeLesson.duration)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {formatNumber(content?.navigation.total ?? lessons.length)} lessons in course
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedId && canAsk ? (
                      completed ? (
                        <Button variant="outline" disabled>
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Completed
                        </Button>
                      ) : (
                        <Button onClick={markComplete} loading={completing}>
                          <CheckCircle2 className="h-4 w-4" />
                          Mark as complete
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="min-w-0">
                    <Tabs defaultValue="overview">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="questions">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Q&amp;A
                          </span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        {isLoadingLesson ? (
                          <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        ) : contentQuery.isError ? (
                          <Alert variant="error" title="Could not load lesson content">
                            <Button size="sm" variant="outline" className="mt-2" onClick={() => contentQuery.refetch()}>
                              <RefreshCcw className="h-3.5 w-3.5" />
                              Retry
                            </Button>
                          </Alert>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                About this lesson
                              </h2>
                              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                {content?.lesson.description ||
                                  'This lesson does not have a written description. Watch the video, then mark the lesson complete to update your progress.'}
                              </p>
                            </div>

                            {content?.lesson.resources.length ? (
                              <div>
                                <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                  <FileText className="h-4 w-4" />
                                  Lesson resources
                                </h2>
                                <ul className="mt-2 space-y-2">
                                  {content.lesson.resources.map((resource) => (
                                    <li key={`${resource.title}-${resource.url}`}>
                                      <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
                                      >
                                        <span className="flex min-w-0 items-center gap-2">
                                          <Download className="h-4 w-4 shrink-0 text-primary" />
                                          <span className="truncate">{resource.title}</span>
                                        </span>
                                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                              {content?.navigation.previous ? (
                                <Button
                                  variant="outline"
                                  onClick={() => goToLesson(content.navigation.previous!._id)}
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                  Previous lesson
                                </Button>
                              ) : (
                                <span />
                              )}
                              {content?.navigation.next ? (
                                <Button onClick={() => goToLesson(content.navigation.next!._id)}>
                                  Next lesson
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Link href="/dashboard/courses" className={buttonVariants()}>
                                  Back to my courses
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="questions">
                        {selectedId ? <LessonQuestions lessonId={selectedId} canAsk={canAsk} /> : null}
                      </TabsContent>
                    </Tabs>
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-2xl border bg-card p-4 shadow-soft">
                      <h3 className="text-sm font-semibold">Your progress</h3>
                      <p className="mt-1 text-2xl font-black">{progress}%</p>
                      <Progress className="mt-2" value={progress} />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {completedIds.length} of {lessons.length} lessons completed
                      </p>
                      {progress === 100 ? (
                        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-2 text-xs font-semibold text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          Course complete
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border bg-card p-4 shadow-soft">
                      <h3 className="text-sm font-semibold">Up next</h3>
                      {content?.navigation.next ? (
                        <button
                          type="button"
                          onClick={() => goToLesson(content.navigation.next!._id)}
                          className="mt-2 w-full rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                        >
                          <p className="line-clamp-2 text-sm font-medium">{content.navigation.next.title}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                            Continue <ArrowRight className="h-3.5 w-3.5" />
                          </p>
                        </button>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          This is the final lesson. Revisit earlier lessons any time.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
                      <p className="flex items-center gap-1.5 font-semibold text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-success" />
                        Protected lesson
                      </p>
                      Video URLs are signed for enrolled accounts and may expire. Do not share links or
                      recordings.
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="This course has no lessons yet"
                description="The curriculum is still being prepared. Check back soon or contact support."
                action={
                  <Link href={`/courses/${course.slug}`} className={buttonVariants({ variant: 'outline' })}>
                    Back to course details
                  </Link>
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function LearnTopbar({ course, courseSlug }: { course?: string; courseSlug?: string }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Logo />
        {course ? (
          <>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <Link
              href={`/courses/${courseSlug}`}
              className="hidden max-w-[280px] truncate text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {course}
            </Link>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href="/dashboard/courses"
          className="mr-1 hidden items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground sm:flex"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          My learning
        </Link>
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

function SidebarContent({
  courseTitle,
  courseSlug,
  curriculum,
  selectedId,
  completedIds,
  progress,
  totalLessons,
  onSelect,
}: {
  courseTitle: string;
  courseSlug: string;
  curriculum: { _id: string; title: string; lessons: { _id: string; title: string; duration: number }[] }[];
  selectedId: string | null;
  completedIds: string[];
  progress: number;
  totalLessons: number;
  onSelect: (lessonId: string) => void;
}) {
  let lessonCounter = 0;

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Course content</p>
        <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug">{courseTitle}</h2>
        <div className="mt-3">
          <Progress value={progress} />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{completedIds.length}/{totalLessons} completed</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2" aria-label="Curriculum">
        {curriculum.map((section) => (
          <div key={section._id} className="pb-1">
            <p className="px-4 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul>
              {section.lessons.map((lesson) => {
                lessonCounter += 1;
                const active = lesson._id === selectedId;
                const done = completedIds.includes(lesson._id);
                return (
                  <li key={lesson._id}>
                    <button
                      type="button"
                      onClick={() => onSelect(lesson._id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors',
                        active
                          ? 'border-r-2 border-primary bg-primary/[0.08]'
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <span className="shrink-0">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : active ? (
                          <PlayCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-xs leading-5',
                            active ? 'font-semibold text-primary' : 'text-foreground'
                          )}
                        >
                          {lesson.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Lesson {lessonCounter} · {formatDuration(lesson.duration)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <Link
          href={`/courses/${courseSlug}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Course details
        </Link>
      </div>
    </div>
  );
}
