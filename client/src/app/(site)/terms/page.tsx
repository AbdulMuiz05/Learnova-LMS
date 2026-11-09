import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The rules that apply when you create an account or purchase a course on Learnova.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      description="These terms govern your use of the Learnova platform, including accounts, course access, payments and acceptable use."
      updated="November 6, 2026"
      intro="By creating an account or using this platform, you agree to these terms. If you do not agree, do not use the service. If you are using the platform on behalf of an organization, you confirm that you have authority to accept these terms for that organization."
      sections={[
        {
          id: 'accounts',
          title: 'Accounts and eligibility',
          body: (
            <>
              <p>
                You must provide accurate registration information and verify your email address. You are
                responsible for keeping your password confidential and for all activity on your account. Notify
                support immediately if you believe your account has been compromised.
              </p>
              <p>
                Accounts are personal. Do not share credentials or resell access. We may suspend accounts that
                violate these terms or put the platform or other learners at risk.
              </p>
            </>
          ),
        },
        {
          id: 'course-access',
          title: 'Course access and progress',
          body: (
            <>
              <p>
                Paid course content is available only to enrolled students and administrators. Preview lessons
                are clearly labelled and may be available to signed-in users without enrollment. Attempting to
                bypass access controls, scrape protected media or share signed video URLs is prohibited.
              </p>
              <p>
                Progress is tracked from your actual lesson completions. Certificates are generated from that
                progress and do not represent formal accreditation unless explicitly stated.
              </p>
            </>
          ),
        },
        {
          id: 'payments',
          title: 'Prices, payments and enrollment',
          body: (
            <>
              <p>
                Prices are displayed on each course page. Payments are processed by Stripe. Enrollment is granted
                only after the payment provider confirms the payment through a verified webhook. A redirected
                success page alone does not grant access.
              </p>
              <p>
                Where Stripe is not configured, a clearly labelled demo checkout may be enabled outside
                production so the platform can be evaluated. Demo payments do not involve real money and are
                disabled in production deployments.
              </p>
              <p>
                Duplicate orders and duplicate enrollments are prevented by the platform. If you are charged more
                than once, contact support with your invoice or payment reference.
              </p>
            </>
          ),
        },
        {
          id: 'refunds',
          title: 'Refunds',
          body: (
            <p>
              Refunds are not processed automatically through the platform. If you believe you are entitled to a
              refund, contact support within a reasonable period of purchase with your account email and invoice
              number. Approved refunds are handled through the original payment provider, and course access may
              be revoked when a refund is issued.
            </p>
          ),
        },
        {
          id: 'acceptable-use',
          title: 'Acceptable use',
          body: (
            <>
              <p>You agree not to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Access content you have not legitimately purchased or enrolled in.</li>
                <li>Download, record, redistribute or resell course videos and materials.</li>
                <li>Upload malware, attempt to exploit the platform, or interfere with its operation.</li>
                <li>Harass instructors or other learners, or post unlawful, hateful or misleading content.</li>
                <li>Use automated scraping or bulk requests that degrade the service.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'intellectual-property',
          title: 'Intellectual property',
          body: (
            <p>
              Course videos, written lessons, exercises and platform branding are owned by Learnova or its
              licensors. Enrollment grants you a personal, non-transferable, non-exclusive license to view the
              materials for your own learning. You may not redistribute them. Code samples may be used in your
              own projects unless a lesson states otherwise.
            </p>
          ),
        },
        {
          id: 'user-content',
          title: 'Reviews, questions and other content',
          body: (
            <p>
              You retain ownership of reviews and questions you post, but grant us permission to display and
              moderate them on the platform. Reviews are limited to enrolled students. We may remove content that
              violates these terms, contains personal data about others, or is unrelated to the course.
            </p>
          ),
        },
        {
          id: 'availability',
          title: 'Availability and changes',
          body: (
            <p>
              We aim to keep the platform available but do not guarantee uninterrupted access. Courses may be
              updated, reorganized or retired. Where a course you purchased is retired, we will make reasonable
              efforts to preserve access to the materials you paid for.
            </p>
          ),
        },
        {
          id: 'liability',
          title: 'Disclaimers and limitation of liability',
          body: (
            <p>
              The platform and courses are provided “as is”. We do not guarantee specific career, employment or
              income outcomes. To the maximum extent permitted by law, Learnova is not liable for indirect,
              incidental or consequential damages arising from your use of the service. Nothing in these terms
              limits liability that cannot lawfully be limited.
            </p>
          ),
        },
        {
          id: 'termination',
          title: 'Termination',
          body: (
            <p>
              You may stop using the platform at any time. We may suspend or terminate access if these terms are
              violated, if required by law, or to protect the platform. Where an account is terminated for a
              violation, outstanding payments are not automatically refunded.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: (
            <p>
              For questions about these terms, contact{' '}
              <a href="mailto:support@learnova.local" className="font-semibold text-primary hover:underline">
                support@learnova.local
              </a>
              . These terms are governed by the laws applicable in the operator&apos;s jurisdiction, without regard
              to conflict-of-law rules.
            </p>
          ),
        },
      ]}
    />
  );
}
