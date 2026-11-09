import type { Metadata } from 'next';
import { CourseEditor } from '@/components/admin/course-editor';

export const metadata: Metadata = {
  title: 'New course',
};

export default function NewCoursePage() {
  return <CourseEditor />;
}
