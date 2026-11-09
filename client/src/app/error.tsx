'use client';

import * as React from 'react';
import Link from 'next/link';
import { RefreshCcw, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface client errors in the browser console for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        An unexpected error interrupted this page. You can retry, or head back home while we keep
        your data safe.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
