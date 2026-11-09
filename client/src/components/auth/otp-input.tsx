'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');

  const update = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, 6));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      update(index, '');
      return;
    }
    if (cleaned.length > 1) {
      const next = digits.slice();
      cleaned.split('').forEach((digit, offset) => {
        if (index + offset < 6) next[index + offset] = digit;
      });
      onChange(next.join('').slice(0, 6));
      refs.current[Math.min(index + cleaned.length, 5)]?.focus();
      return;
    }
    update(index, cleaned);
    if (index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        event.preventDefault();
        update(index, '');
        return;
      }
      if (index > 0) {
        event.preventDefault();
        update(index - 1, '');
        refs.current[index - 1]?.focus();
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Six digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-12 w-full min-w-0 rounded-lg border bg-card text-center text-lg font-bold shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60',
            invalid ? 'border-destructive' : 'border-input'
          )}
        />
      ))}
    </div>
  );
}
