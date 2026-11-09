import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Headphones,
  MessagesSquare,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { buttonVariants } from '@/components/ui/button';
import { Stars } from '@/components/ui/rating';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Avatar } from '@/components/ui/avatar';
import { formatCompact, formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { HomepageData } from '@/types';

export function StatsStrip({ data }: { data: HomepageData }) {
  const items = [
    { label: 'Active learners', value: formatCompact(data.stats.students), icon: Users },
    { label: 'Expert-led courses', value: formatNumber(data.stats.courses), icon: BookOpen },
    { label: 'Lessons available', value: formatCompact(data.stats.lessons), icon: PlayCircle },
    {
      label: 'Average rating',
      value: data.stats.averageRating ? `${data.stats.averageRating.toFixed(1)}/5` : 'New',
      icon: Star,
    },
  ];

  return (
    <section className="border-y bg-card/60">
      <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4 sm:py-10">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold sm:text-2xl">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategorySection({ data }: { data: HomepageData }) {
  if (!data.categories.length) return null;

  return (
    <section className="section-space">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Explore by topic</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Popular categories</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Find the discipline that matches your next career move.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View all courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.categories.map((category) => (
            <Link
              key={category._id}
              href={`/courses?category=${encodeURIComponent(category.slug)}`}
              className="group flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <DynamicIcon name={category.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{category.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {category.courseCount ?? 0} course{category.courseCount === 1 ? '' : 's'}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BenefitsSection({ data }: { data: HomepageData }) {
  const benefits = data.benefits?.length
    ? data.benefits
    : [
        {
          title: 'Learn by shipping',
          description: 'Every course is built around production-grade projects, not toy examples.',
          icon: 'Rocket',
        },
        {
          title: 'Instructor access',
          description: 'Ask questions on any lesson and get answers from working engineers.',
          icon: 'MessagesSquare',
        },
        {
          title: 'Lifetime access',
          description: 'Buy once, keep everything forever — including future course updates.',
          icon: 'ShieldCheck',
        },
        {
          title: 'Career-ready skills',
          description: 'Build the exact skills hiring teams evaluate in modern engineering interviews.',
          icon: 'GraduationCap',
        },
      ];

  return (
    <section className="section-space border-t bg-muted/30">
      <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="eyebrow">Why learners choose us</span>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            An education experience designed to get you hired — not just certified.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            We combine practical curriculum, active instructor support and measurable progress so
            you always know what to learn next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium">
              <Headphones className="h-4 w-4 text-primary" /> Support that answers
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> Secure checkout
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div
              key={`${benefit.title}-${index}`}
              className="group rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DynamicIcon name={benefit.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{benefit.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ data }: { data: HomepageData }) {
  if (!data.testimonials.length) return null;

  return (
    <section className="section-space">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Learner stories</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Loved by people who build</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real reviews from students who finished the work and changed their trajectory.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {data.testimonials.map((review) => (
            <figure
              key={review._id}
              className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft"
            >
              <Stars value={review.rating} size="md" />
              <blockquote className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">
                “{review.comment}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <Avatar name={review.user?.name} src={review.user?.avatar?.url} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{review.user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {review.course?.title}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ data }: { data: HomepageData }) {
  if (!data.faqs.length) return null;

  return (
    <section className="section-space border-t bg-muted/30">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Questions, answered.</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Everything you need to know about learning with Learnova. Cannot find your answer?
            Our team is one message away.
          </p>
          <Link
            href="/contact"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
          >
            <MessagesSquare className="h-4 w-4" />
            Contact support
          </Link>
        </div>
        <Accordion
          allowMultiple={false}
          defaultOpen={data.faqs[0] ? [data.faqs[0]._id] : []}
          items={data.faqs.map((faq) => ({
            id: faq._id,
            title: faq.question,
            content: <p>{faq.answer}</p>,
          }))}
        />
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="section-space">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-white sm:px-12 lg:px-16">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/35 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-500/25 blur-[90px]" />
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-10" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Your next chapter
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                Start learning today. Build something tomorrow.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Join thousands of engineers sharpening their craft with practical, project-based
                courses and real instructor support.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/courses"
                className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-slate-950 hover:bg-white/90')}
              >
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-white/25 bg-white/5 text-white hover:bg-white/10'
                )}
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
