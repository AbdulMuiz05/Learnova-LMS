'use client';

import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { useGetPublicSettingsQuery } from '@/services/siteApi';

const platformLinks = [
  { href: '/courses', label: 'All courses' },
  { href: '/dashboard', label: 'My learning' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
];

const resourceLinks = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of service' },
  { href: '/contact', label: 'Support' },
];

export function SiteFooter() {
  const { data: settings } = useGetPublicSettingsQuery();

  const socials = [
    { href: settings?.socials?.twitter, label: 'Twitter', icon: TwitterIcon },
    { href: settings?.socials?.facebook, label: 'Facebook', icon: Facebook },
    { href: settings?.socials?.linkedin, label: 'LinkedIn', icon: Linkedin },
    { href: settings?.socials?.youtube, label: 'YouTube', icon: Youtube },
    { href: settings?.socials?.instagram, label: 'Instagram', icon: Instagram },
  ].filter((social) => Boolean(social.href));

  return (
    <footer className="border-t bg-muted/30">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            {settings?.footerText ??
              'Practical, project-based education for modern engineers. Learn the skills that move your career forward.'}
          </p>
          {socials.length ? (
            <div className="mt-5 flex items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold">Platform</h3>
          <ul className="mt-4 space-y-2.5">
            {platformLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Resources</h3>
          <ul className="mt-4 space-y-2.5">
            {resourceLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${settings?.supportEmail ?? 'support@learnova.local'}`} className="hover:text-foreground">
                {settings?.supportEmail ?? 'support@learnova.local'}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{settings?.phone ?? '+1 (555) 010-2030'}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{settings?.address ?? 'Remote-first · Worldwide'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings?.siteName ?? 'Learnova'} LMS. All rights reserved.
          </p>
          <p>{settings?.tagline ?? 'Learn. Build. Ship.'}</p>
        </div>
      </div>
    </footer>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.23l-4.88-6.38L6.5 22H3.37l7.24-8.28L2.8 2h6.39l4.41 5.83L18.9 2Zm-1.09 18.1h1.72L7.28 3.8H5.43L17.81 20.1Z" />
    </svg>
  );
}
