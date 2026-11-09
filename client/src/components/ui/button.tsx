import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95',
  secondary: 'bg-muted text-foreground hover:bg-muted/80',
  outline: 'border bg-card text-foreground shadow-sm hover:bg-muted/60',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
  link: 'text-primary underline-offset-4 hover:underline',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
  icon: 'h-10 w-10 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-md',
};

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, children, type, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
