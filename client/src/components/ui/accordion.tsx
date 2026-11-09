'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content: React.ReactNode;
}

export function Accordion({
  items,
  defaultOpen = [],
  className,
  allowMultiple = true,
}: {
  items: AccordionItemData[];
  defaultOpen?: string[];
  className?: string;
  allowMultiple?: boolean;
}) {
  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpen);

  const toggle = (id: string) => {
    setOpenIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return allowMultiple ? [...current, id] : [id];
    });
  };

  return (
    <div className={cn('divide-y overflow-hidden rounded-2xl border bg-card shadow-soft', className)}>
      {items.map((item) => {
        const open = openIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 sm:px-6"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold sm:text-[15px]">{item.title}</span>
                {item.subtitle ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.subtitle}</span>
                ) : null}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </button>
            {open ? (
              <div className="animate-fade-in px-5 pb-5 text-sm leading-6 text-muted-foreground sm:px-6">
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
