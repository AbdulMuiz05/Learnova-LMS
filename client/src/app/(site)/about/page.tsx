import type { Metadata } from 'next';
import { AboutContent } from './about-content';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why Learnova exists, how we teach, and what learners can expect.',
};

export default function AboutPage() {
  return <AboutContent />;
}
