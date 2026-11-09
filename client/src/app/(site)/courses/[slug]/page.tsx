import type { Metadata } from 'next';
import { CourseDetailView } from './course-detail-view';

export const metadata: Metadata = {
  title: 'Course details',
  description: 'Review the curriculum, instructor and reviews, then enroll securely.',
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CourseDetailView slug={slug} />;
}
