import * as React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'primary';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  destructive: 'bg-destructive/10 text-destructive',
  outline: 'border text-muted-foreground',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
