import { cn } from '@/utils/cn';

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
}

export function Progress({ value, className, barClassName, showLabel = false }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full bg-primary transition-all duration-500', barClassName)}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
        />
      </div>
      {showLabel ? (
        <span className="w-9 text-right text-xs font-semibold text-muted-foreground">{clamped}%</span>
      ) : null}
    </div>
  );
}
