import * as React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, icon, ...props },
  ref
) {
  return (
    <div className="relative">
      {icon ? (
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60',
          icon && 'pl-10',
          invalid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
    </div>
  );
});
