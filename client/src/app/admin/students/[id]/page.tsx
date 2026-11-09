import type { Metadata } from 'next';
import { StudentDetail } from './student-detail';

export const metadata: Metadata = {
  title: 'Student profile',
};

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetail userId={id} />;
}
