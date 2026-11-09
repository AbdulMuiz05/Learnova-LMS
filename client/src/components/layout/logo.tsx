import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Learnova home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 text-white shadow-lift transition-transform group-hover:-rotate-3">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[16px] font-bold tracking-[-0.02em]">Learnova</span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Learning Platform
          </span>
        </span>
      ) : null}
    </Link>
  );
}
