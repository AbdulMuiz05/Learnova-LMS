import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LearnView } from './learn-view';

export const metadata: Metadata = {
  title: 'Learning workspace',
  description: 'Watch lessons, track progress and ask questions.',
};

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return (
    <Suspense fallback={<div className="skeleton-shimmer min-h-screen" />}>
      <LearnView courseId={courseId} />
    </Suspense>
  );
}
