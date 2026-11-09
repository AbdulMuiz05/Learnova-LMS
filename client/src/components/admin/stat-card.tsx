import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

const tones = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
} as const;

export type StatTone = keyof typeof tones;

export function AdminStatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-black tabular-nums">{value}</p>
          {hint ? <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
