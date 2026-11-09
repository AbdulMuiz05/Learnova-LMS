import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Learnova collects, uses, stores and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description="This policy explains what we collect, why we collect it, and the choices you have. It describes the actual behavior of this LMS platform."
      updated="November 6, 2026"
      intro="Learnova operates a learning management platform. We aim to collect only what is needed to create your account, deliver courses, process payments and support you. This document is written for learners and administrators using the hosted instance of this application."
      sections={[
        {
          id: 'information-we-collect',
          title: 'Information we collect',
          body: (
            <>
              <p>
                <strong className="text-foreground">Account data:</strong> your name, email address, hashed
                password, role, profile bio and optional avatar. Passwords are hashed with bcrypt and are never
                stored or returned in plain text.
              </p>
              <p>
                <strong className="text-foreground">Learning data:</strong> enrollments, lesson completion,
                course progress, last accessed lesson, questions you ask, answers, reviews and ratings.
              </p>
              <p>
                <strong className="text-foreground">Transaction data:</strong> order records, amounts, currency,
                payment provider, payment status, invoice number and provider session identifiers. Full card
                numbers and CVV codes are handled by Stripe and are never stored by this platform.
              </p>
              <p>
                <strong className="text-foreground">Technical data:</strong> authentication cookies, basic request
                logs needed to operate and secure the service, and notification preferences stored locally in
                your browser.
              </p>
            </>
          ),
        },
        {
          id: 'cookies',
          title: 'Cookies and local storage',
          body: (
            <>
              <p>
                We use HTTP-only, secure-compatible cookies for access and refresh tokens. These cookies are
                required for authentication and cannot be disabled while you remain signed in.
              </p>
              <p>
                The browser may also store your theme choice, notification sound preference and, in development
                mode without email delivery, a temporary verification code in session storage. These values stay
                on your device.
              </p>
            </>
          ),
        },
        {
          id: 'how-we-use',
          title: 'How we use information',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Create and secure your account, verify your email and reset passwords.</li>
              <li>Grant access to enrolled courses and protect paid lesson content.</li>
              <li>Track progress, issue certificates and display your learning dashboard.</li>
              <li>Process orders, issue invoices and prevent duplicate payments or enrollments.</li>
              <li>Enable reviews, lesson Q&amp;A and administrator responses.</li>
              <li>Send transactional email such as verification codes and welcome messages.</li>
              <li>Detect abuse, rate-limit requests and keep the platform reliable.</li>
            </ul>
          ),
        },
        {
          id: 'sharing',
          title: 'Service providers and sharing',
          body: (
            <>
              <p>
                We share the minimum necessary data with infrastructure providers that operate the platform:
                MongoDB Atlas (database hosting), Cloudinary (images and protected video delivery), Stripe
                (payment processing), Upstash Redis (optional caching) and an SMTP provider for transactional
                email. Each provider processes data under its own terms and privacy policy.
              </p>
              <p>
                We do not sell your personal information. We may disclose information when required by law or
                when necessary to protect the rights, safety and security of the platform and its users.
              </p>
            </>
          ),
        },
        {
          id: 'retention',
          title: 'Retention',
          body: (
            <p>
              Account and learning records are retained while your account is active. Order and invoice records
              may be retained longer where required for accounting, tax or fraud-prevention purposes. Tokens
              expire on a fixed schedule, and expired refresh tokens are removed from your account record.
            </p>
          ),
        },
        {
          id: 'security',
          title: 'Security',
          body: (
            <p>
              Authentication uses short-lived access cookies and rotating refresh cookies stored as hashes.
              Passwords are hashed, lesson video URLs are signed per request, payment webhooks are verified, and
              administrative endpoints are protected on the server. No system is completely secure; if you
              suspect unauthorized access, change your password immediately and contact support.
            </p>
          ),
        },
        {
          id: 'your-choices',
          title: 'Your choices and rights',
          body: (
            <>
              <p>
                You can update your name, bio and avatar from your account settings, and change your password at
                any time. You can delete your own notifications from the notifications page.
              </p>
              <p>
                To request access, correction or deletion of account data, contact support from the email address
                associated with your account. Some records, such as paid invoices, may need to be retained for
                legal or accounting reasons.
              </p>
            </>
          ),
        },
        {
          id: 'children',
          title: 'Children',
          body: (
            <p>
              The platform is intended for learners aged 16 and older. We do not knowingly collect personal
              information from children below that age. Contact us if you believe a child has created an account.
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          body: (
            <p>
              We may update this policy as the platform evolves. Material changes will be reflected on this page
              with a new update date. Continued use of the platform after a change means you accept the revised
              policy.
            </p>
          ),
        },
      ]}
    />
  );
}
