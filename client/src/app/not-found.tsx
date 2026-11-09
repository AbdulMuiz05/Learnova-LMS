import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-10" />
      <div className="relative">
        <p className="text-gradient text-[6rem] font-black leading-none sm:text-[8rem]">404</p>
        <Compass className="absolute -right-6 top-4 h-10 w-10 rotate-12 text-primary/50" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">This page took a different course</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        The page you are looking for does not exist, moved, or is no longer available. Let&apos;s get
        you back to learning.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          <Home className="h-4 w-4" />
          Back to home
        </Link>
        <Link href="/courses" className={cn(buttonVariants({ variant: 'outline' }))}>
          <Search className="h-4 w-4" />
          Browse courses
        </Link>
      </div>
    </div>
  );
}
