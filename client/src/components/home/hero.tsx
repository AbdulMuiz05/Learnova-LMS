import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, PlayCircle, Star, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Stars } from '@/components/ui/rating';
import { formatCompact } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { HomepageData } from '@/types';

export function Hero({ data }: { data: HomepageData }) {
  const { hero, stats, testimonials } = data;
  const words = hero.headline.trim().split(' ');
  const lead = words.slice(0, Math.max(1, words.length - 2)).join(' ');
  const accent = words.slice(-2).join(' ');

  return (
    <section className="relative overflow-hidden hero-glow">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            {hero.badge || 'Industry-grade learning'}
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.08] sm:text-5xl xl:text-[3.6rem]">
            {lead} <span className="text-gradient">{accent}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            {hero.description || hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={hero.primaryCta.href} className={buttonVariants({ size: 'lg' })}>
              {hero.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              <PlayCircle className="h-[18px] w-[18px]" />
              {hero.secondaryCta.label}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2.5">
                {testimonials.slice(0, 3).map((review) => (
                  <span
                    key={review._id}
                    className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-gradient-to-br from-primary/25 to-sky-500/20 text-[10px] font-bold text-primary"
                  >
                    {review.user?.avatar?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.user.avatar.url}
                        alt={review.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      review.user?.name?.slice(0, 1).toUpperCase()
                    )}
                  </span>
                ))}
              </div>
              <div className="text-xs leading-4">
                <p className="font-semibold">{formatCompact(stats.students)}+ learners</p>
                <p className="text-muted-foreground">already building with us</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Stars value={stats.averageRating || 4.8} size="sm" />
              <span className="text-xs font-medium text-muted-foreground">
                {stats.averageRating ? stats.averageRating.toFixed(1) : '4.8'} average rating
              </span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg animate-fade-up [animation-delay:120ms]">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-sky-500/10 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border bg-card p-2 shadow-lift">
            <div className="relative aspect-[4/3.2] overflow-hidden rounded-[1.4rem] bg-muted">
              <Image
                src={hero.image?.url}
                alt="Students learning together"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl border border-white/15 bg-slate-950/55 px-4 py-3 text-white backdrop-blur-md">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                    Continue learning
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">Full-Stack Next.js Masterclass</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950">
                  <PlayCircle className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 top-6 hidden rounded-xl border bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success">
                <BadgeCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold leading-3">Certificate earned</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">React patterns</p>
              </div>
            </div>
          </div>

          <div className="absolute -left-4 bottom-16 hidden rounded-xl border bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold leading-3">
                  {formatCompact(stats.enrollments)} enrollments
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  Live community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
