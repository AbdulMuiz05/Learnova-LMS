'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Stars({
  value,
  size = 'sm',
  className,
}: {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = value >= index + 0.75;
        const half = !filled && value >= index + 0.25;
        return (
          <span key={index} className="relative inline-flex">
            <Star
              className={cn(
                sizes[size],
                half ? 'text-amber-400/50' : filled ? 'text-amber-400' : 'text-muted-foreground/30'
              )}
              strokeWidth={2}
            />
            {half ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star className={cn(sizes[size], 'fill-amber-400 text-amber-400')} strokeWidth={2} />
              </span>
            ) : null}
            {filled ? (
              <span className="absolute inset-0">
                <Star className={cn(sizes[size], 'fill-amber-400 text-amber-400')} strokeWidth={2} />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = React.useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const score = index + 1;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} star${score === 1 ? '' : 's'}`}
            disabled={disabled}
            onMouseEnter={() => setHovered(score)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(score)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                score <= active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35'
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-muted-foreground">
        {value ? `${value}/5` : 'Select a rating'}
      </span>
    </div>
  );
}
