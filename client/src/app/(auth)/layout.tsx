import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

const highlights = [
  { icon: BookOpenCheck, text: 'Project-based courses built for the modern workplace' },
  { icon: ShieldCheck, text: 'Secure checkout, verified payments and lifetime access' },
  { icon: Sparkles, text: 'Real-time instructor support and answers on every lesson' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-70" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-primary/30 blur-[90px]" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-sky-500/20 blur-[100px]" />

        <div className="relative">
          <Logo className="[&_span]:text-white" />
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
            Learnova
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight xl:text-[2.75rem]">
            Learn the skills that move your career forward.
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/65">
            Ship real projects, get answers from working engineers, and track every step of your
            progress in one beautiful workspace.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4 text-white" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-white/50">
          <span className="h-px flex-1 bg-white/15" />
          Trusted by ambitious learners worldwide
          <span className="h-px flex-1 bg-white/15" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between p-5 sm:p-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
