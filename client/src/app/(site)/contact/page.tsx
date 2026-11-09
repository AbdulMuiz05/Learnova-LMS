import type { Metadata } from 'next';
import { ContactContent } from './contact-content';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the Learnova support team for help with courses, payments or your account.',
};

export default function ContactPage() {
  return <ContactContent />;
}
