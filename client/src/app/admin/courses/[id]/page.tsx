import type { Metadata } from 'next';
import { CourseEditor } from '@/components/admin/course-editor';

export const metadata: Metadata = {
  title: 'Edit course',
};

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseEditor courseId={id} />;
}
