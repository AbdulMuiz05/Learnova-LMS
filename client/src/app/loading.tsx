import { PageLoader } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoader label="Loading" />
    </div>
  );
}
