import * as React from 'react';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export function LegalPage({
  title,
  description,
  updated,
  intro,
  sections,
}: {
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div>
      <section className="border-b bg-muted/20">
        <div className="container-page py-12 sm:py-16">
          <span className="eyebrow">Legal</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
          <p className="mt-4 text-xs text-muted-foreground">Last updated: {updated}</p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label="On this page">
          <div className="sticky top-24 rounded-2xl border bg-card p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ul className="mt-3 space-y-1.5">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <article className="min-w-0">
          <p className="text-sm leading-7 text-muted-foreground">{intro}</p>
          <div className="mt-8 space-y-8">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-lg font-bold">
                  <span className="mr-2 text-primary">{String(index + 1).padStart(2, '0')}.</span>
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{section.body}</div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">Questions about this document?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact{' '}
              <a href="mailto:support@learnova.local" className="font-semibold text-primary hover:underline">
                support@learnova.local
              </a>{' '}
              and our team will respond within 1–2 business days.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
