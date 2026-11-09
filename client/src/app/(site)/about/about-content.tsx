'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Compass,
  HeartHandshake,
  MessagesSquare,
  Rocket,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetHomepageQuery } from '@/services/siteApi';
import { cn } from '@/utils/cn';
import { formatCompact, formatNumber } from '@/utils/format';

const values = [
  {
    icon: Target,
    title: 'Practical over theoretical',
    description:
      'Every lesson maps to a decision you will make on a real project — schema design, auth boundaries, payment reliability, or deployment.',
  },
  {
    icon: HeartHandshake,
    title: 'Support that answers',
    description:
      'Questions go to the same people who build the curriculum. Lesson-level Q&A and admin replies keep you unblocked.',
  },
  {
    icon: Compass,
    title: 'Honest engineering',
    description:
      'We teach trade-offs, not silver bullets. You will know when a pattern is appropriate and when it is overkill.',
  },
];

const approach = [
  {
    step: '01',
    title: 'Build the real thing',
    description: 'Start from a production requirement, not a toy example. Ship a milestone every module.',
  },
  {
    step: '02',
    title: 'Make it secure',
    description: 'Authentication, authorization, payments and uploads are treated as first-class engineering.',
  },
  {
    step: '03',
    title: 'Review and refine',
    description: 'Checkpoints, downloadable resources and reviews make the learning loop explicit.',
  },
  {
    step: '04',
    title: 'Prove your skills',
    description: 'Finish the course, earn a certificate, and keep lifetime access to every update.',
  },
];

export function AboutContent() {
  const { data, isLoading } = useGetHomepageQuery();
  const stats = data?.stats;

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-50" />
        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              About Learnova
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              We teach the engineering behind
              <span className="text-gradient"> products that ship.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Learnova is a project-based learning platform for developers who want more than a
              certificate. Our programs focus on the decisions that separate a demo from a maintainable,
              secure application — and on giving you direct access to instructors while you build.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/courses" className={buttonVariants({ size: 'lg' })}>
                Explore courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Talk to support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/20">
        <div className="container-page grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-4 w-24" />
              </div>
            ))
          ) : (
            <>
              <Stat value={formatNumber(stats?.students ?? 0)} label="Students learning" />
              <Stat value={formatNumber(stats?.courses ?? 0)} label="Published courses" />
              <Stat value={formatCompact(stats?.enrollments ?? 0)} label="Enrollments" />
              <Stat
                value={(stats?.averageRating ?? 0).toFixed(1)}
                label="Average course rating"
              />
            </>
          )}
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <span className="eyebrow">Why we exist</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Too much content. Not enough practice.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Most developers do not struggle because information is missing. They struggle because
              tutorials stop exactly where production begins: authorization rules, webhook verification,
              duplicate payments, protected uploads and the operational details that decide whether a
              feature is trustworthy.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Learnova courses are built around those details. Each program is a guided build with
              clear milestones, a real working application, and instructors available when you get stuck.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-soft">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Lifetime access.</span> Buy once, keep
                every future update to the curriculum.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {values.map((value) => (
              <div key={value.title} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-soft">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{value.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              How we teach
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">A loop built around shipping</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Each course follows the same structure so you always know what progress looks like.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((item) => (
              <div key={item.step} className="rounded-2xl border bg-card p-5 shadow-soft">
                <p className="text-xs font-black tracking-widest text-primary">{item.step}</p>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-16 sm:py-20 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <Users className="h-6 w-6 text-primary" />
          <h3 className="mt-4 text-lg font-bold">Who it is for</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Self-taught developers, bootcamp graduates, and working engineers who want to close specific
            gaps without taking a career break.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <BookOpenCheck className="h-6 w-6 text-primary" />
          <h3 className="mt-4 text-lg font-bold">What you leave with</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Deployable projects, a clearer mental model of production systems, downloadable references,
            and a certificate backed by completed lessons.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <MessagesSquare className="h-6 w-6 text-primary" />
          <h3 className="mt-4 text-lg font-bold">How we support you</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ask questions directly on lessons, read instructor replies, and leave reviews that help other
            learners choose the right program.
          </p>
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 text-white sm:px-12">
          <div className="pointer-events-none absolute inset-0 hero-glow opacity-70" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Ready to build something real?</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Browse the catalog, preview a free lesson, and enroll when you find the right program.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/courses" className={cn(buttonVariants({ size: 'lg' }))}>
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-white/20 bg-white/5 text-white hover:bg-white/10'
                )}
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}
