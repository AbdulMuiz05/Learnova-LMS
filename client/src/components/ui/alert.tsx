import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const config: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-sky-500/25 bg-sky-500/8 text-sky-800 dark:text-sky-200' },
  success: { icon: CheckCircle2, className: 'border-success/25 bg-success/8 text-success' },
  warning: { icon: TriangleAlert, className: 'border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300' },
  error: { icon: AlertCircle, className: 'border-destructive/25 bg-destructive/8 text-destructive' },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: variantClass } = config[variant];
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-sm', variantClass, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-1', 'leading-5')}>{children}</div> : null}
      </div>
    </div>
  );
}
